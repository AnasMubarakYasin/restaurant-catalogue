import {genRandomString} from '../../../lib/helper';
import {PageManager} from '../../../lib/page';
import {State, StateStoreInterface} from '../../../lib/state';
import {
  cardsStateGenerator,
  CardState,
  CardStateAction,
  cardStateGenerator,
} from '../../components/cards/state';
import {dropdownStateGenerator} from '../../components/dropdown/state';
import {
  TypeViewState,
  typeViewStateGenerator,
} from '../../components/type-view/state';
import {CONSTANT} from '../../resource/constant';
import {dbFavorite} from '../../scripts/db-favorite';

const SUFFIX = 'favorite';
const COMP = CONSTANT.COMPONENTS;

const dropdownState = dropdownStateGenerator(SUFFIX);
const typeViewState = typeViewStateGenerator(SUFFIX);
const cardsState = cardsStateGenerator(SUFFIX);
const cardDataList = Array(4).fill(undefined);

dropdownState.set(COMP.DROPDOWN);

typeViewState.set(COMP.TYPE_VIEW);

dropdownState.channel.subscribe((ACTION, data) => {
  if (ACTION === dropdownState.ACTION.SELECT) {
    console.log(data.selected);

    cardsState.dispatch(
        cardsState.ACTION.SORTING,
        {sortBy: data.selected.substring(5).toLowerCase()},
    );
  }
});

const dropdown = dropdownState.createClone();
const typeView = typeViewState.createClone();
const cards = cardsState.createClone();
const cardState = createCardlist(cardDataList);
const cardlist = cardState.clone;

load();

export {
  dropdown,
  typeView,
  cards,
  cardlist,
};

function createCardlist(data: Array<CardState>) {
  const states = {
    original: [] as Array<StateStoreInterface<CardState, CardStateAction>>,
    clone: [],
  };
  for (const item of data) {
    const state = cardStateGenerator(item);

    typeView.subscribe((ACTION, data) => {
      if (ACTION === typeViewState.ACTION.ACTIVE) {
        console.log(data.viewBy);

        state.dispatch(state.ACTION.VIEWING, {viewBy: data.viewBy});
      }
    });

    state.set(
      typeViewState.get<keyof TypeViewState>('viewBy') as string,
      'viewBy',
    );

    state.channel.subscribe((ACTION, data) => {
      if (ACTION === state.ACTION.FAVORITING) {
        if (data.favorited === 'favorite_outline') {
          dbFavorite.remove(data.id);
        }
      } else if (ACTION === state.ACTION.VISITING) {
        PageManager.navigate(CONSTANT.PAGE.DETAIL_RESTAURANT.PATH, data);
      }
    });

    if (item === undefined) {
      state.set(
          Array(10).fill(0).map(() => genRandomString(5)).join(' '),
          'description',
      );
    }

    states.original.push(state);
    states.clone.push(state.createClone());
  }
  return states;
}
async function load() {
  const data = await dbFavorite.getAllShortData();
  init(data);
}
function init(list: Array<CardState>) {
  typeView.reset();

  const stateList = createCardlist(list as Array<CardState>);

  for (const state of cardState.original) {
    State.destroy(state);
  }

  cardState.original = stateList.original;
  cardState.clone.length = 0;
  cardState.clone.push(...stateList.clone);
  cardsState.dispatch(cardsState.ACTION.LOADED, {iteratorCard: {
    count: cardState.clone.length,
    position: 0,
    lastCount: -1,
    length: cardState.clone.length,
    start: 0,
  }});

  for (const state of stateList.original) {
    dbFavorite.onChange((event) => {
      state.dispatch(state.ACTION.LOADING);
    }, {once: true});
    state.dispatch(state.ACTION.LOADED);
  }

  dbFavorite.onChange(() => {
    load();
  }, {once: true});
}
