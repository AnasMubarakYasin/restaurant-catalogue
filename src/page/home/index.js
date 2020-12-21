/* eslint-disable max-len */
import stylesCards from '../../styles/cards.module.scss';
import stylesOptionBar from '../../styles/option-bar.scss';

import {html} from '../../../lib/html';
import {Page} from '../../../lib/page';
import {buttonComponent} from '../../components/button/view';
import {cards} from '../../components/cards/view';
import {dropdown} from '../../components/dropdown/view';
import {typeView} from '../../components/type-view/view';
import {
  dropdownStateClone,
  typeViewStateClone,
  cardsStateClone,
  cardStateClones,
  buttonStateClone,
  pageStateClone,
} from './state';
import {CONSTANT} from '../../resource/constant';

export class HomePage extends Page {
  title = CONSTANT.PAGE.HOME.TITLE;
  path = CONSTANT.PAGE.HOME.PATH;
  states = [];
  create() {
    super.create();

    this.setContent(/**/html`
      <section>
        <section class="${stylesCards.cards}">
          <section class="${stylesOptionBar.optionBar}">
            <${dropdown} class="${stylesOptionBar.order}" .state="${dropdownStateClone}" />
            <${typeView}  class="${stylesOptionBar.view}" .state="${typeViewStateClone}" />
          </section>
          <${cards} class="${stylesCards.cardList}" .state="${cardsStateClone}" .data="${cardStateClones}" />
          <${buttonComponent} class="${stylesCards.btnLoad}" .state="${buttonStateClone}">
            Load More
          </>
        </section>
      </section>
    `);

    if (pageStateClone.get('loaded')) {
      pageStateClone.dispatch(pageStateClone.ACTION.REFRESH);
    } else {
      pageStateClone.dispatch(pageStateClone.ACTION.LOAD);
    }
  }
  destroy() {
    super.destroy();

    const states = [
      dropdownStateClone,
      typeViewStateClone,
      cardsStateClone,
      buttonStateClone,
      pageStateClone,
      ...cardStateClones,
    ];

    cardsStateClone.dispatch(cardsStateClone.ACTION.RESET);

    states.forEach((state) => state.reset());
  }
}
