class Jumbotron {
  static VIEW_MODE = {
    DEFAULT: 0,
    SMALL: 1,
  }
  static handlerList = [];
  constructor() {
    this.header = document.querySelector('header');
    this.Class = Jumbotron;
  }
  changeView(modeView = Jumbotron.VIEW_MODE.DEFAULT) {
    if (modeView !== Jumbotron.VIEW_MODE.DEFAULT) {
      this.header.classList.add('small');
    } else {
      this.header.classList.remove('small');
    }
    Jumbotron.handlerList.forEach((handler) => handler(modeView));
  }
  onViewChange(handler = (mode = '') => {}) {
    Jumbotron.handlerList.push(handler);
  }
}

export const jumbotron = new Jumbotron();
