export type LearnTocItem = {
  id: string;
  level: 2 | 3;
  text: string;
};

const decodeEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const getHeadingText = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "section";

const uniqueId = (baseId: string, usedIds: Set<string>) => {
  let id = baseId;
  let index = 2;
  while (usedIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }
  usedIds.add(id);
  return id;
};

/**
 * Adds stable IDs to article H2/H3 elements and returns a matching table of contents.
 * Ghost owns the source markup; this only augments headings at render time.
 */
export const buildLearnTableOfContents = (html?: string | null) => {
  const items: LearnTocItem[] = [];
  const usedIds = new Set<string>();
  const source = html ?? "";

  const content = source.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, rawLevel, attributes, innerHtml) => {
    const text = getHeadingText(innerHtml);
    if (!text) return match;

    const level = Number(rawLevel) as LearnTocItem["level"];
    const existingId = attributes.match(/\sid\s*=\s*["']([^"']+)["']/i)?.[1];
    const id = existingId ? uniqueId(existingId, usedIds) : uniqueId(slugify(text), usedIds);
    const nextAttributes = existingId
      ? attributes.replace(/(\sid\s*=\s*["'])[^"']+(["'])/i, `$1${id}$2`)
      : `${attributes} id="${id}"`;

    items.push({ id, level, text });
    return `<h${level}${nextAttributes}>${innerHtml}</h${level}>`;
  });

  return { content, items };
};
