/* eslint-disable no-invalid-this */
import {
  compileCustomAttributes,
  compileCustomChildren,
  html,
} from '../../../lib/html';

export function buttonComponent(attributes, slots) {
  const state = compileCustomAttributes(attributes).state;
  const children = compileCustomChildren(slots);

  return html`
    <button onclick="${click}">
      ...${children}
    </button>
  `;
  function click(event) {
    state.dispatch(state.ACTION.CLICK);
  }
}
