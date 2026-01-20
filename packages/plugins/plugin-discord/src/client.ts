import {
  Client,
  GatewayIntentBits,
  Partials,
  Message,
  TextChannel,
  Guild,
  GuildMember,
  User,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type MessageCreateOptions,
  type MessageEditOptions,
} from 'discord.js';

export interface DiscordConfig {
  token: string;
  intents?: GatewayIntentBits[];
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    bot: boolean;
  };
  channel: {
    id: string;
    name: string;
    type: ChannelType;
  };
  guild?: {
    id: string;
    name: string;
  };
  timestamp: Date;
  mentions: {
    users: string[];
    roles: string[];
    channels: string[];
  };
  replyTo?: string;
}

export interface SendMessageOptions {
  content?: string;
  embeds?: EmbedData[];
  buttons?: ButtonData[];
  replyTo?: string;
  ephemeral?: boolean;
}

export interface EmbedData {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  thumbnail?: string;
  image?: string;
  footer?: { text: string; iconUrl?: string };
  author?: { name: string; iconUrl?: string; url?: string };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: Date;
}

export interface ButtonData {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
  url?: string;
  disabled?: boolean;
  emoji?: string;
}

export type MessageHandler = (message: DiscordMessage) => void | Promise<void>;
export type ButtonHandler = (interaction: { customId: string; userId: string; channelId: string; guildId?: string }) => void | Promise<void>;

const DEFAULT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
];

export class DiscordClient {
  private client: Client;
  private config: DiscordConfig;
  private messageHandlers: MessageHandler[] = [];
  private buttonHandlers: ButtonHandler[] = [];
  private connected: boolean = false;

  constructor(config: DiscordConfig) {
    this.config = config;
    this.client = new Client({
      intents: config.intents ?? DEFAULT_INTENTS,
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;

      const discordMessage = this.transformMessage(message);

      for (const handler of this.messageHandlers) {
        try {
          await handler(discordMessage);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      const buttonInteraction = {
        customId: interaction.customId,
        userId: interaction.user.id,
        channelId: interaction.channelId,
        guildId: interaction.guildId ?? undefined,
      };

      for (const handler of this.buttonHandlers) {
        try {
          await handler(buttonInteraction);
        } catch (error) {
          console.error('Error in button handler:', error);
        }
      }

      // Acknowledge the interaction
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferUpdate().catch(() => {});
      }
    });

    this.client.on('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });
  }

  private transformMessage(message: Message): DiscordMessage {
    return {
      id: message.id,
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName: message.author.displayName,
        bot: message.author.bot,
      },
      channel: {
        id: message.channel.id,
        name: 'name' in message.channel ? (message.channel.name ?? 'Unknown') : 'DM',
        type: message.channel.type,
      },
      guild: message.guild
        ? {
            id: message.guild.id,
            name: message.guild.name,
          }
        : undefined,
      timestamp: message.createdAt,
      mentions: {
        users: message.mentions.users.map((u) => u.id),
        roles: message.mentions.roles.map((r) => r.id),
        channels: message.mentions.channels.map((c) => c.id),
      },
      replyTo: message.reference?.messageId ?? undefined,
    };
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    await this.client.login(this.config.token);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    await this.client.destroy();
    this.connected = false;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onButton(handler: ButtonHandler): () => void {
    this.buttonHandlers.push(handler);
    return () => {
      const index = this.buttonHandlers.indexOf(handler);
      if (index > -1) {
        this.buttonHandlers.splice(index, 1);
      }
    };
  }

  async sendMessage(channelId: string, options: SendMessageOptions): Promise<string | null> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel or not a text channel');
    }

    const messageOptions: MessageCreateOptions = {};

    if (options.content) {
      messageOptions.content = options.content;
    }

    if (options.embeds && options.embeds.length > 0) {
      messageOptions.embeds = options.embeds.map((embed) => {
        const builder = new EmbedBuilder();
        if (embed.title) builder.setTitle(embed.title);
        if (embed.description) builder.setDescription(embed.description);
        if (embed.color) builder.setColor(embed.color);
        if (embed.url) builder.setURL(embed.url);
        if (embed.thumbnail) builder.setThumbnail(embed.thumbnail);
        if (embed.image) builder.setImage(embed.image);
        if (embed.footer) builder.setFooter(embed.footer);
        if (embed.author) builder.setAuthor(embed.author);
        if (embed.fields) builder.addFields(embed.fields);
        if (embed.timestamp) builder.setTimestamp(embed.timestamp);
        return builder;
      });
    }

    if (options.buttons && options.buttons.length > 0) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (const btn of options.buttons) {
        const button = new ButtonBuilder()
          .setLabel(btn.label)
          .setStyle(this.getButtonStyle(btn.style));

        if (btn.style === 'link' && btn.url) {
          button.setURL(btn.url);
        } else {
          button.setCustomId(btn.id);
        }

        if (btn.disabled) button.setDisabled(true);
        if (btn.emoji) button.setEmoji(btn.emoji);

        row.addComponents(button);
      }
      messageOptions.components = [row];
    }

    if (options.replyTo) {
      messageOptions.reply = { messageReference: options.replyTo };
    }

    const textChannel = channel as TextChannel;
    const sent = await textChannel.send(messageOptions);
    return sent.id;
  }

  private getButtonStyle(style: ButtonData['style']): ButtonStyle {
    const styles: Record<ButtonData['style'], ButtonStyle> = {
      primary: ButtonStyle.Primary,
      secondary: ButtonStyle.Secondary,
      success: ButtonStyle.Success,
      danger: ButtonStyle.Danger,
      link: ButtonStyle.Link,
    };
    return styles[style];
  }

  async editMessage(channelId: string, messageId: string, options: SendMessageOptions): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel');
    }

    const textChannel = channel as TextChannel;
    const message = await textChannel.messages.fetch(messageId);

    const editOptions: MessageEditOptions = {};
    if (options.content) editOptions.content = options.content;

    await message.edit(editOptions);
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel');
    }

    const textChannel = channel as TextChannel;
    const message = await textChannel.messages.fetch(messageId);
    await message.delete();
  }

  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Invalid channel');
    }

    const textChannel = channel as TextChannel;
    const message = await textChannel.messages.fetch(messageId);
    await message.react(emoji);
  }

  async getGuild(guildId: string): Promise<Guild | null> {
    try {
      return await this.client.guilds.fetch(guildId);
    } catch {
      return null;
    }
  }

  async getGuildMember(guildId: string, userId: string): Promise<GuildMember | null> {
    const guild = await this.getGuild(guildId);
    if (!guild) return null;

    try {
      return await guild.members.fetch(userId);
    } catch {
      return null;
    }
  }

  async kickMember(guildId: string, userId: string, reason?: string): Promise<boolean> {
    const member = await this.getGuildMember(guildId, userId);
    if (!member) return false;

    try {
      await member.kick(reason);
      return true;
    } catch {
      return false;
    }
  }

  async banMember(guildId: string, userId: string, reason?: string, deleteMessageDays?: number): Promise<boolean> {
    const guild = await this.getGuild(guildId);
    if (!guild) return false;

    try {
      await guild.members.ban(userId, {
        reason,
        deleteMessageSeconds: (deleteMessageDays ?? 0) * 86400,
      });
      return true;
    } catch {
      return false;
    }
  }

  async unbanMember(guildId: string, userId: string): Promise<boolean> {
    const guild = await this.getGuild(guildId);
    if (!guild) return false;

    try {
      await guild.members.unban(userId);
      return true;
    } catch {
      return false;
    }
  }

  async timeoutMember(guildId: string, userId: string, durationMs: number, reason?: string): Promise<boolean> {
    const member = await this.getGuildMember(guildId, userId);
    if (!member) return false;

    try {
      await member.timeout(durationMs, reason);
      return true;
    } catch {
      return false;
    }
  }

  async assignRole(guildId: string, userId: string, roleId: string): Promise<boolean> {
    const member = await this.getGuildMember(guildId, userId);
    if (!member) return false;

    try {
      await member.roles.add(roleId);
      return true;
    } catch {
      return false;
    }
  }

  async removeRole(guildId: string, userId: string, roleId: string): Promise<boolean> {
    const member = await this.getGuildMember(guildId, userId);
    if (!member) return false;

    try {
      await member.roles.remove(roleId);
      return true;
    } catch {
      return false;
    }
  }

  getUser(): User | null {
    return this.client.user;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getClient(): Client {
    return this.client;
  }
}
