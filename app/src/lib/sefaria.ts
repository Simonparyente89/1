/** Loads texts from the free Sefaria API (https://developers.sefaria.org). */

export interface Segment {
  /** Address within the work, e.g. [1, 31] for chapter 1 verse 31 */
  address: number[];
  he: string;
  en: string;
  /** Rashi comments on this segment (Chumash only) */
  rashi?: { he: string; en: string }[];
}

export interface Passage {
  ref: string;
  heRef: string;
  segments: Segment[];
}

type Nested = string | Nested[];

interface SefariaResponse {
  ref: string;
  heRef?: string;
  sections?: number[];
  toSections?: number[];
  text?: Nested;
  he?: Nested;
  error?: string;
}

/**
 * Flatten Sefaria's nested text arrays into leaf strings with full addresses.
 * Sefaria drops the leading levels that are fixed by the ref, so a ref like
 * Genesis 1:31-2:3 returns [[v31], [v1, v2, v3]] while Genesis 1:1-5 returns
 * [v1..v5] and Genesis 1:1 returns a single string.
 */
export function flattenText(
  text: Nested | undefined,
  sections: number[] = [],
  toSections: number[] = sections,
): Map<string, { address: number[]; text: string }> {
  const out = new Map<string, { address: number[]; text: string }>();
  if (text === undefined || text === null) return out;
  let fixed = 0;
  while (fixed < sections.length && sections[fixed] === (toSections[fixed] ?? sections[fixed])) fixed++;

  const walk = (node: Nested, level: number, address: number[], first: boolean) => {
    if (typeof node === 'string') {
      if (node.trim()) out.set(address.join(':'), { address, text: node });
      return;
    }
    if (!Array.isArray(node)) return;
    const start = first && level < sections.length ? sections[level] : 1;
    node.forEach((child, i) => walk(child, level + 1, [...address, start + i], first && i === 0));
  };

  if (typeof text === 'string') {
    out.set(sections.join(':'), { address: sections, text });
  } else {
    walk(text, fixed, sections.slice(0, fixed), true);
  }
  return out;
}

const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'BR', 'SMALL', 'BIG', 'U', 'P']);

/** Keep only simple formatting tags; drop footnotes and anything else. */
export function sanitize(html: string): string {
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]+>/g, '');
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const clean = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    if (el.classList.contains('footnote') || el.classList.contains('footnote-marker')) return '';
    if (el.tagName === 'SUP') return '';
    const inner = Array.from(el.childNodes).map(clean).join('');
    if (ALLOWED.has(el.tagName)) {
      const tag = el.tagName.toLowerCase();
      return tag === 'br' ? '<br>' : `<${tag}>${inner}</${tag}>`;
    }
    return inner;
  };
  return clean(doc.body.firstChild!);
}

const memo = new Map<string, Promise<SefariaResponse>>();

async function fetchRef(ref: string): Promise<SefariaResponse> {
  const key = ref.replace(/ /g, '_');
  let p = memo.get(key);
  if (!p) {
    p = fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(key)}?context=0&commentary=0&pad=0`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Sefaria returned ${r.status}`);
        const data = (await r.json()) as SefariaResponse;
        if (data.error) throw new Error(data.error);
        return data;
      })
      .catch((e) => {
        memo.delete(key);
        throw e;
      });
    memo.set(key, p);
  }
  return p;
}

export async function loadPassage(ref: string, withRashi = false): Promise<Passage> {
  const [base, rashi] = await Promise.all([
    fetchRef(ref),
    withRashi ? fetchRef(`Rashi on ${ref}`).catch(() => null) : Promise.resolve(null),
  ]);
  const he = flattenText(base.he, base.sections, base.toSections);
  const en = flattenText(base.text, base.sections, base.toSections);
  const keys = Array.from(new Set([...he.keys(), ...en.keys()]));

  const rashiByVerse = new Map<string, { he: string; en: string }[]>();
  if (rashi) {
    const rHe = flattenText(rashi.he, rashi.sections, rashi.toSections);
    const rEn = flattenText(rashi.text, rashi.sections, rashi.toSections);
    const rKeys = Array.from(new Set([...rHe.keys(), ...rEn.keys()]));
    for (const k of rKeys) {
      const addr = (rHe.get(k) ?? rEn.get(k))!.address;
      const verseKey = addr.slice(0, -1).join(':');
      const list = rashiByVerse.get(verseKey) ?? [];
      list.push({ he: sanitize(rHe.get(k)?.text ?? ''), en: sanitize(rEn.get(k)?.text ?? '') });
      rashiByVerse.set(verseKey, list);
    }
  }

  const segments: Segment[] = keys.map((k) => {
    const address = (he.get(k) ?? en.get(k))!.address;
    return {
      address,
      he: sanitize(he.get(k)?.text ?? ''),
      en: sanitize(en.get(k)?.text ?? ''),
      rashi: rashiByVerse.get(k),
    };
  });
  return { ref: base.ref, heRef: base.heRef ?? '', segments };
}
