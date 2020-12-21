/* eslint-disable max-len */
import {Page, PageManager} from '../../../lib/page';
import {jumbotron} from '../../scripts/jumbotron';
import {emptyComponent} from './template';
import imgURL from '../../public/images/svg/bg-8.svg';

export class ErrorPage extends Page {
  create() {
    jumbotron.changeView(jumbotron.Class.VIEW_MODE.SMALL);

    const element = emptyComponent({
      title: 'Upps, something wrong',
      subtitle: 'The Page not found',
      imgURL,
      display: true,
      onButtonPressed: () => {
        PageManager.back();
      },
    });

    this.setContent(element);
  }
  destroy() {
    jumbotron.changeView(jumbotron.Class.VIEW_MODE.DEFAULT);
  }
}

