import type { TelegramClient, SendMessageOptions, InlineButton, KeyboardButton } from '../client';

export interface SendTextInput {
  chatId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyToMessageId?: number;
}

export function createMessagingAction(client: TelegramClient) {
  return {
    name: 'messaging',
    description: 'Send and manage Telegram messages',

    async sendText(input: SendTextInput): Promise<{ success: boolean; messageId?: number }> {
      const messageId = await client.sendMessage(input.chatId, {
        text: input.text,
        parseMode: input.parseMode,
        replyToMessageId: input.replyToMessageId,
      });

      return { success: true, messageId };
    },

    async sendWithInlineKeyboard(
      chatId: number,
      text: string,
      buttons: InlineButton[][],
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    ): Promise<{ success: boolean; messageId?: number }> {
      const messageId = await client.sendMessage(chatId, {
        text,
        parseMode,
        keyboard: buttons,
        keyboardType: 'inline',
      });

      return { success: true, messageId };
    },

    async sendWithReplyKeyboard(
      chatId: number,
      text: string,
      buttons: KeyboardButton[][],
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    ): Promise<{ success: boolean; messageId?: number }> {
      const messageId = await client.sendMessage(chatId, {
        text,
        parseMode,
        keyboard: buttons,
        keyboardType: 'reply',
      });

      return { success: true, messageId };
    },

    async removeKeyboard(chatId: number, text: string): Promise<{ success: boolean; messageId?: number }> {
      const messageId = await client.sendMessage(chatId, {
        text,
        keyboardType: 'remove',
      });

      return { success: true, messageId };
    },

    async reply(
      chatId: number,
      replyToMessageId: number,
      text: string,
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    ): Promise<{ success: boolean; messageId?: number }> {
      const messageId = await client.sendMessage(chatId, {
        text,
        parseMode,
        replyToMessageId,
      });

      return { success: true, messageId };
    },

    async edit(
      chatId: number,
      messageId: number,
      text: string,
      parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    ): Promise<{ success: boolean }> {
      await client.editMessage(chatId, messageId, text, parseMode);
      return { success: true };
    },

    async delete(chatId: number, messageId: number): Promise<{ success: boolean }> {
      await client.deleteMessage(chatId, messageId);
      return { success: true };
    },

    async sendPhoto(
      chatId: number,
      photo: string,
      caption?: string
    ): Promise<{ success: boolean; messageId?: number }> {
      const messageId = await client.sendPhoto(chatId, photo, caption);
      return { success: true, messageId };
    },

    async sendDocument(
      chatId: number,
      document: string,
      caption?: string
    ): Promise<{ success: boolean; messageId?: number }> {
      const messageId = await client.sendDocument(chatId, document, caption);
      return { success: true, messageId };
    },

    // Helper for creating formatted messages
    formatHTML(options: {
      title?: string;
      body: string;
      footer?: string;
      bold?: string[];
      italic?: string[];
      code?: string[];
    }): string {
      let text = '';

      if (options.title) {
        text += `<b>${options.title}</b>\n\n`;
      }

      text += options.body;

      if (options.footer) {
        text += `\n\n<i>${options.footer}</i>`;
      }

      return text;
    },

    // Helper for creating inline keyboard
    createInlineKeyboard(buttons: Array<{
      text: string;
      callback?: string;
      url?: string;
    }>, columns: number = 2): InlineButton[][] {
      const rows: InlineButton[][] = [];
      let currentRow: InlineButton[] = [];

      for (const btn of buttons) {
        currentRow.push({
          text: btn.text,
          callbackData: btn.callback,
          url: btn.url,
        });

        if (currentRow.length === columns) {
          rows.push(currentRow);
          currentRow = [];
        }
      }

      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      return rows;
    },
  };
}

export type MessagingAction = ReturnType<typeof createMessagingAction>;
