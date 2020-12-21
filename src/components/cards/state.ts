import {mix} from '../../../lib/helper';
import {State, StateStoreInterface} from '../../../lib/state';

export interface CardsState {
  sortBy: string;
  iteratorCard: IteratorCard;
}
type IteratorCard = {
  start: number;
  position: number;
  count: number;
  lastCount: number;
  length: number;
}
type CardsStateAction = {
  LOAD_MORE: number;
  SORTING: number;
  RESET: number;
  LOAD: number;
  LOADED: number;
}

export function cardsStateGenerator(suffix: string)
:StateStoreInterface<CardsState, CardsStateAction> {
  const state = State.create<CardsState, CardsStateAction>(
      'cards'+ suffix, {
        sortBy: '',
        iteratorCard: {
          count: 4,
          position: 0,
          lastCount: -1,
          length: 4,
          start: 0,
        },
      }, {
        LOAD_MORE: 0,
        SORTING: 1,
        RESET: 2,
        LOAD: 3,
        LOADED: 4,
      });

  state.setFactory(({ACTION, data, extraData}) => {
    if (ACTION === state.ACTION.SORTING) {
      data.sortBy = extraData.sortBy;
    } else if (ACTION === state.ACTION.RESET) {
      if (data.iteratorCard.lastCount === -1) {
        data.iteratorCard.lastCount = data.iteratorCard.count;
        if (data.iteratorCard.length !== data.iteratorCard.position) {
          data.iteratorCard.count = data.iteratorCard.position +
          data.iteratorCard.count;
        } else {
          data.iteratorCard.count = data.iteratorCard.length;
        }
      }
      data.iteratorCard.position = 0;
    } else if (ACTION === state.ACTION.LOAD_MORE) {
      if ((data.iteratorCard.length - data.iteratorCard.count) >
        data.iteratorCard.position
      ) {
        data.iteratorCard.position += data.iteratorCard.count;
      } else {
        data.iteratorCard.position += data.iteratorCard.count;
        data.iteratorCard.count = data.iteratorCard.start;
      }
      if (data.iteratorCard.lastCount !== -1) {
        data.iteratorCard.count = data.iteratorCard.lastCount;
        data.iteratorCard.lastCount = -1;
      }
    } else if (ACTION === state.ACTION.LOADED) {
      data.iteratorCard = extraData.iteratorCard as IteratorCard;
    }
    return data;
  });

  return state;
}

export interface CardState {
  viewBy: CardView;
  isLoaded: boolean;
  id: string;
  name: string;
  description: string;
  pictureId: string;
  city: string;
  rating: number;
  cuisines: string;
  reviews: number;
  favorited: CardFavorite;
  visited: boolean;
}
export type CardView = 'module' | 'list';
export type CardFavorite = 'favorite_outline' | 'favorite'
export type CardStateAction = {
  VIEWING: number;
  LOADING: number;
  LOADED: number;
  VISITING: number;
  FAVORITING: number,
}

export function cardStateGenerator(data: CardState | undefined = undefined)
: StateStoreInterface<CardState, CardStateAction> {
  const dataState: CardState = data || {
    viewBy: 'module',
    isLoaded: false,
    id: '',
    name: '',
    description: '',
    pictureId: '',
    city: '',
    rating: 0,
    cuisines: '',
    reviews: 0,
    favorited: 'favorite_outline',
    visited: false,
  };
  const actionState = {
    VIEWING: 0,
    LOADED: 1,
    VISITING: 2,
    LOADING: 3,
    FAVORITING: 4,
  };
  const state = State.create<CardState, CardStateAction>(
      '', dataState, actionState,
  );

  state.setFactory(({ACTION, data, extraData}) => {
    if (ACTION === state.ACTION.VIEWING) {
      data.viewBy = extraData.viewBy;
    } else if (ACTION === state.ACTION.LOADED) {
      mix(data, extraData);

      data.isLoaded = true;
    } else if (ACTION === state.ACTION.LOADING) {
      data.favorited = 'favorite_outline';
      data.pictureId = '';
      data.visited = false;
      data.isLoaded = false;
    } else if (ACTION === state.ACTION.FAVORITING) {
      if (typeof extraData.favorited === 'boolean') {
        if (extraData.favorited) {
          data.favorited = 'favorite';
        } else {
          data.favorited = 'favorite_outline';
        }
      } else {
        if (data.favorited === 'favorite') {
          data.favorited = 'favorite_outline';
        } else {
          data.favorited = 'favorite';
        }
      }
    }
    return data;
  });

  return state;
}
