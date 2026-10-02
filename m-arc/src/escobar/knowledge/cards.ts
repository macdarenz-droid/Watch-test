/**
 * Knowledge cards (§16.1): curated evidence the model cites as ⟦k:id⟧ before stating
 * any general number. Keyword and tag scoring; works offline.
 */
import CARDS from '@/data/knowledge.json';

export interface KnowledgeCard {
  id: string;
  title: string;
  statement: string;
  numbers: Array<{ label: string; value: number; unit: string }>;
  rating: 'strong' | 'moderate' | 'emerging' | 'debated';
  /** AUD-20: `pmid`/`doi` only when verified on PubMed or Crossref; never a URL in src/. */
  sources: Array<{ title: string; year: number; url?: string; pmid?: string; doi?: string }>;
  tags: string[];
}

export const KNOWLEDGE: KnowledgeCard[] = CARDS as KnowledgeCard[];
export const CARD_BY_ID: Record<string, KnowledgeCard> = Object.fromEntries(KNOWLEDGE.map(c => [c.id, c]));

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'or', 'is', 'how', 'what', 'much', 'many', 'my', 'i', 'for', 'do', 'should', 'in', 'on', 'it', 'does']);

export function searchCards(query: string, limit = 4): KnowledgeCard[] {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(' ').filter(w => w.length > 2 && !STOP.has(w));
  const scored = KNOWLEDGE.map(c => {
    let score = 0;
    for (const t of c.tags) { const tt = norm(t); if (` ${q} `.includes(` ${tt} `)) score += 5 + tt.split(' ').length; else if (words.some(w => tt.split(' ').includes(w))) score += 2; }
    const title = norm(c.title);
    for (const w of words) { if (title.includes(w)) score += 3; else if (norm(c.statement).includes(w)) score += 1; }
    return { c, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(x => x.c);
}

/** Sources stay in knowledge.json as data; they never reach the model or the drawer (owner, LR-23). */
export function lookupKnowledge(input: { query?: string; ids?: string[] }): { cards: Array<Omit<KnowledgeCard, 'tags' | 'sources'>> } {
  const byId = (input.ids ?? []).map(id => CARD_BY_ID[id]).filter((c): c is KnowledgeCard => !!c);
  const found = byId.length ? byId : searchCards(input.query ?? '', 4);
  return { cards: found.slice(0, 4).map(({ tags: _t, sources: _s, ...c }) => c) };
}
