/* eslint-disable max-len */
import {compileCustomAttributes, createChildNodes, html} from '../../../lib/html';
import {css} from '../../../lib/css';
import styles from '../../styles/option-bar.scss';

const style = css`
  .active {
    background-color: #E6E6E6 !important;
  }
`;

function generateButton(list = [], active, clickHandler) {
  const result = [];
  for (const item of list) {
    result.push(html`
      <button class="${styles.mdIcons} ${styles.btn} ${styles.list} ${item === active ? style.active : ''}" onclick="${clickHandler}" data-item="${item}" aria-label="${'view by ' + item}">
        ${'view_'+ item}
      </button>
    `);
  }
  return result;
}

export function typeView(attributes) {
  const state = compileCustomAttributes(attributes).state;
  const buttons = createChildNodes(
      ...generateButton(
          state.get('viewList'),
          state.get('viewBy'),
          click,
      ),
  );

  state.subscribe((ACTION, data) => {
    if (ACTION === state.ACTION.ACTIVE) {
      active(data.viewBy);
    }
  });

  return html`
    <div>
      ...${buttons}
    </div>
  `;

  function click(event) {
    state.dispatch(state.ACTION.ACTIVE, {viewBy: event.target.textContent});
  }
  function active(item) {
    buttons.forEach((element) => {
      if (element.textContent === 'view_'+ item) {
        element.classList.add(style.active);
      } else {
        element.classList.remove(style.active);
      }
    });
  }
}
