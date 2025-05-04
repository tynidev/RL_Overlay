import { Console } from 'console';
import { Callback } from './util/utils';

export const WsSubscribers = {
  __subscribers: {} as Record<string, Record<string, Callback[]>>,
  webSocket: undefined as WebSocket | undefined,
  webSocketConnected: false,
  registerQueue: [] as string[],
  init: (
    host?: string,
    port?: string | number,
    debug?: string,
    debugFilters?: unknown[]
  ) => {
    host = host || 'localhost';
    port = port || 49322;
    console.log(`Connecting ws-relay ws://${host}:${port}`);
    if (debug) {
      if (debugFilters !== undefined) {
        console.warn(
          'WebSocket Debug Mode enabled with filtering. Only events not in the filter list will be dumped'
        );
      } else {
        console.warn(
          'WebSocket Debug Mode enabled without filters applied. All events will be dumped to console'
        );
        console.warn(
          "To use filters, pass in an array of 'channel:event' strings to the second parameter of the init function"
        );
      }
    }

    WsSubscribers.initRelayWebsocket(`ws://${host}:${port}`);
    setInterval(function () {
      if(WsSubscribers.webSocket === undefined ||
         WsSubscribers.webSocket.readyState !== WebSocket.CLOSED)
        return;
        WsSubscribers.initRelayWebsocket(`ws://${host}:${port}`);
    }, 1500);
   
    
  },

  initRelayWebsocket(socket:string) {
    console.log(`WsRelay: connecting... ${socket}`);
    WsSubscribers.webSocket = new WebSocket(socket);
    
    WsSubscribers.webSocket.onmessage = (event) => {
      let jEvent = JSON.parse(event.data);
      if (!jEvent.hasOwnProperty('event')) {
        return;
      }
      const [channel, event_event] = jEvent.event.split(':');
      // Pass the actual data payload instead of the entire jEvent
      WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
    };
    WsSubscribers.webSocket.onopen = function () {
      console.log("WsRelay: connected");
      WsSubscribers.triggerSubscribers('ws', 'open');
      WsSubscribers.webSocketConnected = true;
      WsSubscribers.registerQueue.forEach((r) => {
        console.log(`WsRelay: register ${r}`);
        WsSubscribers.send('wsRelay', 'register', r);
      });
    };
    WsSubscribers.webSocket.onerror = function () {
      WsSubscribers.triggerSubscribers('ws', 'error');
      WsSubscribers.webSocketConnected = false;
    };
    WsSubscribers.webSocket.onclose = function () {
      console.error("WsRelay: disconnected");
      WsSubscribers.triggerSubscribers('ws', 'close');
      WsSubscribers.webSocketConnected = false;
    };
  },

  /**
   * Add callbacks for when certain events are thrown
   * Execution is guaranteed to be in First In First Out order
   * @param channels
   * @param events
   * @param callback
   */
  subscribe: (
    channels: string | string[],
    events: string | string[],
    callback: Callback
  ) => {
    if (typeof channels === 'string') {
      channels = [channels];
    }
    const eventsArray = typeof events === 'string' ? [events] : events;
    for (const c of channels) {
      for (const e of eventsArray) {
        if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
          WsSubscribers.__subscribers[c] = {};
        }
        if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
          WsSubscribers.__subscribers[c][e] = [];
          WsSubscribers.registerQueue.push(`${c}:${e}`);
          if (WsSubscribers.webSocketConnected) {
            console.log(`WsRelay: register ${c}:${e}`);
            WsSubscribers.send('wsRelay', 'register', `${c}:${e}`);
          }
        }
        
        console.log(`WsSubscribers: subscribed ${c}:${e}`);
        WsSubscribers.__subscribers[c][e].push(callback);
      }
    }
  },
  clearEventCallbacks: (channel: string, event: string) => {
    if (
      WsSubscribers.__subscribers.hasOwnProperty(channel) &&
      WsSubscribers.__subscribers[channel].hasOwnProperty(event)
    ) {
      WsSubscribers.__subscribers[channel] = {};
    }
  },
  triggerSubscribers: (channel: string, event: string, data?: unknown) => {
    if (
      WsSubscribers.__subscribers.hasOwnProperty(channel) &&
      WsSubscribers.__subscribers[channel].hasOwnProperty(event)
    ) {
      WsSubscribers.__subscribers[channel][event].forEach(function (callback) {
        if (callback instanceof Function) {
          callback(data);
        }
      });
    }
  },
  send: function (channel: string, event: string, data?: unknown) {
    if (typeof channel !== 'string') {
      console.error('Channel must be a string');
      return;
    }
    if (typeof event !== 'string') {
      console.error('Event must be a string');
      return;
    }
    if (channel === 'local') {
      this.triggerSubscribers(channel, event, data);
    } else {
      if (WsSubscribers.webSocket === undefined) {
        console.error('WsSubscribers.webSocket not yet set');
        return;
      }
      WsSubscribers.webSocket.send(
        JSON.stringify({
          event: `${channel}:${event}`,
          data: data,
        })
      );
    }
  },
};
