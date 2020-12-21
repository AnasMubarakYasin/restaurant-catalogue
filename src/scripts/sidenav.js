import {PageManager} from '../../lib/page';
import {Overlay} from './overlay';

class SideNav {
  constructor() {
    this.aside = document.querySelector('aside');
    this.button = this.aside.querySelector('button');
    this.list = this.aside.querySelector('.link-list');
    this.linkMap = new Map();
    this.isShow = false;
    this.activeLink = null;
    this.button.addEventListener('click', (event) => {
      this.hide();
    });

    PageManager.onNavigation((path, data) => {
      this.active(new URL(path).pathname.slice(1));
    });

    for (const child of this.list.children) {
      this.linkMap.set(
          child.firstElementChild.dataset.route, child.firstElementChild,
      );

      child.firstElementChild.addEventListener('click', (event) => {
        const target = event.composedPath()
            .filter((node) => node?.dataset?.route)[0];
        const path = target.dataset.route;

        PageManager.navigate(path);

        event.preventDefault();
      });
      // eslint-disable-next-line max-len
      if (('/' + child.firstElementChild.dataset.route) === location.pathname ||
        location.pathname === '/' &&
        this.activeLink === null
      ) {
        child.classList.add('active');
        this.activeLink = child;
      }
    }
  }
  active(name = '') {
    if (this.linkMap.has(name) && this.activeLink) {
      const link = this.linkMap.get(name);

      this.activeLink.classList.remove('active');
      this.activeLink = link;
      this.activeLink.classList.add('active');
    } else {
      console.error('wrong link name: ', name);
    }
  }
  show() {
    this.isShow = true;
    this.aside.classList.add('active');

    Overlay.active();
    Overlay.onClick((overlay) => {
      this.hide();
    });
  }
  hide() {
    this.isShow = false;
    this.aside.classList.remove('active');
    Overlay.deactive();
  }
}

export const sideNav = new SideNav();
