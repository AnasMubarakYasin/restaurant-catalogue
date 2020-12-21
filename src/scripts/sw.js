import 'regenerator-runtime';

import {setCacheNameDetails} from 'workbox-core';
import {precacheAndRoute, matchPrecache} from 'workbox-precaching';
import {setCatchHandler, registerRoute} from 'workbox-routing';
import {ExpirationPlugin} from 'workbox-expiration';
import {StaleWhileRevalidate} from 'workbox-strategies';
import {Router} from '../../lib/router';

const log = console.log;
const error = console.error;

setCacheNameDetails({
  prefix: 'res',
  suffix: 'v1',
  precache: 'shell',
  runtime: 'extra',
});

const MANIFEST = self.__WB_MANIFEST;
const MAIN_DOCUMENT = 'index.html';

precacheAndRoute(MANIFEST);

setCatchHandler(async ({event}) => {
  error('[SW] error');

  if (event.request.destination === 'document') {
    if (Router.extname(request.url) === '') {
      return matchPrecache(MAIN_DOCUMENT);
    }
  }

  return Response.error();
});

registerRoute(
    ({event, request}) => {
      log('[SW] route', request.url);

      if (request.destination === 'document') {
        if (Router.extname(request.url) === '') {
          event.respondWith(matchPrecache(MAIN_DOCUMENT));

          return true;
        }
      }
      return false;
    },
);

const mainAssets = /document|script|serviceworker|font|style|video|audio/;
const appOrigin = location.origin;

registerRoute(
    ({request}) => {
      return mainAssets.test(request.destination) &&
          request.origin === appOrigin;
    },
    new StaleWhileRevalidate({
      cacheName: 'main',
    }),
);

const apiOrigin = 'https://dicoding-restaurant-api.el.r.appspot.com';

registerRoute(
    ({url}) => url.origin === apiOrigin,
    new StaleWhileRevalidate({
      cacheName: 'api',
      plugin: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 363,
        }),
      ],
    }),
);
