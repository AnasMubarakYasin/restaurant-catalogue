import {State, StateStoreInterface} from '../../../lib/state';

interface ButtonState {
  clicked: boolean;
}
type ButtonStateAction = {
  CLICK: 0;
}

export function buttonStateGenerator(suffix: string)
: StateStoreInterface<ButtonState, ButtonStateAction> {
  const state = State.create<ButtonState, ButtonStateAction>(
      'button'+ suffix, {
        clicked: false,
      }, {
        CLICK: 0,
      });

  state.setFactory(({ACTION, data, extraData}) => {
    if (ACTION === state.ACTION.CLICK) {
      data.clicked = extraData.clicked;
    }
    return data;
  });

  return state;
}
