import type { Event } from './event';

interface EventValue {
  listener: (e: Event) => void;
  scope: unknown;
  type: string;
  priority: number;
}

export class EventDispatcher {
  private listeners: Record<string, EventValue[]>;
  private _target: unknown;

  constructor(target = null) {
    this.listeners = {};
    this._target = target || this;
  }

  dispose() {
    this.listeners = {};
    this._target = null;
  }

  addEventListener(
    type: string,
    listener: (e: Event) => void,
    scope: unknown = null,
    priority = 0,
  ) {
    if (this.listeners[type] === undefined) {
      this.listeners[type] = [];
    }

    if (this.getEventListenerIndex(type, listener) === -1) {
      let lv: EventValue = {
        listener,
        scope,
        type,
        priority,
      };

      this.listeners[type]?.push(lv);
      this.listeners[type]?.sort((a, b) => a.priority - b.priority);
    }
  }

  addOneEventListener(
    type: string,
    listener: (e: Event) => void,
    scope: unknown = null,
    priority = 0,
  ) {
    if (!this.hasEventListener(type, listener, scope)) {
      // code from hasEventListener inlined for a (small) performance gain
      if (this.listeners[type] === undefined) {
        this.listeners[type] = [];
      }

      if (this.getEventListenerIndex(type, listener) === -1) {
        let lv: EventValue = {
          listener,
          scope,
          type,
          priority,
        };

        this.listeners[type]?.push(lv);
        this.listeners[type]?.sort((a, b) => a.priority - b.priority);
      }
    }
  }

  removeEventListener(type: string, listener: (e: Event) => void, scope: unknown = null) {
    let index = this.getEventListenerIndex(type, listener, scope);

    if (index !== -1) {
      this.listeners[type]?.splice(index, 1);
    }
  }

  dispatchEvent(event: Event, assignTarget = true) {
    let listenerArray = this.listeners[event.type];

    if (listenerArray !== undefined) {
      let l = listenerArray.length;

      if (assignTarget) {
        event.target = this._target;
      }

      let lv: EventValue;

      for (let i = 0; i < l; i++) {
        lv = listenerArray[i] as EventValue;

        if (lv) {
          if (lv.scope) {
            lv.listener.call(lv.scope, event);
          } else {
            lv.listener(event);
          }
        }
      }
    }
  }

  getEventListenerIndex(type: string, listener: (e: Event) => void, scope: unknown = null) {
    if (!this.listeners) {
      return -1;
    }

    if (this.listeners[type] !== undefined) {
      let a = this.listeners[type] as EventValue[];

      let l = a.length;
      let lv: EventValue;

      for (let i = 0; i < l; i++) {
        lv = a[i] as EventValue;

        if (listener === lv.listener && lv.scope === scope) {
          return i;
        }
      }
    }

    return -1;
  }

  hasEventListener(type: string, listener: (e: Event) => void, scope: unknown = null) {
    if (listener !== null) {
      return this.getEventListenerIndex(type, listener, scope) !== -1;
    } else {
      if (this.listeners[type] !== undefined) {
        let l = this.listeners[type] as EventValue[];

        return l.length > 0;
      }

      return false;
    }
  }

  trigger(type: string, event?: unknown) {
    let listenerArray = this.listeners[type];

    if (listenerArray !== undefined) {
      let l = listenerArray.length;
      let lv: EventValue;

      for (let i = 0; i < l; i++) {
        lv = listenerArray[i] as EventValue;

        if (lv) {
          if (lv.scope) {
            lv.listener.call(lv.scope, event as Event);
          } else {
            lv.listener(event as Event);
          }
        }
      }
    }
  }

  on(type: string, listener: (e: Event) => void, scope: unknown = null, priority = 0) {
    this.addEventListener(type, listener, scope, priority);
  }

  off(type: string, listener: (e: Event) => void, scope: unknown = null) {
    this.removeEventListener(type, listener, scope);
  }
}
