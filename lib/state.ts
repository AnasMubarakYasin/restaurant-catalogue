import {duplicate, genRandomString} from './helper';

export class State {
  static readonly NAME = 'State::'
  public static readonly finalizationRegistry = new FinalizationRegistry(
      (name) => {
        console.warn('the state', name, 'was clean up');
      })
  static check(name: StateName): boolean {
    return this.store.has(name);
  }
  static destroy(state: StateStore<any, any>) {
    if (this.store.has(state.name)) {
      this.store.delete(state.name);

      state.channel.destroy();
      state.destroyAllClone();
      state.setFactory(() => null);
    }
  }
  static create<T extends Data<T>, K extends ActionConstant<K>>(
      name: StateName = '',
      data: T,
      ACTION: K,
  ): StateStore<T, K> {
    if (name.length === 0) {
      name = genRandomString(8);
    }
    const state = new StateStore<T, K>(name, data, ACTION);
    this.store.set(name, state);
    this.finalizationRegistry.register(state, state.name);
    return state;
  }
  static load<T, K>(name: StateName): StateStore<T, K> | null {
    const rawData = localStorage.getItem(this.NAME + name);
    if (this.check(name)) {
      return this.store.get(name) || null;
    } else if (rawData) {
      const stateInfo = JSON.parse(rawData);
      return this.create<T, K>(name, stateInfo.data, stateInfo.ACTION);
    } else {
      return null;
    }
  }
  static save(state: StateStore<any, any>) {
    localStorage.setItem(this.NAME + state.name, JSON.stringify({
      name: state.name,
      ACTION: state.ACTION,
      data: state.get(),
    }));
  }
  private static readonly store:
  Map<StateName, StateStore<any, any>> = new Map();
}

export interface StateStoreInterface<T, K> {
  ACTION: ActionConstant<K>;
  name: StateName;
  channel: StateClone<T, K>;
  get<J>(key?: keyof T): J extends keyof T ? T[keyof T] : T;
  set(value: T | T[keyof T], key?: keyof T): this;
  dispatch(ACTION: Action, extraData?: Data<any>): Promise<void>;
  setFactory(factoryStateHandler: FactoryStateCallback<T>): void;
  createClone(): StateClone<T, K>;
  destroyClone(ID: CloneID): void;
  destroyAllClone(): void;
}

class StateStore<T extends Data<T>, K extends ActionConstant<K>>
implements StateStoreInterface<T, K> {
  constructor(
      name: StateName,
      data: T,
      ACTION: ActionConstant<K>,
  ) {
    this.ACTION = ACTION;
    this.name = name;
    this.data = data;
    this.cloneList = [];
    // this.subscribers = [];
    this.channel = new StateClone(this, -1);
    // this.channelList = [];
    // this.history = [data];
    this.factoryState = () => {
      throw new TypeError('method not implement');
    };
    // this.handlerRequest = () => {
    //   throw new TypeError('method not implement');
    // };
  }

  public readonly ACTION: K;
  public readonly name: StateName;
  public readonly channel: StateClone<T, K>;
  // public readonly channelList: Array<StateChannel<T, K>>;
  // public readonly channelList: Array<WeakRef<StateChannel<T, K>>>;
  private readonly cloneList: Array<StateClone<T, K>>;
  // private readonly subscribers: Array<HandlerNotification<T>>;

  private data: T;
  private factoryState: FactoryStateCallback<T>;
  // private handlerRequest: HandlerRequest;

  public get<J>(key?: keyof T): J extends keyof T ? T[keyof T] : T {
    if (key) {
      if (typeof this.data[key] === 'object') {
        return duplicate<T>(this.data[key]) as any;
      }
      return this.data[key];
    }
    return duplicate<T>(this.data) as any;
  }
  public set(value: T | T[keyof T], key?: keyof T) {
    if (key) {
      if (typeof this.data[key] === 'object') {
        this.data[key] = duplicate(value) as T[keyof T];
      } else {
        this.data[key] = value as T[keyof T];
      }
    } else {
      this.data = duplicate(value);
    }
    return this;
  }
  public async dispatch(ACTION: Action, extraData: Data<any> = {} ) {
    const data = this.factoryState({
      ACTION,
      data: duplicate(this.data),
      extraData,
    });
    if (data instanceof Promise) {
      this.data = await data;
    } else {
      this.data = data;
    }
    this.publish(ACTION, duplicate<T>(this.data));
    return undefined;
  };
  public setFactory(factoryStateHandler: FactoryStateCallback<T>): void {
    this.factoryState = factoryStateHandler;
  };
  // public setReplyRequest(handlerRequest: HandlerRequest): void {
  //   this.handlerRequest = handlerRequest;
  // }
  // public subscribe(handler: HandlerNotification<T>): SubscriberID {
  //   return this.subscribers.push(handler) -1;
  // }
  // public unSubscribe(id: SubscriberID) {
  //   return this.subscribers.splice(id, 1);
  // }
  public createClone(): StateClone<T, K> {
    const clone = new StateClone(this, this.cloneList.length);
    // const weakRef = new WeakRef(channel);
    // this.channelList.push(weakRef);
    // const registry = new FinalizationRegistry((heldValue) => {
    // console.log(heldValue, 'destroy');
    // });
    // registry.register(channel, 'channel');
    this.cloneList.push(clone);
    return clone;
  }
  // public reply<J>(ACTION: Action, request: Data<J>): boolean {
  //   return this.handlerRequest(ACTION, request);
  // }
  public destroyClone(ID: CloneID) {
    this.cloneList.splice(ID, 1);
  }
  public destroyAllClone() {
    // console.log(this);
    for (const clone of this.cloneList) {
      clone.destroy();
      // channel.deref()!.destroy();
    }
    this.cloneList.length = 0;
    // console.log(...this.channelList);
  }
  private async publish(ACTION: Action, data: T): Promise<void> {
    this.channel.publish(ACTION, data);
    for (const clone of this.cloneList) {
    // for (const refChannel of this.channelList) {
      // const channel = refChannel.deref();
      // if (channel) {
      //   channel.publish(ACTION, data);
      // } else {
      //   this.channelList.shift();
      // }
      clone.publish(ACTION, data);
    }
    return undefined;
  }
}

class StateClone<T, K> {
  constructor(source: StateStore<T, K>, ID: CloneID) {
    this.ref = new WeakRef(source);
    // this.source = source;
    this.ID = ID;
    this.name = source.name;
    this.ACTION = source.ACTION;
    this.subscribers = [];
    // this.isConnected = true;
  }

  private ref: WeakRef<StateStore<T, K>>;
  // private isConnected: boolean;

  public readonly ID;
  public readonly name: StateName;
  public readonly ACTION: K;

  // private readonly source: StateStore<T, K>;
  private readonly subscribers: Array<HandlerNotification<T>>;

  private get source() {
    const source = this.ref.deref();
    if (source) {
      return source;
    } else {
      throw new TypeError('source not exist');
    }
  }

  public get<J>(key?: keyof T) {
    return this.source.get<J>(key);
  }
  public subscribe(handler: HandlerNotification<T>): SubscriberID {
    return this.subscribers.push(handler) -1;
  }
  public unSubscribe(id: SubscriberID) {
    return this.subscribers.splice(id, 1);
  }
  public async dispatch<J>(ACTION: Action, extraData: Data<J | any> = {}) {
    this.source.dispatch(ACTION, extraData);
  }
  // eslint-disable-next-line max-len
  // public requestDispatch(ACTION: Action, request: Data<T | any> = {}): boolean {
  //   if (this.source.reply(ACTION, request)) {
  //     this.source.dispatch(ACTION, request);
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
  public async publish(ACTION: Action, data: T): Promise<void> {
    for (const subscriber of this.subscribers) {
      subscriber(ACTION, data);
    }
    return undefined;
  }
  public reset() {
    this.subscribers.length = 0;
  }
  public destroy() {
    this.reset();
    delete this.ref;
  }
}


type Data<T> = {
  [P in keyof T]: T[P];
};
type ActionConstant<T> = {
  [P in keyof T]: T[P];
};
type StateName = string;
type Action = number
type StateMaterial<T> = {
  ACTION: Action;
  data: Data<T>;
  extraData: Data<T | any>;
}
// type HandlerRequest = (ACTION: Action, request: Data<any> | any) => boolean;
// type SubscribeRegister<T> = {
//   id: SubscriberID;
//   person?: StateName;
//   handler: HandlerNotification<T>;
// }
type FactoryStateCallback<T> = (material: StateMaterial<T>) => T | Promise<T>;
type HandlerNotification<T> = (ACTION: Action, data: T) => void;
type SubscriberID = number;
type CloneID = number;


// let btn = State.create('btn', {clicked: false}, {CLICKED: 0});
// let drop = btn.createChannel();

// btn.setFactory(({ACTION, data, extraData}) => {
//   if (ACTION === btn.ACTION.CLICKED) {
//     data.clicked = true;
//     return data;
//   } else {
//     return data;
//   }
// });
// btn.setReplyRequest((ACTION, request) => {
//   if (ACTION === btn.ACTION.CLICKED) {
//     return true;
//   }
//   return false;
// });

// drop.subscribe(({ACTION, data}) => {
//   console.log(ACTION, data);
// });

// console.log(btn.get());
// console.log(drop.get());

// btn.dispatch(btn.ACTION.CLICKED);
// drop.requestDispatch(drop.ACTION.CLICKED, {clicked: true});

// console.log(drop.get());
// console.log(btn.get());

