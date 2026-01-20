import type { DiscordClient, SendMessageOptions, EmbedData, ButtonData } from '../client';

export interface SendMessageInput {
  channelId: string;
  content?: string;
  embeds?: EmbedData[];
  buttons?: ButtonData[];
  replyTo?: string;
}

export function createSendMessageAction(client: DiscordClient) {
  return {
    name: 'send-message',
    description: 'Sends a message to a Discord channel',

    async execute(input: SendMessageInput): Promise<{ success: boolean; messageId?: string }> {
      const messageId = await client.sendMessage(input.channelId, {
        content: input.content,
        embeds: input.embeds,
        buttons: input.buttons,
        replyTo: input.replyTo,
      });

      return { success: true, messageId: messageId ?? undefined };
    },

    async sendEmbed(
      channelId: string,
      embed: EmbedData
    ): Promise<{ success: boolean; messageId?: string }> {
      const messageId = await client.sendMessage(channelId, { embeds: [embed] });
      return { success: true, messageId: messageId ?? undefined };
    },

    async sendWithButtons(
      channelId: string,
      content: string,
      buttons: ButtonData[]
    ): Promise<{ success: boolean; messageId?: string }> {
      const messageId = await client.sendMessage(channelId, { content, buttons });
      return { success: true, messageId: messageId ?? undefined };
    },

    async reply(
      channelId: string,
      messageId: string,
      content: string
    ): Promise<{ success: boolean; replyId?: string }> {
      const replyId = await client.sendMessage(channelId, { content, replyTo: messageId });
      return { success: true, replyId: replyId ?? undefined };
    },

    async edit(
      channelId: string,
      messageId: string,
      content: string
    ): Promise<{ success: boolean }> {
      await client.editMessage(channelId, messageId, { content });
      return { success: true };
    },

    async delete(channelId: string, messageId: string): Promise<{ success: boolean }> {
      await client.deleteMessage(channelId, messageId);
      return { success: true };
    },

    async react(channelId: string, messageId: string, emoji: string): Promise<{ success: boolean }> {
      await client.addReaction(channelId, messageId, emoji);
      return { success: true };
    },

    // Utility for creating rich embeds
    createEmbed(options: {
      title?: string;
      description?: string;
      color?: 'success' | 'warning' | 'error' | 'info' | number;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
      footer?: string;
      thumbnail?: string;
      image?: string;
    }): EmbedData {
      const colorMap: Record<string, number> = {
        success: 0x00ff00,
        warning: 0xffff00,
        error: 0xff0000,
        info: 0x0099ff,
      };

      return {
        title: options.title,
        description: options.description,
        color: typeof options.color === 'string' ? colorMap[options.color] : options.color,
        fields: options.fields,
        footer: options.footer ? { text: options.footer } : undefined,
        thumbnail: options.thumbnail,
        image: options.image,
        timestamp: new Date(),
      };
    },
  };
}

export type SendMessageAction = ReturnType<typeof createSendMessageAction>;
