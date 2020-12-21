/* eslint-disable max-len */
/* eslint-disable new-cap */
const assert = require('assert');

const CUSTOMER = {
  name: 'Test 11',
  review: 'Good',
};

const API_REVIEW = 'https://dicoding-restaurant-api.el.r.appspot.com/review';

Feature('Review Restaurant');

Scenario('Open Review Page', async ({I}) => {
  I.amOnPage('/home');

  const FIRST_CARD = locate('.src-styles-cards-module-card-item').first();
  const TITLE_CARD = await I.grabTextFrom(FIRST_CARD.find('.src-styles-cards-module-title'));

  I.see(TITLE_CARD, FIRST_CARD);

  I.click(TITLE_CARD, FIRST_CARD);

  I.seeElement('reviewer-component');
  I.seeElement('review-component');
});

Scenario('Review With Empty Name', async ({I}) => {
  I.see('User', 'review-component .name');

  I.click('edit', 'review-component .btn-edit');

  I.fillField('review-component .name', ' ');

  I.click('edit', 'review-component .btn-edit');

  I.see('User', 'review-component .name');

  I.say('the username back to default');
});

Scenario('Review With Empty Review', async ({I}) => {
  I.click('edit', 'review-component .btn-edit');

  I.fillField('review-component .name', CUSTOMER.name);

  I.click('send', 'review-component .btn-send');

  tryTo(() => I.waitForResponse(API_REVIEW));

  I.dontSee(CUSTOMER.name, 'reviewer-component .session');

  I.say('nothing happen');
});

Scenario('Review Restaurant', async ({I}) => {
  I.fillField('review-component .message', CUSTOMER.review);

  I.click('send', 'review-component .btn-send');

  tryTo(() => I.waitForResponse(API_REVIEW));

  within('reviewer-component .reviewer', () => {
    I.see(CUSTOMER.name);
    I.see(CUSTOMER.review);
  });

  within('reviewer-component .session:last-child', async () => {
    const LAST_REVIEW = {
      name: await I.grabTextFrom('.name'),
      review: await I.grabTextFrom('.message'),
    };

    assert.deepStrictEqual(CUSTOMER, LAST_REVIEW, 'not equal');
  });
});
