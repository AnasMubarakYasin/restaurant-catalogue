/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import style from '../src/styles/cards.module.scss';

import {html} from '../lib/html';
import {cards} from '../src/components/cards/view';
import {cardStateGenerator, cardsStateGenerator} from '../src/components/cards/state';

import {dbFavorite} from '../src/scripts/db-favorite';

describe('Favorite Restaurant', () => {
  beforeEach(function(done) {
    this.main = document.createElement('main');
    this.count = 4;
    this.ids = ['a', 'b', 'c', ''];

    document.body.append(this.main);

    const cardsState = cardsStateGenerator();
    const cardsStateClone = cardsState.createClone();
    const cardStateList = Array(this.count).fill(0).map((value, index) => {
      const state = cardStateGenerator();

      state.set(this.ids[index], 'id');

      let success = true;

      state.channel.subscribe((ACTION, data) => {
        if (ACTION === state.ACTION.FAVORITING) {
          if (data.favorited === 'favorite') {
            dbFavorite.
                add({id: data.id}, {id: data.id}).
                then(() => success = true).
                catch(() => {
                  success = false;

                  state.dispatch(state.ACTION.FAVORITING, {favorited: false});
                });
          } else {
            if (success) {
              dbFavorite.remove(data.id);
            }
          }
        }
      });

      return state;
    });
    const cardStateCloneList = cardStateList.map((state) => state.createClone());

    this.main.append(/**/html`
        <${cards} class="${style.cardList}" .state="${cardsStateClone}" .data="${cardStateCloneList}" />
    `);

    cardStateList.forEach((state) => state.dispatch(state.ACTION.LOADED));

    this.buttons = document.getElementsByClassName(style.btnFavorite);
    this.cards = document.getElementsByClassName(style.cardItem);

    setTimeout(() => {
      done();
    }, 100);
  });

  afterEach(function() {
    this.main.remove();

    return dbFavorite.clear();
  });

  it('should show card', function() {
    expect(this.cards).toHaveSize(this.count);
  });

  it('should have favorite button', function() {
    expect(this.buttons.item(0).localName).toEqual('button');
  });

  it('should show unfavorite button', function() {
    expect(this.buttons.item(0).firstElementChild.textContent).toEqual('favorite_outline');
  });

  it('should show favorite button if favorite button pressed', function(done) {
    this.buttons.item(0).addEventListener('click', (event) => {
      expect(this.buttons.item(0).firstElementChild.textContent).toEqual('favorite');

      done();
    });

    this.buttons.item(0).dispatchEvent(new Event('click'));
  });

  it('should have data if has been favorited', async function(done) {
    const id = this.ids[0];

    this.buttons.item(0).addEventListener('click', async (event) => {
      expect(await dbFavorite.count()).toEqual(1);
      expect(await dbFavorite.getShortData(id)).toEqual({id});
      expect(await dbFavorite.getDetailData(id)).toEqual({id});

      done();
    });

    expect(await dbFavorite.count()).toEqual(0);

    this.buttons.item(0).dispatchEvent(new Event('click'));
  });

  it('should turn back unfavorite if id empty string', async function(done) {
    const position = 3;

    expect(this.buttons.item(position).firstElementChild.textContent).toEqual('favorite_outline');

    this.buttons.item(position).addEventListener('click', async (event) => {
      expect(await dbFavorite.count()).toEqual(0);
      expect(this.buttons.item(position).firstElementChild.textContent).toEqual('favorite_outline');

      done();
    });

    this.buttons.item(position).dispatchEvent(new Event('click'));
  });
});
