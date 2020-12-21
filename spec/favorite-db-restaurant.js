import 'regenerator-runtime';

import {itActsAsFavoriteRestaurantDb} from './contract/favorite-db-restaurant';
import {dbFavorite} from '../src/scripts/db-favorite';

describe('Favorite Restaurant Database Contract Test Implementation', () => {
  itActsAsFavoriteRestaurantDb(dbFavorite);
});
