export interface AlertConfig {
  type: 'discord' | 'telegram' | 'webhook';
  destination: string;
  format?: 'text' | 'embed' | 'json';
}

export interface Alert {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, unknown>;
  timestamp: Date;
}

export async function sendAlert(
  alert: Alert,
  config: AlertConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (config.type) {
      case 'webhook':
        return await sendWebhookAlert(alert, config.destination);
      case 'discord':
        return await sendDiscordAlert(alert, config.destination);
      case 'telegram':
        return await sendTelegramAlert(alert, config.destination);
      default:
        return { success: false, error: 'Unknown alert type' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function sendWebhookAlert(
  alert: Alert,
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      data: alert.data,
      timestamp: alert.timestamp.toISOString(),
    }),
  });

  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` };
  }

  return { success: true };
}

async function sendDiscordAlert(
  alert: Alert,
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const color =
    alert.severity === 'critical'
      ? 0xff0000
      : alert.severity === 'warning'
      ? 0xffaa00
      : 0x00ff00;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: alert.title,
          description: alert.message,
          color,
          fields: alert.data
            ? Object.entries(alert.data).map(([name, value]) => ({
                name,
                value: String(value),
                inline: true,
              }))
            : [],
          timestamp: alert.timestamp.toISOString(),
        },
      ],
    }),
  });

  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` };
  }

  return { success: true };
}

async function sendTelegramAlert(
  alert: Alert,
  botConfig: string
): Promise<{ success: boolean; error?: string }> {
  const [botToken, chatId] = botConfig.split(':');

  if (!botToken || !chatId) {
    return { success: false, error: 'Invalid Telegram config' };
  }

  const emoji =
    alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';

  const text = `${emoji} *${alert.title}*\n\n${alert.message}`;

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    }
  );

  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` };
  }

  return { success: true };
}

export const sendAlertAction = {
  name: 'send-alert',
  description: 'Sends alerts via various channels',
  sendAlert,
};
