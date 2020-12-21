export class ButtonSkip {
  static button = document.querySelector('.btn-skip');
  static content = document.querySelector('main');
  static init() {
    this.button.addEventListener('click', () => {
      window.scrollTo({
        left: 0,
        top: this.content.offsetTop,
        behavior: 'smooth',
      });
      setTimeout(() => {
        window.location.assign('#content');
      }, 50);
    });
  }
}
