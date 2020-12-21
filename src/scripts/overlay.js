export class Overlay {
  static isActive = false;
  static instance = document.querySelector('.overlay');
  static active() {
    Overlay.instance.classList.add('active');
    Overlay.isActive = true;
  }
  static deactive() {
    Overlay.instance.classList.remove('active');
    Overlay.isActive = false;
  }
  static onClick(handler) {
    Overlay.instance.addEventListener('click', (event) => {
      handler(Overlay);
    });
  }
}
