import {State, StateStoreInterface} from '../../../lib/state';

export interface TypeViewState {
  viewBy: string;
  viewList: Array<string>;
}
type TypeViewStateAction = {
  ACTIVE: number;
}

export function typeViewStateGenerator(suffix: string)
: StateStoreInterface<TypeViewState, TypeViewStateAction> {
  const state = State.create<TypeViewState, TypeViewStateAction>(
      'type view'+ suffix, {
        viewBy: '',
        viewList: [],
      }, {
        ACTIVE: 0,
      });
  state.setFactory(({ACTION, data, extraData}) => {
    if (ACTION === state.ACTION.ACTIVE) {
      data.viewBy = (extraData.viewBy as string).slice(5);
    }
    return data;
  });

  return state;
}
