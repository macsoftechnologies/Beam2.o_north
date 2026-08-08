import { BASE_PATH } from "./basePath";

/**
 * Scoped LocalStorage Utility
 * Transparently prefixes localStorage keys for this division/portal.
 * Solves multi-app localStorage collisions on shared origin (https://beam.safesiteworks.com).
 *
 * @param {string} defaultPrefix - Default prefix for this app (e.g. "m3south_", "m3north_", "m3infra_")
 */
export const initScopedStorage = (defaultPrefix = "m3north_") => {
  if (typeof window === "undefined" || window.__SCOPED_STORAGE_INITIALIZED__) return;
  window.__SCOPED_STORAGE_INITIALIZED__ = true;

  const getPrefix = () => {
    try {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.includes("/m3north")) return "m3north_";
      if (pathname.includes("/m3infrastructure")) return "m3infra_";
      if (pathname.includes("/m3south")) return "m3south_";
    } catch (e) {
      // ignore
    }
    if (BASE_PATH && BASE_PATH !== "" && BASE_PATH !== "/") {
      return BASE_PATH.replace(/^\//, "").replace(/\/$/, "") + "_";
    }
    return defaultPrefix;
  };

  const PREFIX = getPrefix();

  const rawGet = localStorage.getItem.bind(localStorage);
  const rawSet = localStorage.setItem.bind(localStorage);
  const rawRemove = localStorage.removeItem.bind(localStorage);

  localStorage.getItem = function (key) {
    if (!key) return null;
    const prefixedKey = PREFIX + key;
    const val = rawGet(prefixedKey);
    if (val !== null) return val;
    return rawGet(key);
  };

  localStorage.setItem = function (key, value) {
    if (!key) return;
    const prefixedKey = PREFIX + key;
    rawSet(prefixedKey, value);
  };

  localStorage.removeItem = function (key) {
    if (!key) return;
    const prefixedKey = PREFIX + key;
    rawRemove(prefixedKey);
    rawRemove(key);
  };

  localStorage.clear = function () {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(PREFIX) || k === "token" || k === "user" || k === "UserType" || k === "tempUser" || k === "secretkey")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => rawRemove(k));
  };
};

// Auto-initialize immediately when module is loaded
initScopedStorage("m3north_");
