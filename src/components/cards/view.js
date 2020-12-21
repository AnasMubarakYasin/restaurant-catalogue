/* eslint-disable max-len */
import {compileCustomAttributes, html} from '../../../lib/html';
import {MutableAttrNodes, MutableChildNodes, MutableNode, MutableTextNode} from '../../../lib/mutable';
import styles from '../../styles/cards.module.scss';

export function cards(attributes) {
  const attr = compileCustomAttributes(attributes);
  const state = attr.state;
  const dataCard = attr.data;
  const nodes = generateCard(dataCard, state.get('iteratorCard'));
  const cards = new MutableChildNodes(...nodes);

  state.subscribe((ACTION, data) => {
    if (ACTION === state.ACTION.SORTING) {
      const result = cards.sort((a, b) => {
        return b.dataset[data.sortBy] - a.dataset[data.sortBy];
      });
      requestAnimationFrame((time) => {
        cards.set(...result);
      });
    } else if (ACTION === state.ACTION.LOAD_MORE) {
      const nodes = generateCard(dataCard, state.get('iteratorCard'));
      requestAnimationFrame((time) => {
        if (nodes.length) {
          cards.set(...cards.concat(...nodes));
        }
      });
    } else if (ACTION === state.ACTION.LOADED) {
      cards.clear();
      cards.push(...generateCard(dataCard, state.get('iteratorCard')));
    }
  });

  return /**/html`
    <section>
      ...${cards}
    </section>
  `;
}

function generateCard(data = [], iterator = {}) {
  const nodes = [];

  for (let index = iterator.start; index < iterator.count; index++) {
    nodes.push(
        /**/html`<${card} .state="${data[iterator.position++]}" />`,
    );
  }

  return nodes;
}

export function card(attributes) {
  const state = compileCustomAttributes(attributes).state;
  const attrs = new MutableAttrNodes({
    'class': `${styles.cardItem} ${styles[state.get('viewBy')]} ${state.get('isLoaded') ? '' : styles.loading}`,
    'data-rating': state.get('rating'),
    'data-reviews': state.get('reviews'),
  });
  const imgAttribute = {
    loading: 'lazy',
    decoding: 'async',
    class: styles.img,
    src: state.get('pictureId'),
    alt: state.get('name'),
    width: '640',
    height: '360',
  };
  const img = state.get('isLoaded') ? new MutableNode('img', imgAttribute) : new MutableNode('div', {class: styles.img});
  const favorite = new MutableTextNode(state.get('favorited'));
  const location1 = new MutableTextNode(state.get('city'));
  const location2 = new MutableTextNode(state.get('city'));
  const rating = new MutableTextNode(state.get('rating'));
  const reviews = new MutableTextNode(state.get('reviews'));
  const description = new MutableTextNode(state.get('description').slice(0, 100));
  const link = new MutableNode(
      'a',
      {
        class: styles.link,
        href: state.get('name') +'?id='+ state.get('id'),
        onclick: onClick,
      },
      [state.get('name')],
  );
  const anchor = link.get();

  state.subscribe((ACTION, data) => {
    if (ACTION === state.ACTION.VIEWING) {
      requestAnimationFrame((time) => {
        attrs.setNamedItem('class', `${styles.cardItem} ${styles[data.viewBy]} ${data.isLoaded ? '' : styles.loading}`);
      });
    } else if (ACTION === state.ACTION.LOADED) {
      requestAnimationFrame(() => {
        attrs.setNamedItem('class', `${styles.cardItem} ${styles[data.viewBy]}`);
        attrs.setNamedItem('data-rating', data.rating);
        attrs.setNamedItem('data-reviews', data.reviews);
        imgAttribute.src = data.pictureId;
        img.set(html`<img ${imgAttribute} alt="${data.name}" />`);
        location1.set(data.city);
        location2.set(data.city);
        rating.set(data.rating);
        reviews.set(data.reviews);
        description.set(data.description.slice(0, 100));
        favorite.set(data.favorited);
        anchor.textContent = data.name;
        anchor.href = data.name +'?id='+ data.id;
      });
    } else if (ACTION === state.ACTION.FAVORITING) {
      favorite.set(state.get('favorited'));
    } else if (ACTION === state.ACTION.LOADING) {
      requestAnimationFrame(() => {
        attrs.setNamedItem('class', `${styles.cardItem} ${styles[data.viewBy]} ${styles.loading}`);
        img.set(html`<div class="${styles.img}"></div>`);
      });
    }
  });
  return /**/html`
    <div ${attrs}>
      <div class="${styles.imgWrapper}">
        <${img} />
        <button class="${styles.btnFavorite}" aria-label="favorite" onclick="${onFavoriteClick}">
          <i class="${styles.mdIcons}">${favorite}</i>
        </button>
        <address class="${styles.location}">
          <i class="${styles.mdIcons}">place</i>
          <span class="${styles.text}">${location1}</span>
        </address>
      </div>
      <div class="${styles.contentWrapper}">
        <h1 class="${styles.title}">
          <${link} />
        </h1>
        <div class="${styles.subtitle}">
          <h2 class="${styles.rating}">
            <i class="${styles.mdIcons}">start</i>
            <span class="${styles.text}">${rating}</span>
          </h2>
          <h2 class="${styles.review}">
            <i class="${styles.mdIcons}">chat_bubble</i>
            <span class="${styles.text}">${reviews}</span>
          </h2>
          <address class="${styles.location}">
            <i class="${styles.mdIcons}">place</i>
            <span class="${styles.text}">${location2}</span>
          </address>
        </div>
        <h2 class="${styles.subtitle2}">Description</h3>
        <p class="${styles.description}">${description}</p>
      </div>
    </div>
  `;
  function onClick(event) {
    event.preventDefault();

    if (state.get('isLoaded')) {
      state.dispatch(state.ACTION.VISITING);
    }
  }
  function onFavoriteClick(event) {
    if (state.get('isLoaded')) {
      state.dispatch(state.ACTION.FAVORITING);
    }
  }
}
