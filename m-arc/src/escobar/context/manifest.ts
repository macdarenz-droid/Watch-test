/**
 * The palace manifest (§7.3): every entry plus the method index and component list,
 * sent by the app and cached by the Worker for an hour. Built deterministically, so an
 * unchanged app yields a byte-identical block and the same hash.
 */
import { PALACE } from '../palace/registry';
import { METHOD_INDEX } from '../knowledge/methods';
import { SHOW_COMPONENT_IDS } from '@/core/models';
import { KNOWLEDGE } from '../knowledge/cards';
import { fnv } from '../hash';

export interface PalaceManifest {
  appVersion: string;
  entries: Array<{ id: string; title: string; where: string; what: string; how?: string[]; methods?: string[] }>;
  methods: Record<string, string>;
  components: string[];
  knowledge: Array<{ id: string; title: string }>;
}

export function buildManifest(appVersion: string): { hash: string; body: PalaceManifest } {
  const body: PalaceManifest = {
    appVersion,
    entries: PALACE.map(p => ({ id: p.id, title: p.title, where: p.where, what: p.what, ...(p.how ? { how: p.how } : {}), ...(p.methods ? { methods: p.methods } : {}) })),
    methods: { ...METHOD_INDEX },
    components: [...SHOW_COMPONENT_IDS],
    knowledge: KNOWLEDGE.map(c => ({ id: c.id, title: c.title })),
  };
  return { hash: fnv(JSON.stringify(body)), body };
}
