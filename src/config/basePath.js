/**
 * The base path this app is served from.
 * Must match the `base` in vite.config.js and the `basename` in BrowserRouter.
 * For local dev this resolves to '' (empty), so routes still work at http://localhost:5173/
 */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Navigate to an app-internal route by prepending the base path.
 * Use this instead of bare `window.location.href = '/route'`.
 *
 * @param {string} path - App-relative path, e.g. '/login', '/dashboard'
 */
export const navigateTo = (path, replace = false) => {
  const targetUrl = BASE_PATH + path;
  if (replace) {
    window.location.replace(targetUrl);
  } else {
    window.location.href = targetUrl;
  }
};

/**
 * Check whether the current page pathname corresponds to an app route.
 * Strips the base path prefix before comparing.
 *
 * @param {string} path - App-relative path, e.g. '/login'
 * @returns {boolean}
 */
export const isOnPath = (path) => {
  const appPath = window.location.pathname.replace(BASE_PATH, '') || '/';
  return appPath === path;
};
