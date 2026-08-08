import { BASE_PATH } from "./basePath";

/**
 * Scoped LocalStorage Utility
 * Dynamically prefixes localStorage keys based on current URL path and BASE_PATH.
 * Prevents key collision on shared origin (https://beam.safesiteworks.com).
 */

const getPrefix = (defaultPrefix = "m3north_") => {
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

export const initScopedStorage = (defaultPrefix = "m3north_") => {
  if (typeof window === "undefined" || window.__SCOPED_STORAGE_INITIALIZED__) return;
  window.__SCOPED_STORAGE_INITIALIZED__ = true;

  const rawGet = localStorage.getItem.bind(localStorage);
  const rawSet = localStorage.setItem.bind(localStorage);
  const rawRemove = localStorage.removeItem.bind(localStorage);

  localStorage.getItem = function (key) {
    if (!key) return null;
    const prefix = getPrefix(defaultPrefix);
    const prefixedKey = prefix + key;
    const val = rawGet(prefixedKey);
    if (val !== null) return val;
    return rawGet(key);
  };

  localStorage.setItem = function (key, value) {
    if (!key) return;
    const prefix = getPrefix(defaultPrefix);
    const prefixedKey = prefix + key;
    rawSet(prefixedKey, value);
  };

  localStorage.removeItem = function (key) {
    if (!key) return;
    const prefix = getPrefix(defaultPrefix);
    const prefixedKey = prefix + key;
    rawRemove(prefixedKey);
    rawRemove(key);
  };

  localStorage.clear = function () {
    const prefix = getPrefix(defaultPrefix);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(prefix) || k === "token" || k === "user" || k === "UserType" || k === "tempUser" || k === "secretkey")) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => rawRemove(k));
  };
};

initScopedStorage("m3north_");
