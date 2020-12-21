/* eslint-disable no-invalid-this */
/* eslint-disable max-len */
import '../src/components/reviewer/view';
import '../src/components/review/view';

import {mix} from '../lib/helper';
import {State} from '../lib/state';

describe('Review Restaurant', () => {
  beforeEach(async function() {
    this.CONTAINER = document.createElement('main');
    this.REVIEWER_DATA = {
      reviewer: [
        {name: 'a', review: 'aaa', date: new Date()},
        {name: 'b', review: 'bbb', date: new Date()},
        {name: 'c', review: 'ccc', date: new Date()},
      ],
    };
    this.COUNT = 3;

    const ID = 'a';

    this.reviewerState = State.create(
        'reviewer',
        {
          reviewer: [],
        }, {
          LOADING: 1,
          LOADED: 2,
        });
    this.reviewState = State.create(
        'review',
        {
          response: [],
          session: {id: ID, name: '', review: ''},
          success: false,
        }, {
          LOADED: 0,
          SEND_PRESSED: 1,
          SENDING: 2,
          LOADING: 3,
        },
    );

    this.reviewerComponent = document.createElement('reviewer-component');
    this.reviewComponent = document.createElement('review-component');

    this.reviewerState.setFactory(({ACTION, data, extraData}) => {
      if (ACTION === this.reviewerState.ACTION.LOADED) {
        data.reviewer.length = 0;
        data.reviewer.push(...extraData.reviewer);
      }
      return data;
    });

    this.reviewState.setFactory(async ({ACTION, data, extraData}) => {
      if (ACTION === this.reviewState.ACTION.SEND_PRESSED) {
        mix(data.session, extraData.session);
      } else if (ACTION === this.reviewState.ACTION.SENDING) {
        const response = await this.sendReview(data.session);
        const body = await response.json();

        data.session = {id: ID, name: '', review: ''};
        data.success = true;
        data.response = body.customerReviews;
      }
      return data;
    });

    this.reviewState.channel.subscribe((ACTION, data) => {
      if (ACTION === this.reviewState.ACTION.SENDING) {
        this.reviewerState.dispatch(this.reviewerState.ACTION.LOADED, {reviewer: data.response});
      }
    });

    this.reviewerComponent.setAttribute('.state', this.reviewerState);
    this.reviewComponent.setAttribute('.state', this.reviewState);

    this.CONTAINER.append(this.reviewerComponent);
    this.CONTAINER.append(this.reviewComponent);

    document.body.append(this.CONTAINER);

    await this.reviewerState.dispatch(this.reviewerState.ACTION.LOADED, this.REVIEWER_DATA);
    await this.reviewState.dispatch(this.reviewState.ACTION.LOADED);

    this.sendReview = (message) => {
      const payload = JSON.stringify({
        error: false,
        message: 'success',
        customerReviews: [...this.REVIEWER_DATA.reviewer, {
          name: message.name,
          review: message.review,
          date: new Date(),
        }],
      });

      return Promise.resolve(new Response(payload, {status: 200}));
    };
  });
  afterEach(function() {
    this.CONTAINER.remove();
  });

  it('should show reviwer component', function() {
    const TAG = this.reviewerComponent.localName;
    const ELEMENT = document.querySelector(TAG);

    expect(ELEMENT).toEqual(this.reviewerComponent);
  });

  it('should show review component', function() {
    const TAG = this.reviewComponent.localName;
    const ELEMENT = document.querySelector(TAG);

    expect(ELEMENT).toEqual(this.reviewComponent);
  });

  it('should show empty message on review component', function() {
    const EMPTY = '';
    const component = this.reviewComponent;
    const textarea = component.shadowRoot.querySelector('textarea');

    expect(textarea.value).toEqual(EMPTY);
  });

  it('should not send review if review message empty', function(done) {
    const button = this.reviewComponent.sendButton;
    const sessions = this.reviewerComponent.list.get();

    button.addEventListener('click', (event) => {
      expect(sessions).toHaveSize(this.COUNT);

      done();
    });
    button.dispatchEvent(new Event('click'));
  });

  it('should after send review user and message data in review component same in reviewer component', function(done) {
    const sessions = this.reviewerComponent.list.get();
    const button = this.reviewComponent.sendButton;
    const reviewBox = this.reviewComponent.textArea;
    const username = this.reviewComponent.name;
    const NAME = 'd';
    const REVIEW = 'ddd';

    expect(sessions).toHaveSize(this.COUNT);

    username.textContent = NAME;
    reviewBox.value = REVIEW;

    button.dispatchEvent(new Event('click'));

    this.reviewerComponent.addEventListener('listchange', (event) => {
      const sessions = event.sessions;
      const FOUR = this.COUNT +1;
      const lastSession = sessions[3];

      expect(sessions).toHaveSize(FOUR);
      expect(lastSession.querySelector('h1').textContent).toEqual(NAME);
      expect(lastSession.querySelector('p').textContent).toEqual(REVIEW);

      done();
    });
  });
});
