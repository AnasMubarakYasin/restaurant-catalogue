/* eslint-disable max-len */
import {Component} from '../../../lib/component';
import {StateStoreInterface} from '../../../lib/state';
import {ReviewActionState, ReviewDataState} from './state';

export class ReviewComponent extends Component {
  public static templateElement = Component.html`
      <template>
        <div class="review loading">
          <div class="account">
            <div class="icon">
              <i class="md-icons">person</i>
            </div>
            <h1 class="name">User</h1>
            <div class="space"></div>
            <button class="btn-edit md-icons loading">edit</button>
          </div>
          <label>
            <textarea name="review" placeholder="Write a review" class="message" spellcheck="false"></textarea>
          </label>
        </div>
        <button class="btn-send md-icons loading">send</button>
      </template>
  ` as HTMLTemplateElement;

  public static styleElement = Component.html`
    <style>
      ${Component.styles`
        @mixin btn-custom($color: inherit, $bg-color: inherit, $mar: auto, $pad: 0, $gap: 4px) {
          margin: $mar;
          padding: $pad;
          display: grid;
          grid-auto-flow: column;
          grid-template-columns: auto;
          place-items: center;
          place-content: center;
          min-width: 44px;
          min-height: 44px;
          color: $color;
          background-color: $bg-color;
          cursor: pointer;
          -moz-column-gap: $gap;
               column-gap: $gap;
        }
        @mixin sekeleton-loading {
          @include animation-loading;
          color: transparent !important;
          background: linear-gradient(to right, #e3e3e3, #d4d4d4, #e3e3e3, #d4d4d4);
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
        @mixin shadow-box($level: 0px) {
            box-shadow: (1px + $level) (1px + $level) (3px + $level)  rgba(0, 0, 0, 0.150),
                        (-1px - $level) (1px + $level) (3px + $level)  rgba(0, 0, 0, 0.150);
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
        @mixin reset-anchor {
          text-decoration: none;
          color: inherit;
          text-align: inherit;
        }
        @mixin heading-custom($size: 18px, $weight: 400, $color: inherit) {
          @include reset-margin-padding;
          @include reset-anchor;
          color: $color;
          font-size: $size;
          font-weight: $weight;
        }
        $primary-color: #ff8f44;
        $primary-color-variant: #cb4900;
        $secondary-color: #ea0050;
        $tersier-color: #263238;
        $surface-color: white;
        $background-color: white;
        $on-primary: #000000;
        $on-secondary: #ECEFF1;
        $on-surface: black;
        $on-background: black;
        :host {
          display: flex;
          flex-flow: column wrap;
        }
        .md-icons {
          font-family: "Material Icons";
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          display: inline-block;
          line-height: 1;
          text-transform: none;
          letter-spacing: normal;
          word-wrap: normal;
          white-space: nowrap;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: "liga";
        }
        .review {
          @include shadow-box;
          display: flex;
          flex-flow: column wrap;
          background-color: #f2f2f2;
          border-radius: 6px;
          .account {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            .icon {
              display: inherit;
              margin-right: 8px;
              width: 32px;
              height: 32px;
              background-color: white;
              border-radius: 50%;
              border: .4px solid #b3b3b3;
              .md-icons {
                margin: auto;
                font-size: 28px;
                color: #b3b3b3;
              }
            }
            .name {
              @include heading-custom(16px, 600, black);
            }
            .space {
              flex: 1 0 auto;
              &::before {
                content: "white space";
                visibility: hidden;
              }
            }
            .btn-edit {
              @include btn-custom($on-surface, transparent, 0, 0, 0);
              border: 2px solid transparent;
              border-radius: 6px;
              transition: all .3s ease;
              opacity: .7;
              &:hover {
                opacity: 1;
              }
              &:active {
                opacity: .7;
              } 
            }
          }
          label {
            display: flex;
            flex-flow: column wrap;
            .message {
              padding: 12px 16px;
              min-height: 52px;
              font: {
                size: 16px;
                weight: 500;
              }
              border-radius: 0 0 6px 6px;
              resize: vertical;
              border: 2px solid transparent;
              transition: all .3s ease;
              &:hover {
                background-color: $background-color;
                border: 2px solid $primary-color;
              }
              &:focus {
                outline: none;
                border: 2px solid $tersier-color;
              }
            }
          }
        }
        .btn-send {
          @include btn-custom(#4d4d4d, #e6e6e6, 8px 0);
          border: 2px solid transparent;
          transition: all .3s ease;
          width: 88px;
          align-self: flex-end;
          border-radius: 6px;
          border: 2px solid transparent;
          &:hover {
            color: #1a1a1a;
            background-color: transparent;
            border: 2px solid $primary-color;
          }
          &:focus {
            outline: none;
            border: 2px solid $tersier-color;
          }
          &:active {
            background-color: #e6e6e6;
          }
        }
        .review.loading {
          .account {
            .icon, .name {
              @include sekeleton-loading(5);
              border: none;
              &::before {
                content: "text";
              }
            }
            .icon {
              .md-icons {
                visibility: hidden;
              }
            }
          }
          .message {
            display: none;
          }
        }
        .btn-send.loading, .btn-edit.loading {
          @include sekeleton-loading;
          &:hover {
            background-color: #e6e6e6;
            border: 2px solid transparent;
            cursor: default;
          }
          &:focus {
            outline: none;
            border: 2px solid transparent;
          }
        }
        .dot-loader {
          display: flex;
          $duration: 1s;
          animation: fade-in .8s ease-in 0s 1 alternate none running;
          .dot {
            height: 10px;
            width: 10px;
            border-radius: 50%;
            background-color: #4d4d4d;
            position: relative;
            -webkit-animation: $duration grow ease infinite;
            animation: $duration grow ease infinite;
          }
          .dot1 {
            @extend .dot;
          }
          .dot2 {
            @extend .dot;
            margin: 0 10px;
            -webkit-animation: {
              delay: .15s;
            }
            animation: {
              delay: .15s;
            }
          }
          .dot3 {
            @extend .dot;
            -webkit-animation: {
              delay: .3s;
            }
            animation: {
              delay: .3s;
            }
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
        }
        @keyframes fade-out {
          to {
            opacity: 0;
          }
        }
        @keyframes grow {
          0%, 40%, 100% {
            -webkit-transform: scale(0);
                    transform: scale(0);
          }
          40% {
            -webkit-transform: scale(1);
                    transform: scale(1);
          }
        }
      `}
    </style>
  ` as HTMLStyleElement;
  protected static sendLoader = Component.html`
    <template>
      <div class="dot-loader">
        <div class="dot1"></div>
        <div class="dot2"></div>
        <div class="dot3"></div>
      </div>
    </template>
  ` as HTMLTemplateElement;

  public static get style() {
    return this.styleElement;
  };

  public static get template() {
    return this.templateElement;
  };

  constructor() {
    super();

    this.container = this.shadowRoot.querySelector('div') as HTMLDivElement;
    this.sendButton = this.shadowRoot.querySelector('.btn-send') as HTMLButtonElement;
    this.editButton = this.shadowRoot.querySelector('.btn-edit') as HTMLButtonElement;
    this.textArea = this.shadowRoot.querySelector('textarea') as HTMLTextAreaElement;
    this.name = this.shadowRoot.querySelector('h1') as HTMLHeadingElement;
    this.loadableElement = [
      this.container, this.sendButton, this.editButton,
    ] as Array<HTMLElement>;
  }

  protected container;
  protected sendButton;
  protected editButton;
  protected textArea;
  protected name;
  protected loadableElement;
  protected Class!: typeof ReviewComponent;
  protected state!: StateStoreInterface<ReviewDataState, ReviewActionState>;

  protected stateChangedCallback(ACTION: number, data: ReviewDataState) {
    if (ACTION === this.state.ACTION.LOADED) {
      this.loadableElement.forEach((element) => element.classList.remove('loading'));
      this.editButton.addEventListener('click', this.edit.bind(this));
      this.sendButton.addEventListener('click', this.send.bind(this));
    } else if (ACTION === this.state.ACTION.LOADING) {
      this.loadableElement.forEach((element) => element.classList.add('loading'));
      this.editButton.removeEventListener('click', this.edit.bind(this));
      this.sendButton.removeEventListener('click', this.send.bind(this));

      document.body.removeEventListener('click', this.surface, true);
    } else if (ACTION === this.state.ACTION.SEND_PRESSED) {
      this.sendButton.textContent = '';
      this.sendButton.append(this.Class.sendLoader.content.cloneNode(true));
    } else if (ACTION === this.state.ACTION.SENDING) {
      this.sendButton.firstElementChild!.remove();
      this.sendButton.textContent = 'send';
    }
  }
  protected async send(event: MouseEvent) {
    if (this.textArea.value.length === 0) {
      return;
    }

    const data = {
      name: this.name.textContent!.substring(0, 24),
      review: this.textArea.value,
    };

    this.textArea.value = '';

    await this.state.dispatch(this.state.ACTION.SEND_PRESSED, {session: data});
    await this.state.dispatch(this.state.ACTION.SENDING);
  }
  protected edit(event: MouseEvent) {
    this.name.setAttribute('contenteditable', '');
    this.name.focus();

    const range = document.createRange();
    const selection = window.getSelection() as Selection;

    selection.removeAllRanges();
    range.selectNodeContents(this.name);
    selection.addRange(range);

    this.surface = this.surface.bind(this);

    document.body.addEventListener('click', this.surface, true);
  }
  protected surface(event: MouseEvent) {
    const path = event.composedPath() as Array<HTMLElement>;
    const exist = path.some((element) => element.className === 'name');

    if (exist === false) {
      this.checkUsername();
      this.name.removeAttribute('contenteditable');

      document.body.removeEventListener('click', this.surface, true);

      event.stopImmediatePropagation();
    }
  }
  protected checkUsername() {
    this.name.textContent = (this.name.textContent as string).trim();
    if (this.name.textContent === '') {
      const USERNAME = 'User';

      const recurSetName = (index: number) => {
        if (index < USERNAME.length) {
          this.name.textContent += USERNAME[index++];

          requestAnimationFrame(() => recurSetName(index));
        }
      };

      requestAnimationFrame(() => recurSetName(0));
    }
  }
  protected disconnectedCallback() {
    super.disconnectedCallback();

    document.body.removeEventListener('click', this.surface, true);
  }
}

customElements.define('review-component', ReviewComponent);
customElements.whenDefined('review-component').then(() => {
  console.log('review-component defined');
});
