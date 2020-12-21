import {State, StateStoreInterface} from '../../../lib/state';

export interface DropdownState {
  clicked: boolean;
  folding: boolean;
  focusList: boolean;
  selected: string;
  list: Array<string>;
}

export interface DropdownAction {
  FOCUS_LIST: number,
  SELECT: number;
  FOLDING: number;
  CLICKED: Number;
}

export function dropdownStateGenerator(suffix: string)
: StateStoreInterface<DropdownState, DropdownAction> {
  const dropdownState = State.create<DropdownState, DropdownAction>(
      'dropdown'+ suffix, {
        folding: true,
        focusList: true,
        selected: '',
        list: [],
        clicked: false,
      }, {
        FOCUS_LIST: 2,
        FOLDING: 1,
        SELECT: 0,
        CLICKED: 3,
      });

  dropdownState.setFactory(({ACTION, data, extraData}) => {
    if (ACTION === dropdownState.ACTION.SELECT) {
      data.selected = extraData.selected;
    } else if (ACTION === dropdownState.ACTION.CLICKED) {
      data.clicked = true;
      if (data.folding && data.focusList === false) {
        data.folding = false;
      } else {
        data.folding = true;
      }
    } else if (ACTION === dropdownState.ACTION.FOLDING) {
      data.folding = extraData.folding;
    } else if (ACTION === dropdownState.ACTION.FOCUS_LIST) {
      data.focusList = extraData.focusList;
    }
    return data;
  });
  return dropdownState;
}
