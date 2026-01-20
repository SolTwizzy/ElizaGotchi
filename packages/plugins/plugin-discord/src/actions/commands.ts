import type { DiscordClient, DiscordMessage, EmbedData } from '../client';

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  cooldown?: number; // milliseconds
  permissions?: CommandPermission[];
  execute: (ctx: CommandContext) => Promise<CommandResponse>;
}

export interface CommandContext {
  message: DiscordMessage;
  args: string[];
  command: string;
  prefix: string;
  client: DiscordClient;
}

export interface CommandResponse {
  content?: string;
  embed?: EmbedData;
  success: boolean;
  error?: string;
}

export type CommandPermission = 'admin' | 'moderator' | 'everyone';

export interface CommandConfig {
  prefix: string;
  allowBots?: boolean;
  ignoreDMs?: boolean;
}

export function createCommandsAction(client: DiscordClient, config: CommandConfig) {
  const commands = new Map<string, CommandDefinition>();
  const cooldowns = new Map<string, Map<string, number>>();

  const findCommand = (name: string): CommandDefinition | undefined => {
    const cmd = commands.get(name.toLowerCase());
    if (cmd) return cmd;

    // Check aliases
    for (const command of commands.values()) {
      if (command.aliases?.includes(name.toLowerCase())) {
        return command;
      }
    }

    return undefined;
  };

  const checkCooldown = (command: CommandDefinition, userId: string): number => {
    if (!command.cooldown) return 0;

    const commandCooldowns = cooldowns.get(command.name) ?? new Map();
    const lastUsed = commandCooldowns.get(userId) ?? 0;
    const remaining = (lastUsed + command.cooldown) - Date.now();

    return remaining > 0 ? remaining : 0;
  };

  const setCooldown = (command: CommandDefinition, userId: string): void => {
    if (!command.cooldown) return;

    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Map());
    }

    cooldowns.get(command.name)!.set(userId, Date.now());
  };

  return {
    name: 'commands',
    description: 'Command handling for Discord bot',

    register(command: CommandDefinition): void {
      commands.set(command.name.toLowerCase(), command);
    },

    unregister(name: string): boolean {
      return commands.delete(name.toLowerCase());
    },

    getCommands(): CommandDefinition[] {
      return Array.from(commands.values());
    },

    getCommand(name: string): CommandDefinition | undefined {
      return findCommand(name);
    },

    async handleMessage(message: DiscordMessage): Promise<boolean> {
      // Check if it's a command
      if (!message.content.startsWith(config.prefix)) return false;

      // Check if we should ignore
      if (config.ignoreDMs && !message.guild) return false;
      if (!config.allowBots && message.author.bot) return false;

      // Parse command and args
      const withoutPrefix = message.content.slice(config.prefix.length).trim();
      const args = withoutPrefix.split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return false;

      const command = findCommand(commandName);
      if (!command) return false;

      // Check cooldown
      const cooldownRemaining = checkCooldown(command, message.author.id);
      if (cooldownRemaining > 0) {
        await client.sendMessage(message.channel.id, {
          content: `⏳ Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before using this command again.`,
        });
        return true;
      }

      // Execute command
      const ctx: CommandContext = {
        message,
        args,
        command: commandName,
        prefix: config.prefix,
        client,
      };

      try {
        const response = await command.execute(ctx);

        if (response.content || response.embed) {
          await client.sendMessage(message.channel.id, {
            content: response.content,
            embeds: response.embed ? [response.embed] : undefined,
            replyTo: message.id,
          });
        }

        if (response.success) {
          setCooldown(command, message.author.id);
        }

        return true;
      } catch (error) {
        console.error(`Error executing command ${command.name}:`, error);
        await client.sendMessage(message.channel.id, {
          content: '❌ An error occurred while executing this command.',
          replyTo: message.id,
        });
        return true;
      }
    },

    // Built-in help command
    registerHelpCommand(): void {
      this.register({
        name: 'help',
        description: 'Shows available commands',
        aliases: ['commands', 'h'],

        async execute(ctx): Promise<CommandResponse> {
          const commandList = Array.from(commands.values())
            .map((cmd) => `\`${config.prefix}${cmd.name}\` - ${cmd.description}`)
            .join('\n');

          return {
            success: true,
            embed: {
              title: '📚 Available Commands',
              description: commandList || 'No commands available.',
              color: 0x0099ff,
              footer: { text: `Use ${config.prefix}help <command> for more details` },
            },
          };
        },
      });
    },

    // Register multiple commands at once
    registerMany(commandDefs: CommandDefinition[]): void {
      for (const cmd of commandDefs) {
        this.register(cmd);
      }
    },

    // Built-in ping command
    registerPingCommand(): void {
      this.register({
        name: 'ping',
        description: 'Check bot latency',

        async execute(): Promise<CommandResponse> {
          const start = Date.now();
          return {
            success: true,
            content: `🏓 Pong! Latency: ${Date.now() - start}ms`,
          };
        },
      });
    },

    getConfig(): CommandConfig {
      return config;
    },
  };
}

export type CommandsAction = ReturnType<typeof createCommandsAction>;
