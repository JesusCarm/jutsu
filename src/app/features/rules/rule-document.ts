export type RuleBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'image'; readonly alt: string; readonly path: string }
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | { readonly kind: 'table'; readonly headers: readonly string[]; readonly rows: readonly (readonly string[])[] };
export interface RuleSection {
  readonly anchor: string;
  readonly title: string;
  readonly icon?: string;
  readonly blocks: readonly RuleBlock[];
}

// This reader intentionally supports the reference's small Markdown vocabulary.
// Raw HTML is never rendered. Only local icon and diagram SVGs can be loaded.
export function isRuleImage(path: string): boolean {
  return /^assets\/(?:icons\/|diagrams\/(?:(?:en|es)\/)?)\w[\w-]*\.svg$/.test(path);
}

export function readRuleDocument(markdown: string): ReadonlyMap<string, RuleSection> {
  const sections = new Map<string, RuleSection>();
  const chunks = markdown.replace(/\r\n?/g, '\n').split(/<a\s+id="([a-z0-9-]+)"\s*><\/a>/g);
  for (let index = 1; index < chunks.length; index += 2) {
    const anchor = chunks[index];
    const content = chunks[index + 1].trim();
    const heading = /^###\s+(.+)\n?/.exec(content);
    if (!heading || sections.has(anchor)) throw new Error(`Invalid rule section: ${anchor}`);
    const iconMatch = /!\[[^\]]*\]\(([^)]+)\)/.exec(heading[1]);
    const title = heading[1].replace(/!\[[^\]]*\]\([^)]+\)\s*/g, '').trim();
    const blocks: RuleBlock[] = [];
    for (const block of content.slice(heading[0].length).trim().split(/\n\s*\n/).filter(Boolean)) {
      const image = /^!\[([^\]]*)\]\((.+)\)$/.exec(block.trim());
      if (image) {
        if (!isRuleImage(image[2])) throw new Error(`Unsupported rule image: ${image[2]}`);
        blocks.push({ kind: 'image', alt: image[1], path: image[2] });
      } else if (block.startsWith('|')) {
        const rows = block.split('\n').map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
        if (rows.length < 2 || !rows[1].every((cell) => /^:?-+:?$/.test(cell))) throw new Error(`Invalid rule table: ${anchor}`);
        blocks.push({ kind: 'table', headers: rows[0], rows: rows.slice(2) });
      } else if (/^[-*] /.test(block)) {
        blocks.push({ kind: 'list', items: block.split('\n').map((line) => line.replace(/^[-*] /, '')) });
      } else blocks.push({ kind: 'paragraph', text: block.trim() });
    }
    if (iconMatch && !isRuleImage(iconMatch[1])) throw new Error(`Unsupported rule icon: ${iconMatch[1]}`);
    sections.set(anchor, { anchor, title, icon: iconMatch?.[1], blocks });
  }
  return sections;
}
