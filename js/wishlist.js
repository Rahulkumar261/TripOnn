/* =========================================================
   TripOnn Wishlist: shared localStorage module.
   Load this file BEFORE tripOnn.js on every page that shows
   cards or the navbar heart (index.html, details.html, ...).
   It uses localStorage, so the wishlist stays in sync across pages.
   ========================================================= */
(function () {
  "use strict";

  const STORAGE_KEY = "tripOnnWishlist";

  const readAll = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const writeAll = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const isWishlisted = (id) => readAll().some((item) => item.id === id);

  const add = (item) => {
    const list = readAll();
    if (!list.some((i) => i.id === item.id)) {
      list.push(item);
      writeAll(list);
    }
  };

  const remove = (id) => {
    writeAll(readAll().filter((item) => item.id !== id));
  };

  // Returns true if the item is now wishlisted, false if it was removed.
  const toggle = (item) => {
    if (isWishlisted(item.id)) {
      remove(item.id);
      return false;
    }
    add(item);
    return true;
  };

  window.TripOnnWishlist = { getAll: readAll, isWishlisted, add, remove, toggle };
})();
