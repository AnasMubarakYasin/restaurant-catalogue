/* eslint-disable max-len */
import style from '../../styles/detail.module.scss';

import {createNode, createTextNode, html} from '../../../lib/html';
import {Page, PageManager} from '../../../lib/page';
import {State} from '../../../lib/state';
import {CONSTANT} from '../../resource/constant';
import {jumbotron} from '../../scripts/jumbotron';
import {createExtraState, createDetailState} from './state';
import {MutableAttrNode, MutableTextNode} from '../../../lib/mutable';

export class DetailCardPage extends Page {
  title = CONSTANT.PAGE.DETAIL_RESTAURANT.TITLE
  path = CONSTANT.PAGE.DETAIL_RESTAURANT.PATH

  create(cardData) {
    super.create(cardData);

    if (cardData.id === undefined) {
      return PageManager.redirect(CONSTANT.PAGE.HOME.PATH);
    }

    jumbotron.changeView(jumbotron.Class.VIEW_MODE.SMALL);

    this.state = createDetailState(cardData);
    this.extraState = createExtraState(cardData);
    this.title += ` ${cardData.name} | ${CONSTANT.WEBAPP.NAME}`;

    const stateData = this.state.get();
    const toggle = new MutableAttrNode('class', `${style.detail} ${style.loading}`);
    const img = createNode('div', {class: style.img});
    const title = createTextNode(stateData.title);
    const category = createTextNode(stateData.category);
    const rating = new MutableTextNode(stateData.rating);
    const location = createTextNode(stateData.location);
    const description = createTextNode(stateData.description);
    const favoriteText = new MutableTextNode(stateData.favorited);

    this.state.channel.subscribe((ACTION, data) => {
      if (ACTION === this.state.ACTION.LOADED) {
        toggle.set(style.detail);
        img.set(html`<img loading="lazy" decoding="async" class="${style.img}" src="${data.imgUrl}" alt="${data.title}" />`);
        title.set(data.title);
        category.set(data.category);
        rating.set(this.ratingMeter(data.rating));
        location.set(data.location);
        description.set(data.description);

        this.extraState.reviewer.dispatch(this.extraState.reviewer.ACTION.LOADED, {reviewer: data.reviewer});
        this.extraState.review.dispatch(this.extraState.review.ACTION.LOADED);
        this.extraState.menu.dispatch(this.extraState.menu.ACTION.LOADED, {menu: data.menus});
      } else if (ACTION === this.state.ACTION.FAVORITE_PRESSED) {
        favoriteText.set(data.favorited);
      }
    });

    this.setContent(
        /**/html`
          <section ${toggle}>
            <div class="${style.topbar}">
              <button class="${style.btnBack}" onclick="${this.backButtonOnClick.bind(this)}">
                <i class="${style.mdIcons}">navigate_before</i>
                <span class="${style.text}">back</span>
              </button>
              <div class="${style.dividerHidden}"></div>
              <button class="${style.mdIcons} ${style.btnFavorite}" aria-label="favorite" onclick="${this.favoriteOnClick.bind(this)}">
                ${favoriteText}
              </button>
            </div>
            <${img} />
            <article class="${style.content}">
              <h1 class="${style.title}">${title}</h1>
              <h2 class="${style.subtitle}">${category}</h2>
              <h3 class="${style.subtitle2}">
                <i class="${style.mdIcons}">start</i>
                <span class="${style.text}">${rating}</span>
              </h3>
              <h3 class="${style.subtitle2}">
                <i class="${style.mdIcons}">location_on</i>
                <span class="${style.text}">${location}</span>
              </h3>
              <h3 class="${style.subtitle2}">
                <i class="${style.mdIcons}">info_outline</i>
                <span class="${style.text}">Description</span>
              </h3>
              <p class="${style.description}">
                ${description}
              </p>
            </article>
            <menu-component .state="${this.extraState.menu}"></menu-component>
            <section class="${style.review}">
              <h1 class="${style.title}">Reviewer</h1>
              <reviewer-component .state="${this.extraState.reviewer}"></reviewer-component>
              <review-component .state="${this.extraState.review}"></review-component>
            </section>
          </section>
    `);

    this.state
        .dispatch(this.state.ACTION.LOADED)
        .catch((reason) => PageManager.redirect(PageManager.ACTION_PAGE.NOT_FOUND));
  }
  favoriteOnClick(event) {
    if (this.state.get('isLoaded')) {
      this.state.dispatch(this.state.ACTION.FAVORITE_PRESSED);
    }
  }
  backButtonOnClick(event) {
    if (this.state.get('isLoaded')) {
      this.state.dispatch(this.state.ACTION.BACK_BUTTON_PRESSED);
    }
  }
  ratingMeter(count = 1) {
    const METER = ['Nothing', 'Poor', 'Bad', 'Normal', 'Good', 'Perfect'];
    return count +' '+ METER[Math.round(count)];
  }
  destroy() {
    super.destroy();

    jumbotron.changeView(jumbotron.Class.VIEW_MODE.DEFAULT);

    State.destroy(this.state);
    State.destroy(this.extraState.reviewer);
    State.destroy(this.extraState.review);
    State.destroy(this.extraState.menu);
  }
}
