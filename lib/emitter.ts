/* eslint-disable max-len */
export interface EventEmitterInstanceSpec {
  source?: any
  data?: any
}

export type EventType = string;

export interface EventEmitterSpec extends EventEmitterInstanceSpec {
  readonly type: EventType
  readonly timeCreate: number
  prevent: boolean
  cancelAble: boolean

  stopDefaultEvent(): void
  stopPropagation(): void
}

export class EventEmitter implements EventEmitterSpec {
  public readonly type: EventType;
  public readonly timeCreate: number;

  public source: object;
  public data: object;

  cancelAble: boolean = false;
  prevent: boolean = false;

  constructor(type: string, options?: EventEmitterInstanceSpec) {
    this.type = type;
    this.timeCreate = new Date().getTime();
    this.source = options!.source || {};
    this.data = options!.data || {};
  }

  public stopPropagation() {
    this.cancelAble = true;
  }

  public stopDefaultEvent() {
    this.prevent = true;
  }
}

export interface EmitterSpec {
  on(type: string, handler: ListenerHandler, options: ListenerOptions): ListenerId
  emit(eventEmitter: EventEmitter, ...args: any | undefined): void
  remove(id: ListenerId): boolean
}

export interface ListenerHandler {
  (event: EventEmitter, ...args: any | undefined): void
}

export interface ListenerOptions {
  once?: boolean
  passive?: boolean
  default?: boolean
}

export interface ListenerContainer {
  [type: string]: Listener[]
}

export type ListenerMap = Map<EventType, ListenerList>;

export type ListenerId = number;

export interface Listener {
  handler: ListenerHandler
  id: ListenerId
  options: ListenerOptions
}
export type ListenerList = Listener[];

export class Emitter implements EmitterSpec {
  private static* eventIDGenerator(): Generator<ListenerId, any, ListenerId> {
    for (let index: number = 0; true; index++) {
      yield index+1;
    }
  }
  private listenerList: ListenerContainer = {};
  private listenerMap: ListenerMap = new Map();
  private listenerIdGen = Emitter.eventIDGenerator();

  private listenerRegister(type: EventType, handler: ListenerHandler, options: ListenerOptions): ListenerId {
    const ID: ListenerId = this.listenerIdGen.next().value as ListenerId;

    let listenerList = this.listenerMap.get(type);

    if (listenerList === undefined) {
      listenerList = [{handler, id: ID, options}];

      this.listenerMap.set(type, listenerList);
    } else {
      listenerList.push({handler, id: ID, options});
      listenerList.sort((a, b) => {
        if (a.options.default && !b.options.default) {
          return 0;
        } else if (!a.options.default && b.options.default) {
          return -1;
        } else {
          return 1;
        }
      });
    }
    return ID;
  }

  on(type: EventType, handler: ListenerHandler, options?: ListenerOptions): ListenerId {
    if (options === undefined) {
      options = {};
    }
    const DEFAULT_OPTIONS: ListenerOptions = {
      default: options!.default || false,
      once: options!.once || false,
      passive: options!.passive || false,
    };

    return this.listenerRegister(type, handler, DEFAULT_OPTIONS);
  }
  emit(eventEmitter: EventEmitter, ...args: any): void {
    const TYPE = eventEmitter.type;

    let prevent = true;
    let propagation = true;

    let listenerList = this.listenerMap.get(TYPE);

    if (listenerList === undefined) {
      return;
    }

    for (const listener of listenerList) {
      const callback = listener.handler.bind(null, eventEmitter, ...args);

      if (propagation) {
        if (listener.options.default) {
          if (prevent) {
            callback();
          }
        } else {
          callback();
        }
      } else {
        if (listener.options.passive) {
          callback();
        }
      }

      if (eventEmitter.prevent) {
        prevent = false;
      }
      if (eventEmitter.cancelAble) {
        propagation = false;
      }
    }

    listenerList = listenerList.filter((listener) => {
      const {once} = listener.options;
      if (once) {
        return false;
      } else {
        return true;
      }
    });

    this.listenerMap.set(TYPE, listenerList);
  }
  remove(id: ListenerId): boolean {
    for (const [type, listenerList] of this.listenerMap) {
      const index = listenerList.findIndex((listener) => listener.id === id);

      listenerList.splice(index, 1);

      return true;
    }
    return false;
  }
}
