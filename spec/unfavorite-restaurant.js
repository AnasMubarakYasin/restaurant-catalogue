/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import style from '../src/styles/cards.module.scss';

import {html} from '../lib/html';
import {cards} from '../src/components/cards/view';
import {cardStateGenerator, cardsStateGenerator} from '../src/components/cards/state';

import {dbFavorite} from '../src/scripts/db-favorite';

describe('Unfavorite Restaurant', () => {
  beforeEach(function(done) {
    this.main = document.createElement('main');
    this.CARD_COUNT = 4;
    this.ID_LIST = [...'abcd'];
    this.FAVORITE = 'favorite';
    this.UNFAVORITE = 'favorite_outline';

    document.body.append(this.main);

    const CARDS_STATE = cardsStateGenerator();
    const CARDS_STATE_CLONE = CARDS_STATE.createClone();
    const CARD_STATE_LIST = Array(this.CARD_COUNT).fill(0).map((value, index) => {
      const STATE = cardStateGenerator();

      STATE.set(this.ID_LIST[index], 'id');
      STATE.channel.subscribe((ACTION, data) => {
        if (ACTION === STATE.ACTION.FAVORITING) {
          if (data.favorited === 'favorite') {
            dbFavorite.add({id: data.id}, {id: data.id});
          } else {
            dbFavorite.remove(data.id);
          }
        }
      });

      return STATE;
    });
    const CARD_STATE_CLONE_LIST = CARD_STATE_LIST.map((state) => state.createClone());

    this.main.append(/**/html`
        <${cards} class="${style.cardList}" .state="${CARDS_STATE_CLONE}" .data="${CARD_STATE_CLONE_LIST}" />
    `);

    CARD_STATE_LIST.forEach((state) => state.dispatch(state.ACTION.LOADED));

    this.cards = document.getElementsByClassName(style.cardItem);
    this.buttons = document.getElementsByClassName(style.btnFavorite);

    setTimeout(() => {
      [...this.buttons].forEach((button) => {
        button.addEventListener('click', (event) => {
        });
        button.dispatchEvent(new Event('click'));
      });

      done();
    }, 100);
  });

  afterEach(function() {
    this.main.remove();

    return dbFavorite.clear();
  });

  it('should show card', function() {
    expect(this.cards).toHaveSize(this.CARD_COUNT);
  });

  it('should have favorite button', function() {
    const ITEM_ONE = 0;

    expect(this.buttons.item(ITEM_ONE).localName).toEqual('button');
  });

  it('should show favorite button', function() {
    const ITEM_ONE = 0;

    expect(this.buttons.item(ITEM_ONE).firstElementChild.textContent).toEqual(this.FAVORITE);
  });

  it('should show unfavorite button if favorite button pressed', function(done) {
    const ITEM_ONE = 0;

    this.buttons.item(ITEM_ONE).addEventListener('click', (event) => {
      expect(this.buttons.item(ITEM_ONE).firstElementChild.textContent).toEqual(this.UNFAVORITE);

      done();
    });

    this.buttons.item(ITEM_ONE).dispatchEvent(new Event('click'));
  });

  it('should not have data if it has been unfavorited', async function(done) {
    const ITEM_ONE = 0;
    const ID = this.ID_LIST[ITEM_ONE];

    this.buttons.item(ITEM_ONE).addEventListener('click', async (event) => {
      const ALL_DATA = [{id: 'b'}, {id: 'c'}, {id: 'd'}];
      const THREE = this.CARD_COUNT -1;

      expect(await dbFavorite.count()).toEqual(THREE);
      expect(await dbFavorite.getAllShortData()).toEqual(jasmine.arrayContaining(ALL_DATA));
      expect(await dbFavorite.getShortData(ID)).toBeUndefined();
      expect(await dbFavorite.getDetailData(ID)).toBeUndefined();

      done();
    });

    expect(await dbFavorite.count()).toEqual(this.CARD_COUNT);

    this.buttons.item(ITEM_ONE).dispatchEvent(new Event('click'));
  });
});
