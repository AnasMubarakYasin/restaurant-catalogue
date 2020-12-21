// import {css, style} from './css';
import {css, style} from './css';
import {html} from './html';
import {State, StateStoreInterface} from './state';

/* eslint-disable max-len */
export class Component extends HTMLElement {
  public static html(templateStringArray: TemplateStringsArray, ...interpolate: Array<any>): Element {
    return html(templateStringArray, ...interpolate);
  }
  public static css(templateStringArray: TemplateStringsArray, ...interpolate: Array<any>) {
    return css(templateStringArray, ...interpolate);
  }
  public static styles(templateStringArray: TemplateStringsArray, ...interpolate: Array<any>): string {
    return style(templateStringArray, ...interpolate);
  }
  public static visibility: IntersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const component of entries) {
          (component.target as Component).visibilityChangedCallback(component.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [.25],
      },
  )
  public static finalizationRegistry = new FinalizationRegistry((name) => {
    console.warn('the component', name, 'was clean up');
  })

  protected static clone(node: Node) {
    return node.cloneNode(true);
  }

  public static get observedAttributes() {
    return ['state'];
  }

  protected static styleElement = document.createElement('style');
  protected static templateElement = document.createElement('template');

  public static get style() {
    return this.styleElement;
  };
  public static get template() {
    return this.templateElement;
  };

  constructor() {
    super();

    html.asyncBuilder(false);

    this.Class = (this.constructor as typeof Component);

    this.Class.finalizationRegistry.register(this, this.localName);

    // console.log(this.Class.name);
    // console.log(this.Class.style);
    // console.log(this.Class.template);

    this.shadowRootElement = this.attachShadow({mode: 'open', delegatesFocus: true});
    this.shadowRoot.append(
        this.Class.clone(this.Class.style),
        this.Class.clone(this.Class.template.content),
    );
    this.logging = false;
    this.state = null;
    // console.log(this.constructor.name);
    // console.log(this.Class.State);
  }
  protected Class: typeof Component;

  protected state: StateStoreInterface<any, any> | null;
  protected logging: boolean;

  public get shadowRoot(): ShadowRoot {
    return this.shadowRootElement;
  };

  private shadowRootElement: ShadowRoot;

  protected connectedCallback() {
    this.requestDebug(() => console.log('element', this.localName, 'connected to', this.parentElement!.localName));
    this.Class.visibility.observe(this);
    html.asyncBuilder(true);
  }
  protected disconnectedCallback() {
    this.requestDebug(() => console.log('element', this.localName, 'disconnected'));
    this.Class.visibility.unobserve(this);

    delete this.state;
  }
  protected adoptedCallback() {
    this.requestDebug(() => console.log('element', this.localName, 'adopted by', this.parentElement!.localName));
    this.Class.visibility.unobserve(this);
  }
  protected attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    this.requestDebug(() => console.log('element', this.localName, 'attribute', name, 'changed from', oldValue, 'to', newValue));
  }
  protected visibilityChangedCallback(visible: boolean) {
    this.requestDebug(() => console.log('element', this.localName, 'visibility changed to', visible ? 'visible' : 'hidden'));
  }
  protected stateChangedCallback(action: Action, data: ComponentDataState) {
    this.requestDebug(() => console.log('element', this.localName, 'state changed to', action));
  }
  public setAttribute(qualifiedName: string, value: any) {
    if (qualifiedName[0] === '.') {
      qualifiedName = qualifiedName.slice(1);
      if (qualifiedName === 'state') {
        if (this.state) {
          State.destroy(this.state);
        }
        this.state = value;
        this.state.channel.subscribe(this.stateChangedCallback.bind(this));
      }
      if (this.Class.observedAttributes.includes(qualifiedName)) {
        this.attributeChangedCallback(qualifiedName, null, value);
      }
    } else {
      super.setAttribute(qualifiedName, value);
    }
  }

  protected requestDebug(callback: () => void) {
    if (this.logging) {
      callback();
    }
  }
}

export interface ComponentActionState {
  INIT: 0;
}
export interface ComponentDataState {}

// export type StateSession = {action: Action, data: ComponentDataState};
type Action = number;
// type HandlerState = (action: Action, data: DataState, previousState: StateSession) => void;

// class State<T, K> {
//   // public readonly tracker: Tracker<StateSession>;
//   public readonly node: MutableAttrNode<DataState>;
//   public readonly handler: HandlerState;

//   public action!: K;
//   public subscribeID: number;
//   private state: StateStoreInterface<T, K> | null;

//   constructor(node: MutableAttrNode<DataState>) {
//     this.subscribeID = -1;
//     // this.tracker = new Tracker();
//     this.node = node;
//     this.handler = () => {
//       throw new Error('method not implemented');
//     };
//     // this.tracker.push({action: 0, data: {}});
//     this.node.set(0);
//     this.state = null;
//   }
//   set(action: Action, data: DataState) {
//     // this.tracker.push({action, data});

//     const actions = Object.keys(this.action);
//     // const previousState = this.tracker.previous();

//     // if (previousState) {
//     //   this.handler(action, data, previousState);
//     //   this.node.replace(actions[previousState.action], actions[action], data);
//     //   this.state!.dispatch(action, data);
//     // } else {
//     //   throw new RangeError('something wrong');
//     // }
//   }
//   get() {
//     // return this.tracker.get();
//   }
//   init(state: StateStoreInterface<T, K>, callback: (ACTION: Action, data: DataState) => void) {
//     if (this.state && this.subscribeID > -1) {
//       this.state.channel.unSubscribe(this.subscribeID);
//     }
//     this.state = state;
//     this.subscribeID = this.state.channel.subscribe(callback);
//     this.action = state.ACTION;
//   }
//   attach(component: Component) {
//     this.node.attach(component);
//   }
//   destroy() {
//     // this.tracker.destroy();
//     this.node.release();
//     delete this.action;
//     delete this.state;
//   }
// }

class Tracker<T> {
  private stack: Array<T> = [];
  private position: number = -1;

  public push(data: T) {
    this.stack.push(data);
    this.position++;
  }
  public pop() {
    this.stack.pop();
    this.position--;
  }
  public get() {
    return this.stack[this.position];
  }
  public set(data: any) {
    this.stack[this.position] = data;
  }
  public check(position: number = 0) {
    const index = this.position + position;
    if (position > 0) {
      if (index >= this.stack.length) {
        return false;
      } else {
        return true;
      }
    } else if (position < 0) {
      if (index <= -1) {
        return false;
      } else {
        return true;
      }
    } else {
      if (this.stack.length) {
        return true;
      } else {
        return false;
      }
    }
  }
  public previous() {
    if (this.check(-1)) {
      return this.stack[this.position -1];
    } else {
      console.error('no more previous data');
    }
  }
  public next() {
    if (this.check(1)) {
      return this.stack[this.position +1];
    } else {
      console.error('no more next data');
    }
  }
  public back() {
    if (this.check(-1)) {
      return this.stack[--this.position];
    } else {
      throw new RangeError('no more back history');
    }
  }
  public forward() {
    if (this.check(1)) {
      return this.stack[++this.position];
    } else {
      throw new RangeError('no more next history');
    }
  }
  public destroy() {
    this.stack.length = 0;
  }
}

window.Tracker = Tracker;
