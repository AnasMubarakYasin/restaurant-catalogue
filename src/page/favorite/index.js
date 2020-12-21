/* eslint-disable max-len */
import {html} from '../../../lib/html';
import {Page, PageManager} from '../../../lib/page';
import {CONSTANT} from '../../resource/constant';
import {cards} from '../../components/cards/view';
import {dropdown} from '../../components/dropdown/view';
import {typeView} from '../../components/type-view/view';
import {jumbotron} from '../../scripts/jumbotron';
import {emptyComponent, emptyComponentStyle} from '../error/template';
import {MutableAttrNode} from '../../../lib/mutable';
import imgEmptyUrl from '../../public/images/svg/bg-9.svg';
import styleCard from '../../styles/cards.module.scss';
import styleOptionBar from '../../styles/option-bar.scss';
import * as state from './state';
import {dbFavorite} from '../../scripts/db-favorite';

export class FavoritePage extends Page {
  title = CONSTANT.PAGE.FAVORITE.TITLE;
  path = CONSTANT.PAGE.FAVORITE.PATH;
  idListener = Promise.resolve(0);

  create() {
    jumbotron.changeView(jumbotron.Class.VIEW_MODE.SMALL);

    const classAttr = new MutableAttrNode('class', styleOptionBar.optionBar);
    const element = emptyComponent({
      title: 'Empty Favorite List',
      subtitle: 'Favorite something on Home page and it will show up here',
      imgURL: imgEmptyUrl,
      onButtonPressed: () => PageManager.back(),
    });

    this.setContent(
        /**/html`
          <div>
            <div class="${styleCard.cards}">
              <div ${classAttr}>
                <${dropdown} class="${styleOptionBar.order}" .state="${state.dropdown}" />
                <${typeView}  class="${styleOptionBar.view}" .state="${state.typeView}" />
              </div>
              <${cards} class="${styleCard.cardList}" .state="${state.cards}" .data="${state.cardlist}" />
            </div>
            <${element} />
          </div>
        `,
    );

    check();

    this.idListener = dbFavorite.onChange((event) => {
      check();
    });

    function check() {
      dbFavorite.
          count().
          then((count) => toggle(count));
    }
    function toggle(count) {
      if (count) {
        classAttr.remove(emptyComponentStyle.none);
        element.classList.add(emptyComponentStyle.none);
      } else {
        classAttr.add(emptyComponentStyle.none);
        element.classList.remove(emptyComponentStyle.none);
      }
    }
  }
  destroy() {
    jumbotron.changeView(jumbotron.Class.VIEW_MODE.DEFAULT);

    this.idListener.then((id) => {
      dbFavorite.removeListener(id);
    });
  }
}
