/* eslint-disable max-len */
import {CONSTANT} from '../../resource/constant';
import {dropdownStateGenerator} from '../../components/dropdown/state';
import {typeViewStateGenerator} from '../../components/type-view/state';
import {CardsState, cardsStateGenerator, cardStateGenerator} from '../../components/cards/state';
import {buttonStateGenerator} from '../../components/button/state';
import {addProperty, genRandomNumber, genRandomString} from '../../../lib/helper';
import {PageManager} from '../../../lib/page';
import {dbFavorite, RestaurantShortData} from '../../scripts/db-favorite';
import {State} from '../../../lib/state';
import {RestaurantDetailData} from '../detail/state';

const API = CONSTANT.API;
const COMP = CONSTANT.COMPONENTS;

const pageState = State.create('home page', {
  loaded: false,
  cardList: [] as RestaurantShortData[],
}, {
  LOAD: 0,
  REFRESH: 1,
});
const dropdownState = dropdownStateGenerator('home');
const typeViewState = typeViewStateGenerator('home');
const cardsState = cardsStateGenerator('home');
const buttonState = buttonStateGenerator('home');

pageState.setFactory(async ({ACTION, data, extraData}) => {
  if (ACTION === pageState.ACTION.LOAD) {
    data.cardList = await loadData();
    data.loaded = true;
  } else if (ACTION === pageState.ACTION.REFRESH) {
    data.cardList = await loadData();
  }
  return data;
});

dropdownState.set(COMP.DROPDOWN);

typeViewState.set(COMP.TYPE_VIEW);

cardsState.set({
  sortBy: COMP.TYPE_VIEW.viewBy,
  iteratorCard: COMP.CARDS.iteratorCard,
});

dropdownState.channel.subscribe((ACTION, data) => {
  if (ACTION === dropdownState.ACTION.SELECT) {
    const sortBy = data.selected.substring(5).toLowerCase();
    if (cardsState.get<keyof CardsState>('sortBy') !== sortBy) {
      cardsState.dispatch(cardsState.ACTION.SORTING, {sortBy});
    }
  }
});

buttonState.channel.subscribe((ACTION, data) => {
  if (ACTION === buttonState.ACTION.CLICK) {
    cardsState.dispatch(cardsState.ACTION.LOAD_MORE);
  }
});

const cardStates = Array(cardsState.get().iteratorCard.length)
    .fill(0)
    .map((value, index) => {
      const state = cardStateGenerator();

      let isSuccess = true;

      state.
          set(Array(10).fill(0).map(() => genRandomString(5)).join(' '), 'description').
          set(genRandomNumber(2), 'reviews');

      pageState.channel.subscribe((ACTION, data) => {
        if (ACTION === pageState.ACTION.REFRESH) {
          state.dispatch(state.ACTION.LOADING);
          state.dispatch(state.ACTION.LOADED, data.cardList[index]);
        } else if (ACTION === pageState.ACTION.LOAD) {
          state.dispatch(state.ACTION.LOADED, data.cardList[index]);
        }
      });

      typeViewState.channel.subscribe((ACTION, data) => {
        if (ACTION === typeViewState.ACTION.ACTIVE) {
          state.dispatch(state.ACTION.VIEWING, {viewBy: data.viewBy});
        }
      });

      state.channel.subscribe((ACTION, data) => {
        if (ACTION === state.ACTION.VISITING) {
          PageManager.navigate(CONSTANT.PAGE.DETAIL_RESTAURANT.PATH, data);
        } else if (ACTION === state.ACTION.FAVORITING) {
          if (data.favorited === 'favorite') {
            getDetailApi(data.id).
                then((detailData) => dbFavorite.add(data, detailData)).
                then(() => isSuccess = true).
                catch((r) => {
                  isSuccess = false;
                  state.dispatch(state.ACTION.FAVORITING, {favorited: false});
                });
          } else {
            if (isSuccess) {
              dbFavorite.remove(data.id);
            }
          }
        }
      });
      return state;
    });


export const dropdownStateClone = dropdownState.createClone();
export const typeViewStateClone = typeViewState.createClone();
export const cardsStateClone = cardsState.createClone();
export const cardStateClones = cardStates.map((state) => state.createClone());
export const buttonStateClone = buttonState.createClone();
export const pageStateClone = pageState.createClone();

async function loadData() {
  const listFromDb = await dbFavorite.getAllShortData();
  const response = await fetch(API.HREF + API.GET.LIST);
  const body = await response.json();
  const listFromApi = body.restaurants as Array<RestaurantShortData>;

  return listFromApi.map((dataApi) => {
    const isFavorited = listFromDb.some((dataDb) => dataDb.id === dataApi.id);

    if (isFavorited) {
      addProperty(dataApi, 'favorited', 'favorite');
    }
    if (matchMedia('(max-width: 600px)').matches) {
      dataApi.pictureId = `${API.HREF}${API.PICTURE.SMALL}/${dataApi.pictureId}`;
    } else {
      dataApi.pictureId = `${API.HREF}${API.PICTURE.MEDIUM}/${dataApi.pictureId}`;
    }

    return dataApi;
  });
}

async function getDetailApi(id: string) {
  const response = await fetch(`${API.HREF}${API.GET.DETAIL}/${id}`);
  const body = await response.json();

  return body.restaurant as RestaurantDetailData;
}
