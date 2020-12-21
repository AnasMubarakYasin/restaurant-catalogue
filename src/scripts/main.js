import 'regenerator-runtime';

import {PageManager} from '../../lib/page';
import {dbconfig} from '../../lib/db';

import {sideNav} from './sidenav';
import {topNav} from './topnav';
import {jumbotron} from './jumbotron';
import {ButtonSkip} from './btn-skip';
import {registerService} from './service-register';
import {CONSTANT} from '../resource/constant';

import '../components/menu/view';
import '../components/reviewer/view';
import '../components/review/view';

topNav.onClick(() => sideNav.show());
jumbotron.onViewChange((mode) => topNav.changeView(mode));

ButtonSkip.init();

dbconfig.logged = false;

PageManager.logged = false;
PageManager.
    register('home', '', CONSTANT.PAGE.HOME.PATH).
    register('detail', CONSTANT.PAGE.DETAIL_RESTAURANT.PATH).
    register('favorite', CONSTANT.PAGE.FAVORITE.PATH).
    register('about', CONSTANT.PAGE.ABOUT.PATH).
    register('error', PageManager.ACTION_PAGE.NOT_FOUND).
    setLoaderPage((name) => {
      return import(/* webpackPreload: true */
          `../page/${name}`);
    }).
    start(location.pathname);

window.addEventListener('load', (event) => {
  registerService(CONSTANT.WEBAPP.SERVICE_PATH);
});

