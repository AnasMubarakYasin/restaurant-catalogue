import {PageManager} from '../../lib/page';

class TopNav {
  static VIEW_MODE = {
    DEFAULT: 0,
    SMALL: 1,
  }
  static handlerList = [];

  constructor() {
    this.nav = document.querySelector('nav');
    this.button = this.nav.querySelector('button');
    this.list = this.nav.querySelector('ul');
    this.linkMap = new Map();
    this.activeLink = null;
    this.button.addEventListener('click', (event) => {
      TopNav.handlerList.forEach((handler) => handler(event));
    });

    PageManager.onNavigation((path, data) => {
      this.active(new URL(path).pathname.slice(1));
    });

    for (const child of this.list.children) {
      if (('/' + child.firstElementChild.dataset.route) === location.pathname ||
        location.pathname === '/' &&
        this.activeLink === null
      ) {
        child.classList.add('active');
        this.activeLink = child;
      }

      this.linkMap.set(child.firstElementChild.dataset.route, child);

      child.firstElementChild.addEventListener('click', (event) => {
        const path = event.target.dataset.route;

        PageManager.navigate(path);

        event.preventDefault();
      });
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
  changeView(modeView = TopNav.VIEW_MODE.DEFAULT) {
    if (modeView !== TopNav.VIEW_MODE.DEFAULT) {
      this.nav.classList.add('small');
    } else {
      this.nav.classList.remove('small');
    }
  }
  onClick(handler = (event) => {}) {
    TopNav.handlerList.push(handler);
  }
}

export const topNav = new TopNav();
