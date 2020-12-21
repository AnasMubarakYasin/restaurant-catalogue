/* eslint-disable max-len */
/* eslint-disable new-cap */
const assert = require('assert');

Feature('Favorite Restaurant');

Before(({I}) => {
  I.amOnPage('/home');
});

Scenario('Favorite Restaurant', async ({I}) => {
  const FIRST_CARD = locate('.src-styles-cards-module-card-item').first();
  const TITLE_CARD = await I.grabTextFrom(FIRST_CARD.find('.src-styles-cards-module-title'));

  I.see(TITLE_CARD, FIRST_CARD);
  I.see('favorite_outline', FIRST_CARD);

  I.click('favorite_outline', FIRST_CARD);

  I.see('favorite', FIRST_CARD);

  I.click('Favorites');

  I.seeInCurrentUrl('/favorite');

  const FIRST_FAVORITE_CARD = locate('.src-styles-cards-module-title').first();
  const TITLE_FAVORITE_CARD = await I.grabTextFrom(FIRST_FAVORITE_CARD);

  I.see(TITLE_FAVORITE_CARD);

  assert.strictEqual(TITLE_CARD, TITLE_FAVORITE_CARD, 'not equal');
});

Scenario('UnFavorite Restaurant', async ({I}) => {
  const FIRST_CARD = locate('.src-styles-cards-module-card-item').first();

  I.see('favorite', FIRST_CARD);

  I.click('favorite', FIRST_CARD);

  I.see('favorite_outline', FIRST_CARD);

  I.click('Favorites');

  I.seeInCurrentUrl('/favorite');
  I.see('Empty Favorite List');
});
