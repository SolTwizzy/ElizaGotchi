/**
 * Global type declarations for ElizaOS plugins
 * These are used by multiple packages in the monorepo
 */

declare module '@elizaos/plugin-bootstrap' {
  import type { Plugin } from '@elizaos/core';
  export const bootstrapPlugin: Plugin;
  const _default: Plugin;
  export default _default;
}

declare module '@elizaos/plugin-sql' {
  import type { Plugin } from '@elizaos/core';
  export const sqlPlugin: Plugin;
  const _default: Plugin;
  export default _default;
}

declare module '@elizaos/plugin-telegram' {
  import type { Plugin } from '@elizaos/core';
  export const telegramPlugin: Plugin;
  const _default: Plugin;
  export default _default;
}
