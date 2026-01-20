export interface PluginProvider {
  name: string;
  description: string;
  [key: string]: unknown;
}

export interface PluginAction {
  name: string;
  description: string;
  execute?: (...args: unknown[]) => Promise<unknown>;
  [key: string]: unknown;
}

export interface LoadedPlugin {
  name: string;
  version: string;
  description: string;
  providers: PluginProvider[] | Record<string, PluginProvider> | Record<string, unknown>;
  actions: PluginAction[] | Record<string, PluginAction> | Record<string, unknown>;
  services?: Record<string, unknown>;
}

export interface PluginConfig {
  name: string;
  credentials?: Record<string, string>;
  options?: Record<string, unknown>;
}

export async function loadPlugin(config: PluginConfig): Promise<LoadedPlugin | null> {
  try {
    switch (config.name) {
      case 'plugin-blockchain':
      case '@elizagotchi/plugin-blockchain': {
        const { blockchainPlugin } = await import('@elizagotchi/plugin-blockchain');
        return blockchainPlugin;
      }

      case 'plugin-github':
      case '@elizagotchi/plugin-github': {
        const { createGitHubPlugin } = await import('@elizagotchi/plugin-github');
        const accessToken = config.credentials?.accessToken;
        if (!accessToken) {
          throw new Error('GitHub plugin requires accessToken');
        }
        return createGitHubPlugin(accessToken);
      }

      case 'plugin-rss':
      case '@elizagotchi/plugin-rss': {
        const { rssPlugin } = await import('@elizagotchi/plugin-rss');
        return rssPlugin;
      }

      // plugin-twitch: Not yet implemented
      // case 'plugin-twitch':
      // case '@elizagotchi/plugin-twitch': { ... }

      default:
        console.warn(`Unknown plugin: ${config.name}`);
        return null;
    }
  } catch (error) {
    console.error(`Failed to load plugin ${config.name}:`, error);
    return null;
  }
}

export async function loadPlugins(
  configs: PluginConfig[]
): Promise<Map<string, LoadedPlugin>> {
  const plugins = new Map<string, LoadedPlugin>();

  for (const config of configs) {
    const plugin = await loadPlugin(config);
    if (plugin) {
      plugins.set(config.name, plugin);
    }
  }

  return plugins;
}

export function getProviderFromPlugin(
  plugin: LoadedPlugin,
  providerName: string
): PluginProvider | undefined {
  if (Array.isArray(plugin.providers)) {
    return plugin.providers.find((p) => p.name === providerName);
  }
  const provider = (plugin.providers as Record<string, unknown>)[providerName];
  return provider as PluginProvider | undefined;
}

export function getActionFromPlugin(
  plugin: LoadedPlugin,
  actionName: string
): PluginAction | undefined {
  if (Array.isArray(plugin.actions)) {
    return plugin.actions.find((a) => a.name === actionName);
  }
  const action = (plugin.actions as Record<string, unknown>)[actionName];
  return action as PluginAction | undefined;
}
