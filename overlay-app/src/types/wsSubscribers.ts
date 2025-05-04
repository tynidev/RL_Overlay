import { Callback } from '../util/utils';

export interface WsSubscribers {
  subscribe(channels: string | string[], events: string | string[], callback: Callback): void;
  send(channel: string, event: string, data?: unknown): void;
  // Add other methods if MockWsSubscribers uses them, e.g., unsubscribe
  unsubscribe?(channel: string, event: string, callback: Callback): void;
}