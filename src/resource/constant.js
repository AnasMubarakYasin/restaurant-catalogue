/* eslint-disable max-len */

export const CONSTANT = {
  WEBAPP: {
    NAME: 'FoodHunt',
    DESC: 'Catalog Restaurant',
    PATH: './',
    SERVICE_PATH: 'sw.js',
  },
  API: {
    HREF: 'https://dicoding-restaurant-api.el.r.appspot.com',
    PICTURE: {
      SMALL: '/images/small',
      MEDIUM: '/images/medium',
      LARGE: '/images/large',
    },
    GET: {
      LIST: '/list',
      DETAIL: '/detail',
    },
    REVIEW: {
      PATH: '/review',
      METHOD: 'POST',
      HEADERS: [['Content-Type', 'application/json'], ['X-Auth-Token', '12345']],
      MODE: 'cors',
    },
  },
  DB: {
    FAVORITE: {
      NAME: 'favorite restaurant',
      STORE_LIST: ['short', 'detail'],
      KEY: 'id',
      INDEX: 'id',
    },
  },
  COMPONENTS: {
    DROPDOWN: {
      clicked: false,
      folding: true,
      focusList: false,
      selected: 'Most Rating',
      list: ['Most Rating', 'Most Reviews'],
    },
    TYPE_VIEW: {
      viewBy: 'module',
      viewList: ['module', 'list'],
    },
    CARDS: {
      SORT_BY: '',
      VIEW_BY: '',
      iteratorCard: {
        start: 0,
        position: 0,
        count: 4,
        length: 20,
        lastCount: -1,
      },
    },
    CARD: {
      id: '',
      city: '',
      cuisines: '',
      description: '',
      name: '',
      pictureId: '',
      rating: 0,
      reviews: 0,
      viewBy: '',
      isLoaded: false,
      visited: false,
      favorited: '',
    },
  },
  PAGE: {
    HOME: {
      PATH: 'home',
      TITLE: 'Home | FoodHunt Catalog Restaurant',
    },
    DETAIL_RESTAURANT: {
      PATH: 'detail',
      TITLE: 'Restaurant',
    },
    ABOUT: {
      PATH: 'about',
      TITLE: 'About | FoodHunt',
    },
    FAVORITE: {
      PATH: 'favorite',
      TITLE: 'Favorite | FoodHunt',
    },
  },
};
