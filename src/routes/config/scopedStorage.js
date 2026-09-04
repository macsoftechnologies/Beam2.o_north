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

  if (typeof Storage === "undefined" || !Storage.prototype) return;

  const rawGet = Storage.prototype.getItem;
  const rawSet = Storage.prototype.setItem;
  const rawRemove = Storage.prototype.removeItem;
  const rawClear = Storage.prototype.clear;

  // Cleanup stray keys previously created on Safari/WebKit due to direct localStorage assignment
  try {
    const strayKeys = [
      "getItem",
      "setItem",
      "removeItem",
      "clear",
      "token",
      "access_token",
      "user",
      "UserType",
      "tempUser",
      "secretkey",
      "isLoggedIn",
      "app-theme",
    ];
    strayKeys.forEach((key) => {
      rawRemove.call(window.localStorage, key);
    });
  } catch (e) {
    // ignore
  }

  Storage.prototype.getItem = function (key) {
    if (!key) return null;
    if (this === window.localStorage) {
      const prefix = getPrefix(defaultPrefix);
      const prefixedKey = key.startsWith(prefix) ? key : prefix + key;
      return rawGet.call(this, prefixedKey);
    }
    return rawGet.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    if (!key) return;
    if (this === window.localStorage) {
      const prefix = getPrefix(defaultPrefix);
      const prefixedKey = key.startsWith(prefix) ? key : prefix + key;
      rawSet.call(this, prefixedKey, value);
      return;
    }
    rawSet.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (!key) return;
    if (this === window.localStorage) {
      const prefix = getPrefix(defaultPrefix);
      const prefixedKey = key.startsWith(prefix) ? key : prefix + key;
      rawRemove.call(this, prefixedKey);
      if (!key.startsWith(prefix)) {
        rawRemove.call(this, key);
      }
      return;
    }
    rawRemove.call(this, key);
  };

  Storage.prototype.clear = function () {
    if (this === window.localStorage) {
      const prefix = getPrefix(defaultPrefix);
      const keysToRemove = [];
      for (let i = 0; i < this.length; i++) {
        const k = this.key(i);
        if (
          k &&
          (k.startsWith(prefix) ||
            k === "token" ||
            k === "user" ||
            k === "UserType" ||
            k === "tempUser" ||
            k === "secretkey" ||
            k === "access_token" ||
            k === "isLoggedIn" ||
            k === "app-theme" ||
            k === "getItem" ||
            k === "setItem" ||
            k === "removeItem" ||
            k === "clear")
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => rawRemove.call(this, k));
      return;
    }
    rawClear.call(this);
  };
};

initScopedStorage("m3north_");

