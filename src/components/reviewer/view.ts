/* eslint-disable max-len */
import {Component} from '../../../lib/component';
import {MutableChildNodes} from '../../../lib/mutable';
import {StateStoreInterface} from '../../../lib/state';
import {ReviewerActionState, ReviewerDataState, ReviewerSession} from './state';

export class ReviewerComponent extends Component {
  protected static styleElement = Component.html`
    <style>
      ${Component.styles`
        @mixin sekeleton-loading($depth: 1) {
          @include animation-loading;
          color: transparent;
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
        :host {
          display: block;
        }
        .reviewer {
          @include shadow-box;
          margin: 8px 0;
          display: grid;
          row-gap: 16px;
          padding: 16px 24px;
          border-radius: 6px;
          background-color: white;
          .blank {
            margin: 0;
            padding: 8px 16px;
            background-color: #e6e6e6;
            border-radius: 6px;
            font-size: 16px;
          }
          .session {
            display: grid;
            row-gap: 12px;
            .account {
              display: flex;
              align-items: center;
              .icon {
                display: inherit;
                margin-right: 8px;
                width: 32px;
                height: 32px;
                border: 0.4px solid #b3b3b3;
                border-radius: 50%;
                .md-icons {
                  margin: auto;
                  color: #b3b3b3;
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
              }
              .text {
                display: flex;
                flex-flow: column wrap;
                .name {
                  margin: 0;
                  color: black;
                  font-size: 16px;
                  font-weight: 600;
                }
                .time {
                  font-size: 12px;
                  font-weight: 500;
                }
              }
            }
            .message {
              @extend .blank;
            }
          }
        }
        .reviewer.loading {
          background-color: #f2f2f2;
          .session {
            .account {
              .icon {
                @include sekeleton-loading;
                border: none;
                .md-icons {
                  visibility: hidden;
                }
              }
              .text {
                .name, .time {
                  margin: 2px 0;
                  width: 150%;
                  @include sekeleton-loading;
                }
                .time {
                  width: 200%;
                }
              }
            }
            .message {
              @include sekeleton-loading;
            }
          }
        }
      `}
    </style>
  ` as HTMLStyleElement;
  protected static templateElement = Component.html`
    <template>
      <div class="reviewer"></div>
    </template>
  ` as HTMLTemplateElement;
  private static templateItem = Component.html`
    <template>
      <div class="session">
        <div class="account">
          <div class="icon">
            <i class="md-icons">person</i>
          </div>
          <div class="text">
            <h1 class="name">User</h1>
            <time class="time">timestamp</time>
          </div>
        </div>
        <p class="message">Hello</p>
      </div>
    </template>
  ` as HTMLTemplateElement;
  private static templateBlank = Component.html`
    <p class="blank">Nothing Reviewer</p>
  ` as HTMLParagraphElement;

  public static get style() {
    return this.styleElement;
  }
  public static get template() {
    return this.templateElement;
  };

  constructor() {
    super();

    this.container = this.shadowRoot.querySelector('div') as HTMLDivElement;
    this.list = new MutableChildNodes(this.Class.templateItem.content.cloneNode(true));
    this.list.attach(this.container);
    this.isAfterFirstLoaded = false;
  }

  protected Class!: typeof ReviewerComponent;
  protected state!: StateStoreInterface<ReviewerDataState, ReviewerActionState>

  private container: HTMLDivElement;
  private list: MutableChildNodes;
  private isAfterFirstLoaded: boolean;
  private createSession({date, name, review}: ReviewerSession) {
    const item = this.Class.templateItem.content.cloneNode(true) as HTMLDivElement;

    if (name && date && review) {
      item.querySelector('h1').textContent = name;
      item.querySelector('time').textContent = date;
      item.querySelector('p').textContent = review;

      return item;
    } else {
      return '';
    }
  }

  protected connectedCallback() {
    super.connectedCallback();
  }
  protected disconnectedCallback() {
    super.disconnectedCallback();

    this.list.release();
  }
  protected adoptedCallback() {
    super.adoptedCallback();
  }
  protected attributeChangedCallback(name: string, oldValue: any, newValue: any) {
    super.attributeChangedCallback(name, oldValue, newValue);

    if (name === 'state') {
      this.state.dispatch(this.state.ACTION.LOADING, {});
    }
  }
  protected stateChangedCallback(ACTION: number, data: ReviewerDataState) {
    super.stateChangedCallback(ACTION, data);

    if (ACTION === this.state.ACTION.LOADING) {
      this.container.classList.add('loading');
    } else if (ACTION === this.state.ACTION.LOADED) {
      this.container.classList.remove('loading');
      this.list.clear();

      if (data.reviewer.length) {
        for (const reviewer of data.reviewer) {
          this.list.push(this.createSession(reviewer));
        }
      } else {
        this.list.push(this.Class.templateBlank.cloneNode(true));
      }

      if (this.isAfterFirstLoaded) {
        this.dispatchEvent(new ListChangeEvent('listchange', {target: this, sessions: this.list.get()}));
      }

      this.isAfterFirstLoaded = true;
    }
  }
}

class ListChangeEvent extends Event {
  sessions;

  constructor(type: 'listchange', eventInit: {target: ReviewerComponent, sessions: HTMLCollection}) {
    super(type);

    this.sessions = eventInit.sessions;
  }
}

customElements.define('reviewer-component', ReviewerComponent);
customElements.whenDefined('reviewer-component').then(() => {
  console.log('reviewer-component defined');
});
