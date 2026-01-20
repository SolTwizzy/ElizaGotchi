/**
 * AlertHandler - Bridges agent runtime alerts to the notification service
 *
 * This module provides a way for agents to send alerts through the central
 * NotificationService in the API. It works by making HTTP calls to the API
 * endpoint, which then routes to the user's connected channels.
 */

export interface AgentAlert {
  type: 'whale_alert' | 'gas_alert' | 'airdrop' | 'portfolio' | 'contract_event' | 'custom';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AlertHandlerConfig {
  apiUrl: string;
  agentId: string;
  userId: string;
  authToken?: string;
}

/**
 * AlertHandler class for agents to send notifications
 */
export class AlertHandler {
  private config: AlertHandlerConfig;
  private apiUrl: string;

  constructor(config: AlertHandlerConfig) {
    this.config = config;
    this.apiUrl = config.apiUrl || process.env.API_URL || 'http://localhost:4000';
  }

  /**
   * Send an alert through the notification service
   */
  async sendAlert(alert: AgentAlert): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/internal/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': this.config.agentId,
          'X-User-Id': this.config.userId,
          ...(this.config.authToken && { Authorization: `Bearer ${this.config.authToken}` }),
        },
        body: JSON.stringify({
          userId: this.config.userId,
          agentId: this.config.agentId,
          type: alert.type,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          data: alert.data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: (errorData as Record<string, string>).error || `HTTP ${response.status}`,
        };
      }

      const result = await response.json() as { success: boolean; sent?: string[]; failed?: string[] };
      return { success: result.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Send a whale alert
   */
  async whaleAlert(
    title: string,
    message: string,
    data?: { amount?: string; token?: string; chain?: string; txHash?: string }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendAlert({
      type: 'whale_alert',
      priority: 'high',
      title,
      message,
      data,
    });
  }

  /**
   * Send a gas price alert
   */
  async gasAlert(
    title: string,
    message: string,
    data?: { gasPrice?: number; chain?: string; threshold?: number }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendAlert({
      type: 'gas_alert',
      priority: 'medium',
      title,
      message,
      data,
    });
  }

  /**
   * Send an airdrop alert
   */
  async airdropAlert(
    title: string,
    message: string,
    data?: { protocol?: string; amount?: string; deadline?: string }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendAlert({
      type: 'airdrop',
      priority: 'high',
      title,
      message,
      data,
    });
  }

  /**
   * Send a portfolio update
   */
  async portfolioAlert(
    title: string,
    message: string,
    data?: { totalValue?: string; change?: string; changePercent?: string }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendAlert({
      type: 'portfolio',
      priority: 'low',
      title,
      message,
      data,
    });
  }

  /**
   * Send a contract event alert
   */
  async contractAlert(
    title: string,
    message: string,
    data?: { contract?: string; event?: string; chain?: string }
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendAlert({
      type: 'contract_event',
      priority: 'medium',
      title,
      message,
      data,
    });
  }

  /**
   * Send a custom alert
   */
  async customAlert(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    data?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendAlert({
      type: 'custom',
      priority,
      title,
      message,
      data,
    });
  }
}

/**
 * Create an alert handler for an agent
 */
export function createAlertHandler(config: AlertHandlerConfig): AlertHandler {
  return new AlertHandler(config);
}
