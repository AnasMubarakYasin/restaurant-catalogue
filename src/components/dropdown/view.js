/* eslint-disable max-len */
import {css} from '../../../lib/css';
import {
  html,
  createTextNode,
  createChildNodes,
  compileCustomAttributes,
} from '../../../lib/html';
import {MutableAttrNode} from '../../../lib/mutable';
import styles from '../../styles/option-bar.scss';

const style = /* css*/css`
  .active {
    background-color: #E6E6E6 !important;
  }
`;

function generateFoldList(list = [], selected = '', handlerClick) {
  const result = [];
  for (const item of list) {
    result.push(
        /**/html`
          <li class="${styles.item} ${selected === item ? style.active : ''}">
            <a class="${styles.link}" href="#?" onclick="${handlerClick}">
              ${item}
            </a>
          </li>
        `,
    );
  }
  return result;
}

export function dropdown(attributes) {
  const state = compileCustomAttributes(attributes).state;
  const selected = createTextNode(state.get('selected'));
  const list = createChildNodes(...generateFoldList(
      state.get('list'),
      state.get('selected'),
      listClick,
  ));
  const toggleDrop = new MutableAttrNode('class', styles.list);

  state.subscribe((ACTION, data) => {
    if (data.folding) {
      hide();
    } else {
      show();
    }
    if (ACTION === state.ACTION.SELECT) {
      select(data.selected);
    }
  });

  return /**/html`
    <div>
      <button class="${styles.btn}" onclick="${buttonClick}">
        <span class="${styles.text}">${selected}</span>
        <i class="${styles.mdIcons}">expand_more</i>
      </button>
      <ul ${toggleDrop} onfocusin="${focusin}" onfocusout="${focusout}">
        ...${list}
      </ul>
    </div>
  `;

  function buttonClick(event) {
    state.dispatch(state.ACTION.CLICKED);
  }
  function listClick(event) {
    state.dispatch(state.ACTION.SELECT, {
      selected: event.target.textContent,
    });
    event.preventDefault();
  }
  function focusin(event) {
    state.dispatch(state.ACTION.FOCUS_LIST, {focusList: true});
  }
  function focusout(event) {
    state.dispatch(state.ACTION.FOCUS_LIST, {focusList: false});
  }
  function surface(event) {
    const isButtonClicked = event.composedPath().some((element) => element.className === styles.btn);
    if (isButtonClicked) {
      return;
    } else if (state.get('focusList') === false) {
      state.dispatch(state.ACTION.FOLDING, {folding: true});
    }
  }
  function show() {
    toggleDrop.set(styles.list +' '+ styles.show);
    document.body.addEventListener('click', surface, {capture: true});
  }
  function hide() {
    toggleDrop.set(styles.list +' '+ styles.hide);
    document.body.removeEventListener('click', surface, {capture: true});
  }
  function select(value) {
    selected.set(value);
    list.forEach((element) => {
      if (element.textContent === value) {
        element.classList.add(style.active);
      } else {
        element.classList.remove(style.active);
      }
    });
  }
}
