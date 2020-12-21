/* eslint-disable max-len */
import {Component} from '../../../lib/component';
import {MutableChildNodes, MutableTextNode} from '../../../lib/mutable';
import {StateStoreInterface} from '../../../lib/state';
import {MenuActionState, MenuDataItem, MenuDataState, MenuItemState} from './state';

export class MenuComponent extends Component {
  protected static templateElement = Component.html`
    <template>
      <h1 id="title">Menu</h1>
    </template>
  ` as HTMLTemplateElement;
  protected static styleElement = Component.html`
    <style>
      ${Component.styles`
        @mixin reset-anchor {
          text-decoration: none;
          color: inherit;
          text-align: inherit;
        }
        @mixin reset-margin-padding {
          margin-block: {
            start: 0;
            end: 0;
          }
          margin-inline: {
            start: 0;
            end: 0;
          }
        }
        @mixin heading-custom($size: 18px, $weight: 400, $color: inherit) {
          @include reset-margin-padding;
          @include reset-anchor;
          font-size: $size;
          font-weight: $weight;
          color: $color;
        }
        @mixin sekeleton-loading($bg-color: linear-gradient(to right, #ededed, #dedede, #ededed, #dedede)) {
          @include animation-loading;
          color: transparent;
          background: $bg-color;
          background-size: 500% 100%;
          -webkit-animation: loading 3s linear 0s infinite normal forwards running;
                  animation: loading 3s linear 0s infinite normal forwards running;
        }
        @mixin animation-loading {
          @keyframes loading {
            0% {
              background-position: 0%;
            }
            50% {
              background-position: 100%;
            }
            100% {
              background-position: 0%;
            }
          }
        }
        $on-surface: black;
        :host {
          display: flex;
          flex-flow: column wrap;
          width: 100%;
          contain: content;
          @media only screen and (min-width: 992px) {
            grid-area: menu;
          }
        }
        :host([loading]){
          #title {
            @include sekeleton-loading();
            width: 30%;
            &::before {
              content: "Title";
              visibility: hidden;
            }
          }
        }
        #title {
          @include heading-custom(18px, 400, $on-surface);
          @media only screen and (min-width: 601px) {
            font-size: 22px;
          }
        }
      `}
    </style>
  ` as HTMLStyleElement;
  public static get style() {
    return this.styleElement;
  };

  public static get template() {
    return this.templateElement;
  };

  constructor() {
    super();

    const placeholder = Array(2).fill(1).map(() => Component.html`<menu-item-component loading></menu-item-component>`);

    this.list = new MutableChildNodes(...placeholder).attach(this.shadowRoot);
  }

  protected list: MutableChildNodes;
  protected state!: StateStoreInterface<MenuDataState, MenuActionState>;

  protected connectedCallback() {
    super.connectedCallback();

    this.toggleAttribute('loading');
  }

  protected attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected stateChangedCallback(ACTION: number, data: MenuDataState) {
    super.stateChangedCallback(ACTION, data);

    if (ACTION === this.state.ACTION.LOADED) {
      this.toggleAttribute('loading');
      this.list.filter((element) => element.hasAttribute('loading')).forEach((element) => element.remove());

      for (const menu of data.menus) {
        this.list.push(this.createItem(menu.name, menu.list));
      }
    }
  }
  protected createItem(name: string, list: Array<MenuItemState>) {
    return Component.html`<menu-item-component .data="${{name, list}}"></menu-item-component>` as MenuItemComponent;
  }
}

class MenuItemComponent extends Component {
  protected static templateElement = Component.html`
    <template>
      <h2 id="title"></h2>
      <ul id="list">
        <li></li>
        <li></li>
        <li></li>
      </ul>
    </template>
  ` as HTMLTemplateElement;

  protected static templateItem = Component.html`
    <template>
      <li></li>
    </template>
  ` as HTMLTemplateElement;

  protected static styleElement = Component.html`
    <style>
      ${Component.styles`
        @mixin reset-margin-padding {
          margin-block: {
            start: 0;
            end: 0;
          }
          margin-inline: {
            start: 0;
            end: 0;
          }
        }
        @mixin reset-anchor {
          text-decoration: none;
          color: inherit;
          text-align: inherit;
        }
        @mixin reset-list-style {
          @include reset-margin-padding;
          list-style: none;
        }
        @mixin heading-custom($size: 18px, $weight: 400, $color: inherit) {
          @include reset-margin-padding;
          @include reset-anchor;
          color: $color;
          font-size: $size;
          font-weight: $weight;
        }
        @mixin sekeleton-loading($bg-color: linear-gradient(to right, #e3e3e3, #d4d4d4, #e3e3e3, #d4d4d4)) {
          @include animation-loading;
          color: transparent;
          background: $bg-color;
          background-size: 500% 100%;
          -webkit-animation: loading 3s linear 0s infinite normal forwards running;
                  animation: loading 3s linear 0s infinite normal forwards running;
        }
        @mixin animation-loading {
          @keyframes loading {
            0% {
              background-position: 0%;
            }
            50% {
              background-position: 100%;
            }
            100% {
              background-position: 0%;
            }
          }
        }
        $font-color: black;
        $background-color: #f2f2f2;
        $background-color-item: white;
        $background-color-item-on-hover: #e6e6e6;
        $background-color-item-on-loading: linear-gradient(to right, #d6d6d6, #c7c7c7, #d6d6d6, #c7c7c7);
        :host {
          display: grid;
          row-gap: 8px;
          margin: 8px 0;
          padding: 8px;
          background-color: $background-color;
          border-radius: 6px;
        }
        :host([loading]) {
          #title {
            @include sekeleton-loading;
            width: 40%;
            &::before {
              content: "Title";
              visibility: hidden;
            }
          }
          li {
            @include sekeleton-loading($bg-color: $background-color-item-on-loading);
            &::before {
              content: "Item";
              visibility: hidden;
            }
          }
        }
        #title {
          @include heading-custom(16px, 500, $font-color);
          padding: 4px 8px;
        }
        #list {
          @include reset-list-style;
          display: grid;
          row-gap: 4px;
          padding: 0;
          li {
            display: flex;
            place-items: center;
            height: 32px;
            padding: 0 16px;
            font-size: 14px;
            background-color: $background-color-item;
            border-radius: 6px;
            &:hover {
              background-color: $background-color-item-on-hover;
            }
          }
        }
      `}
    </style>
  ` as HTMLStyleElement;

  public static get observedAttributes() {
    return ['data'];
  }

  public static get style() {
    return this.styleElement;
  };

  public static get template() {
    return this.templateElement;
  };

  protected static get item() {
    return this.templateItem;
  }

  constructor() {
    super();

    this.titleElement = new MutableTextNode().attach(this.shadowRoot.getElementById('title') as Element);
    this.listElement = new MutableChildNodes().attach(this.shadowRoot.getElementById('list') as Element);
  }
  protected Class!: typeof MenuItemComponent;
  protected titleElement: MutableTextNode;
  protected listElement: MutableChildNodes;

  protected attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    super.attributeChangedCallback(name, oldValue, newValue);

    if (name === 'data') {
      const data = newValue as MenuDataItem;

      this.titleElement.set(data.name);
      this.listElement.clear();

      for (const item of data.list) {
        this.listElement.push(this.createItem(item));
      }
    }
  }
  protected createItem(data: MenuItemState) {
    const item = this.Class.clone(this.Class.item.content) as DocumentFragment;

    (item.querySelector('li') as HTMLLIElement).textContent = data.name;

    return item;
  }
}

customElements.define('menu-component', MenuComponent);
customElements.whenDefined('menu-component').then(() => {
  console.log('menu-component defined');
});
customElements.define('menu-item-component', MenuItemComponent);
customElements.whenDefined('menu-item-component').then(() => {
  console.log('menu-item-component defined');
});
