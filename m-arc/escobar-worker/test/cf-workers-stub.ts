/** Node stand-in for `cloudflare:workers` (the Worker runtime module) so vitest can load Durable Objects. */
export class DurableObject {
  constructor(public ctx: any, public env: any) {}
}
