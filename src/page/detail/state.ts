import {mix} from '../../../lib/helper';
import {PageManager} from '../../../lib/page';
import {State, StateStoreInterface} from '../../../lib/state';
import {CardState} from '../../components/cards/state';
import {
  MenuActionState,
  MenuDataState,
  MenuItemState,
} from '../../components/menu/state';
import {
  ReviewActionState,
  ReviewDataState,
  ReviewSession,
} from '../../components/review/state';
import {
  ReviewerActionState,
  ReviewerDataState,
  ReviewerSession,
} from '../../components/reviewer/state';
import {CONSTANT} from '../../resource/constant';
import {dbFavorite} from '../../scripts/db-favorite';

export interface ActionDetailRestaurant {
  LOADED: number;
  FAVORITE_PRESSED: number;
  BACK_BUTTON_PRESSED: number;
}

export interface RestaurantDetailData {
  address: string;
  categories: Array<Category>;
  city: string;
  customerReviews: Array<Review>;
  description: string;
  id: string;
  menus: Array<Menu>;
  name: string;
  pictureId: string;
  rating: number;
}

export interface DetailRestaurant {
  title: string;
  category: string;
  location: string;
  description: string;
  reviewer: Array<Review>;
  id: string;
  imgUrl: string;
  rating: number;
  menus: Array<Menu>;
  favorited: Favorited;
  isLoaded: boolean;
}
type Category = {
  name: string;
}
type Review = {
  name: string;
  review: string;
  date: string;
}
type Menu = {
  name: string;
}
type Favorited = 'favorite' | 'favorite_outline';

export function createDetailState(card: CardState)
: StateStoreInterface<DetailRestaurant, ActionDetailRestaurant> {
  const dataApi = card.favorited === 'favorite_outline' ?
    getDataFromApi(card.id) : getDataFromDb(card.id);
  const state = State.create<DetailRestaurant, ActionDetailRestaurant>(
      'detail', {
        location: '',
        category: '',
        reviewer: [],
        description: '',
        id: '',
        menus: [],
        title: '',
        imgUrl: '',
        rating: 0,
        favorited: card.favorited,
        isLoaded: false,
      }, {
        LOADED: 1,
        FAVORITE_PRESSED: 2,
        BACK_BUTTON_PRESSED: 3,
      });
  state.setFactory(async ({ACTION, data, extraData}) => {
    if (ACTION === state.ACTION.LOADED) {
      const response = await dataApi;
      const extra = response;

      data.imgUrl = setImgURL(extra.pictureId);
      data.title = extra.name;
      data.category = extra.categories
          .map((value: { name: any; }) => value.name)
          .join(' ');
      data.description = extra.description;
      data.location = extra.address +', '+ extra.city;
      data.id = extra.id;
      data.rating = extra.rating;
      data.menus = extra.menus;
      data.reviewer = extra.customerReviews;
      data.isLoaded = true;
    } else if (ACTION === state.ACTION.FAVORITE_PRESSED) {
      if (data.favorited === 'favorite') {
        data.favorited = 'favorite_outline';
      } else {
        data.favorited = 'favorite';
      }
    }
    return data;
  });
  state.channel.subscribe((ACTION, data) => {
    if (ACTION === state.ACTION.BACK_BUTTON_PRESSED) {
      PageManager.back();
    } else if (ACTION === state.ACTION.FAVORITE_PRESSED) {
      if (data.favorited === 'favorite') {
        dataApi.
            then((detailData) => {
              card.favorited = 'favorite';

              dbFavorite.add(card, detailData);
            });
      } else {
        dbFavorite.remove(data.id);
      }
    }
  });
  return state;
}
async function getDataFromApi(id: string): Promise<RestaurantDetailData> {
  const API = CONSTANT.API;
  const response = await fetch(`${API.HREF}${API.GET.DETAIL}/${id}`);
  const body = await response.json();
  return body.restaurant;
}
async function getDataFromDb(id: string) {
  return dbFavorite.getDetailData(id);
}
export function createExtraState(cardData: CardState)
: {reviewer: StateStoreInterface<ReviewerDataState, ReviewerActionState>,
  review: StateStoreInterface<ReviewDataState, ReviewActionState>
  menu: StateStoreInterface<MenuDataState, MenuActionState>} {
  const id = cardData.id;
  const reviewer = State.create<ReviewerDataState, ReviewerActionState>(
      'reviewer',
      {
        reviewer: [],
      }, {
        LOADING: 1,
        LOADED: 2,
      });
  const review = State.create<ReviewDataState, ReviewActionState>(
      'review',
      {
        response: [],
        session: {id: id, name: '', review: ''},
        success: false,
      }, {
        LOADED: 0,
        SEND_PRESSED: 1,
        SENDING: 2,
        LOADING: 3,
      },
  );
  const menu = State.create<MenuDataState, MenuActionState>(
      'menu',
      {
        menus: [],
      }, {
        LOADED: 0,
        LOADING: 1,
      },
  );
  reviewer.setFactory(({ACTION, data, extraData}) => {
    if (ACTION === reviewer.ACTION.LOADED) {
      data.reviewer.length = 0;
      data.reviewer.push(...extraData.reviewer);
    }
    return data;
  });
  review.setFactory(async ({ACTION, data, extraData}) => {
    if (ACTION === review.ACTION.SEND_PRESSED) {
      mix(data.session, extraData.session);
    } else if (ACTION === review.ACTION.SENDING) {
      const response = await sendReview(data.session);
      const body = await response.json() as ResponseReview;

      data.session = {id: id, name: '', review: ''};
      data.success = true;
      data.response = body.customerReviews;
    }
    return data;
  });
  menu.setFactory(({ACTION, data, extraData}) => {
    if (ACTION === menu.ACTION.LOADED) {
      for (const [name, list] of Object.entries(extraData.menu)) {
        data.menus.push(
            {
              name: name
                  .replace(/^.{1}/, (firstChar) => firstChar.toUpperCase()),
              list: list as Array<MenuItemState>,
            },
        );
      }
    }
    return data;
  });
  review.channel.subscribe(async (ACTION, data) => {
    if (ACTION === review.ACTION.SENDING) {
      reviewer.dispatch(reviewer.ACTION.LOADED, {reviewer: data.response});
    } else if (ACTION === review.ACTION.SEND_PRESSED) {
      reviewer.dispatch(reviewer.ACTION.LOADING);
    }
  });
  return {reviewer, review, menu};
}

type RequestMethod = 'cors' |
  'navigate' |
  'no-cors' |
  'same-origin' |
  undefined
;
type ResponseReview = {
  error: boolean;
  message: string;
  customerReviews: Array<ReviewerSession>;
}

function setImgURL(id: string) {
  return CONSTANT.API.HREF + CONSTANT.API.PICTURE.MEDIUM +'/'+ id;
}
function sendReview(message: ReviewSession) {
  const headers = new Headers(CONSTANT.API.REVIEW.HEADERS);
  const mode = CONSTANT.API.REVIEW.MODE as RequestMethod;
  const method = CONSTANT.API.REVIEW.METHOD;
  const body = JSON.stringify(message);

  return fetch(`${CONSTANT.API.HREF}${CONSTANT.API.REVIEW.PATH}`, {
    method,
    headers,
    mode,
    body,
  });
}
