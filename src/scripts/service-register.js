export async function registerService(url = '') {
  if ('ServiceWorker' in window) {
    navigator.serviceWorker.addEventListener('controllerchange', (event) => {
      console.log('service worker controllerchange');
    });
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('service worker message');
    });
    navigator.serviceWorker.addEventListener('messageerror', (event) => {
      console.log('service worker messageerror');
    });

    navigator.serviceWorker.register(url,
        {type: 'classic', scope: '.', updateViaCache: 'all'},
    );
    navigator.serviceWorker.ready
        .then((registration) => {
          registration.addEventListener('updatefound', (event) => {
            console.log('service worker updatefound');
          });
        });

    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('window beforeinstallprompt');
    });
    window.addEventListener('appinstalled', (event) => {
      console.log('window appinstalled');
    });
  }
}
