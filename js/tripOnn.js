document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [
    ...parent.querySelectorAll(selector),
  ];

  /* =========================================================
     WISHLIST HELPERS.
     ========================================================= */
  const slugify = (str) =>
    String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const withStableIds = (list) =>
    list.map((item, index) => ({
      ...item,
      id: item.id || `${slugify(item.name)}-${index}`,
    }));

  // Builds the little heart button used on every card.
  const wishlistHeartHtml = (item) => {
    const active = window.TripOnnWishlist?.isWishlisted(item.id);
    return `
      <button
        class="wishlist-heart${active ? " active" : ""}"
        type="button"
        data-id="${item.id}"
        data-name="${item.name}"
        data-img="${item.img}"
        data-price="${item.price || ""}"
        aria-label="${active ? "Remove from wishlist" : "Add to wishlist"}"
      >
        <i class="fa-${active ? "solid" : "regular"} fa-heart"></i>
      </button>`;
  };



  // Renders the navbar dropdown panel from whatever is currently saved.
  const renderWishlistPanel = () => {
    const items = window.TripOnnWishlist?.getAll() || [];
    const itemsList = $("#wishlistItemsList");
    const emptyMsg = $("#wishlistEmptyMsg");
    const countBadge = $("#wishlistCount");

    if (countBadge) {
      countBadge.textContent = String(items.length);
      countBadge.classList.toggle("hidden", items.length === 0);
    }

    emptyMsg?.classList.toggle("hidden", items.length > 0);

    if (itemsList) {
      itemsList.innerHTML = items
        .map(
          (item) => `
        <div class="wishlist-item">
          <img src="${item.img}" alt="${item.name}" />
          <div class="wishlist-item-info">
            <h4>${item.name}</h4>
            ${item.price ? `<p>${item.price}</p>` : ""}
          </div>
          <button type="button" class="wishlist-item-remove" data-id="${item.id}" aria-label="Remove from wishlist">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>`,
        )
        .join("");
    }
  };

  // Any heart with this id (a card can appear more than once, e.g.
  // as both a "trip" and a "destination") gets updated together.
  const syncHeartsForId = (id, active) => {
    $$(`.wishlist-heart[data-id="${CSS.escape(id)}"]`).forEach((btn) => {
      btn.classList.toggle("active", active);
      const icon = btn.querySelector("i");
      if (icon) icon.className = `fa-${active ? "solid" : "regular"} fa-heart`;
    });
  };

  // One delegated listener handles every heart button on the page,
  // even ones that get re-rendered later (filters, carousel clones).
  document.addEventListener("click", (event) => {
    const heartBtn = event.target.closest(".wishlist-heart");
    if (!heartBtn) return;
    event.preventDefault();
    event.stopPropagation();

    const item = {
      id: heartBtn.dataset.id,
      name: heartBtn.dataset.name,
      img: heartBtn.dataset.img,
      price: heartBtn.dataset.price || "",
    };

    const nowActive = window.TripOnnWishlist.toggle(item);
    syncHeartsForId(item.id, nowActive);
    renderWishlistPanel();
  });

  /* =========================================================
     NAVBAR WISHLIST BUTTON + DROPDOWN PANEL
     ========================================================= */
  const setupWishlistPanel = () => {
    const wishlistBtn = $("#navWishlistBtn");
    const panel = $("#wishlistPanel");
    const closeBtn = $("#closeWishlistPanel");
    const itemsList = $("#wishlistItemsList");

    if (!wishlistBtn || !panel) return;

    wishlistBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) renderWishlistPanel();
    });

    closeBtn?.addEventListener("click", () => panel.classList.add("hidden"));

    // Click outside the panel closes it.
    document.addEventListener("click", (event) => {
      if (
        !panel.classList.contains("hidden") &&
        !panel.contains(event.target) &&
        !wishlistBtn.contains(event.target)
      ) {
        panel.classList.add("hidden");
      }
    });

    // Remove item directly from the dropdown.
    itemsList?.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(".wishlist-item-remove");
      if (!removeBtn) return;
      const id = removeBtn.dataset.id;
      window.TripOnnWishlist.remove(id);
      syncHeartsForId(id, false);
      renderWishlistPanel();
    });

    renderWishlistPanel();
  };

  /* =========================================================
     LOAD ALL TRAVEL DATA FROM destinations.json
     ========================================================= */
  const loadTravelData = async () => {
    try {
      const response = await fetch("./data/destinations.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Could not load destinations.json:", error);
      return { packages: [], destinations: [], trips: [] };
    }
  };

  /* =========================================================
     SCROLL PROGRESS BAR + HEADER "SCROLLED" STATE
     ========================================================= */
  const progressBar = $("#progress-bar");
  const header = $("header");

  const updateOnScroll = () => {
    const scrollTop = window.scrollY;
    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress =
      scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (header) {
      header.classList.toggle("scrolled", scrollTop > 40);
    }
  };

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateOnScroll();
      ticking = false;
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  updateOnScroll();

  /* =========================================================
     SCROLL REVEAL ANIMATION
     ========================================================= */
  const revealElements = $$(".reveal-ready");

  if ("IntersectionObserver" in window && revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("revealed"));
  }

  /* =========================================================
     MOBILE NAVIGATION (hamburger panel)
     ========================================================= */
  const navToggle = $("#navToggle");
  const mobileNav = $("#mobileNav");
  const navScrim = $("#navScrim");

  if (navToggle && mobileNav) {
    const openNav = () => {
      mobileNav.classList.add("open");
      navScrim?.classList.add("visible");
      document.body.classList.add("nav-open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.querySelector("i")?.classList.replace("fa-bars", "fa-xmark");
    };

    const closeNav = () => {
      mobileNav.classList.remove("open");
      navScrim?.classList.remove("visible");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.querySelector("i")?.classList.replace("fa-xmark", "fa-bars");
    };

    navToggle.addEventListener("click", () => {
      mobileNav.classList.contains("open") ? closeNav() : openNav();
    });

    navScrim?.addEventListener("click", closeNav);
    $$("a", mobileNav).forEach((link) =>
      link.addEventListener("click", closeNav),
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileNav.classList.contains("open"))
        closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 850 && mobileNav.classList.contains("open"))
        closeNav();
    });
  }

  /* =========================================================
     LOGIN MODAL
     ========================================================= */
  const loginBtn = $("#btn2");
  const loginOverlay = $(".login-overlay");
  const closeBtn = $(".close-login");

  if (loginBtn && loginOverlay) {
    const openLogin = () => {
      loginOverlay.classList.remove("hidden");
      document.body.classList.add("modal-open");
      const firstInput = $(".form-details input", loginOverlay);
      if (firstInput) setTimeout(() => firstInput.focus(), 50);
    };

    const closeLogin = () => {
      loginOverlay.classList.add("hidden");
      document.body.classList.remove("modal-open");
    };

    loginBtn.addEventListener("click", openLogin);
    closeBtn?.addEventListener("click", closeLogin);

    loginOverlay.addEventListener("click", (event) => {
      if (event.target === loginOverlay) closeLogin();
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        !loginOverlay.classList.contains("hidden")
      ) {
        closeLogin();
      }
    });
  }

  /* =========================================================
     LOGIN / SIGN UP SWITCH
     ========================================================= */
  const signupTab = $("#button1-login");
  const loginTab = $("#button2-login");
  const accountButton = $(".creatAc-button button");
  const accountText = $(".exist-login");
  const loginHeading = $("#login-p3");
  const loginSubheading = $("#login-p4");
  const passwordInput = $('input[type="password"]');
  const userInput = $('input[autocomplete="username"]');

  const setAuthMode = (mode) => {
    const isLogin = mode === "login";
    $$(".inputbox-login").forEach((box) => box.classList.remove("input-error"));
    $$(".field-error").forEach((p) => (p.textContent = ""));

    if (loginHeading) {
      loginHeading.textContent = isLogin
        ? "Welcome Back !"
        : "Begin Your Adventure";
    }
    if (loginSubheading) {
      loginSubheading.textContent = isLogin
        ? "Login to continue your journey"
        : "Sign up to start your journey";
    }
    if (userInput) {
      userInput.placeholder = isLogin
        ? "Enter your username"
        : "Create a username";
    }
    if (passwordInput) {
      passwordInput.placeholder = isLogin
        ? "Enter your password"
        : "Create a password";
    }

    if (accountButton) {
      accountButton.textContent = isLogin ? "Login" : "Create Account";
    }

    signupTab?.classList.toggle("active", !isLogin);
    loginTab?.classList.toggle("active", isLogin);
  };

  setAuthMode("signup");

  signupTab?.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode("signup");
  });
  loginTab?.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode("login");
  });

  accountText?.addEventListener("click", (event) => {
    const link = event.target.closest("[data-auth-mode]");
    if (!link) return;
    event.preventDefault();
    setAuthMode(link.dataset.authMode);
  });


  /* =========================================================
     SEARCH-BAR VALIDATION
     ========================================================= */
  const searchTab = $(".hero-search-bar input");
  const searchBtn = $(".hero-search-btn");
  if (searchTab && searchBtn) {
    searchBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const heroTab = searchTab.value.trim();
      const searchPattern = /^[a-zA-Z0-9][a-zA-Z0-9\s,.'-]*$/;
      searchTab.closest(".hero-search-bar").classList.remove("input-error");
      if (!searchPattern.test(heroTab)) {
        searchTab.closest(".hero-search-bar").classList.add("input-error");
        searchTab.focus();
        return;
      }
    });
  }

  /* =========================================================
     LOGIN FORM VALIDATION
     ========================================================= */
  const form = $(".form-details");

  if (form) {
    const inputs = $$("input", form);

    inputs.forEach((input) => {
      input.addEventListener("input", () =>
        input.closest(".inputbox-login")?.classList.remove("input-error"),
      );
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          accountButton?.click();
        }
      });
    });

    accountButton?.addEventListener("click", (event) => {
      event.preventDefault();
      let valid = true;

      inputs.forEach((input) => {
        const value = input.value.trim();
        const passwordPattern = /^[a-zA-Z0-9@#$%*&!<>]+$/.test(value);
        const isPassword = input.type === "password";
        const errorMessage =
          value.length === 0
            ? isPassword
              ? "Password is required"
              : "Username is required"
            : isPassword && value.length < 6
              ? "Password must be at least 6 characters"
              : isPassword && !passwordPattern
                ? "Password can only contain letters, numbers, and @#$%*&!<>"
                : "";
        const invalid = errorMessage !== "";
        input
          .closest(".inputbox-login")
          ?.classList.toggle("input-error", invalid);
        const errorEl = input.closest(".inputbox-login")?.nextElementSibling;
        if (errorEl) errorEl.textContent = errorMessage;

        if (invalid) valid = false;
      });
      if (!valid) {
        const firstError = inputs.find((input) =>
          input.closest(".inputbox-login")?.classList.contains("input-error"),
        );
        firstError?.focus();
        return;
      }

      console.info("Authentication form passed validation.");
    });
  }

  /* =========================================================
     OFFER EMAIL VALIDATION
     ========================================================= */
  const emailInput = $("#email-bar input ");
  const subscribeButton = $("#email-bar button");

  if (emailInput && subscribeButton) {
    subscribeButton.addEventListener("click", (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      emailInput.closest("#email-bar").classList.remove("input-error");

      if (!emailPattern.test(email)) {
        emailInput.closest("#email-bar").classList.add("input-error");
        emailInput.focus();
        return;
      }

      subscribeButton.textContent = "Subscribed";
      subscribeButton.disabled = true;

      setTimeout(() => {
        subscribeButton.textContent = "Subscribe";
        subscribeButton.disabled = false;
        emailInput.value = "";
      }, 2000);
    });
  }

  /* =========================================================
     COUNTDOWN TIMER (offer clock)
     ========================================================= */
  const cdDays = $("#cd-d");
  const cdHours = $("#cd-h");
  const cdMins = $("#cd-m");
  const cdSecs = $("#cd-s");

  if (cdDays && cdHours && cdMins && cdSecs) {
    let target =
      Date.now() + (2 * 24 + 14) * 60 * 60 * 1000 + 45 * 60 * 1000 + 30 * 1000;

    const tick = () => {
      if (target <= Date.now()) {
        target =
          Date.now() +
          (2 * 24 + 14) * 60 * 60 * 1000 +
          45 * 60 * 1000 +
          30 * 1000;
      }
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      cdDays.textContent = String(d).padStart(2, "0");
      cdHours.textContent = String(h).padStart(2, "0");
      cdMins.textContent = String(m).padStart(2, "0");
      cdSecs.textContent = String(s).padStart(2, "0");
    };

    tick();
    setInterval(tick, 1000);
  }

  /* =========================================================
     INFINITE PACKAGES CAROUSEL
     ========================================================= */
  const setupPackagesCarousel = (packages) => {
    const packagesTrack = $("#packagesTrack");
    const packagesNext = $("#packagesNext");
    const packagesPrev = $("#packagesPrev");

    if (!packagesTrack || !packagesNext || !packagesPrev || !packages.length)
      return;

    // 1) Build the real cards straight from data.
    packagesTrack.innerHTML = packages
      .map(
        (pkg) => `
      <div class="package-card">
        ${wishlistHeartHtml(pkg)}
        <img src="${pkg.img}" alt="${pkg.alt || pkg.name}" />
        <div class="package-card-content">
          <span class="package-tag">${pkg.tag}</span>
          <h3>${pkg.name}</h3>
          <p>Starting from <span class="price">${pkg.price}</span></p>
        </div>
      </div>`,
      )
      .join("");

    const originalCards = $$(".package-card", packagesTrack);
    if (originalCards.length <= 1) return;

    const totalPackages = originalCards.length;

    /*
     * Clone all cards on both sides.
     *
     * Original:
     * [Bali] [Maldives] [Italy] [Korea]
     *
     * Becomes:
     * [Bali] [Maldives] [Italy] [Korea]
     * [Bali] [Maldives] [Italy] [Korea]
     * [Bali] [Maldives] [Italy] [Korea]
     *
     * We start from the middle set.
     */

    const firstClones = originalCards.map((card) => card.cloneNode(true));
    const lastClones = originalCards.map((card) => card.cloneNode(true));

    /* Add last clones before original cards */
    lastClones.reverse().forEach((card) => {
      packagesTrack.insertBefore(card, packagesTrack.firstChild);
    });

    /* Add first clones after original cards */
    firstClones.forEach((card) => {
      packagesTrack.appendChild(card);
    });

    const allPackageCards = $$(".package-card", packagesTrack);

    /* Start from the original first card. */
    let packageIndex = totalPackages;

    let packageMoving = false;
    let packageTimer = null;

    /* ---------------------------------------------------------
     CARD STEP
     --------------------------------------------------------- */
    const getPackageStep = () => {
      const card = allPackageCards[0];
      if (!card) return 0;
      const cardWidth = card.getBoundingClientRect().width;
      const trackStyle = window.getComputedStyle(packagesTrack);
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;
      return cardWidth + gap;
    };

    /* ---------------------------------------------------------
     MOVE TRACK
     --------------------------------------------------------- */
    const movePackages = (animate = true) => {
      const step = getPackageStep();
      if (!step) return;

      packagesTrack.style.transition = animate
        ? "transform .75s cubic-bezier(.22,.61,.36,1)"
        : "none";

      packagesTrack.style.transform = `translate3d(-${packageIndex * step}px,0,0)`;
    };

    /* ---------------------------------------------------------
     INFINITE LOOP FIX
     --------------------------------------------------------- */
    packagesTrack.addEventListener("transitionend", () => {
      /* We moved into the first cloned set. Silently jump back. */
      if (packageIndex >= totalPackages * 2) {
        packageIndex = totalPackages;
        movePackages(false);
      } else if (packageIndex < totalPackages) {
        /* We moved into the last cloned set. Silently jump forward. */
        packageIndex = totalPackages * 2 - 1;
        movePackages(false);
      }

      packageMoving = false;
    });

    /* ---------------------------------------------------------
     NEXT / PREVIOUS
     --------------------------------------------------------- */
    const nextPackage = () => {
      if (packageMoving) return;
      packageMoving = true;
      packageIndex++;
      movePackages(true);
      restartPackageAutoScroll();
    };

    const previousPackage = () => {
      if (packageMoving) return;
      packageMoving = true;
      packageIndex--;
      movePackages(true);
      restartPackageAutoScroll();
    };

    packagesNext.addEventListener("click", nextPackage);
    packagesPrev.addEventListener("click", previousPackage);

    /* ---------------------------------------------------------
     AUTO SCROLL
     --------------------------------------------------------- */
    const startPackageAutoScroll = () => {
      clearInterval(packageTimer);
      packageTimer = setInterval(() => {
        nextPackage();
      }, 1000);
    };

    const restartPackageAutoScroll = () => {
      clearInterval(packageTimer);
      packageTimer = setTimeout(() => {
        startPackageAutoScroll();
      }, 1000);
    };

    window.addEventListener("resize", () => {
      movePackages(false);
    });

    /* INITIAL POSITION */
    movePackages(false);
    startPackageAutoScroll();
  };

  /* =========================================================
     DESTINATIONS DEPTH CAROUSEL
     ========================================================= */
  const setupDestinationsCarousel = (destinations) => {
    const destStack = $("#destStack");
    if (!destStack || !destinations.length) return;

    // Build the cards from data.
    destStack.innerHTML = destinations
      .map(
        (dest) => `
      <div class="dest-card">
        ${wishlistHeartHtml(dest)}
        <img src="${dest.img}" alt="${dest.name}" />
        <div class="dest-info">
          <h4>${dest.name}</h4>
          <p>From ${dest.price}</p>
        </div>
      </div>`,
      )
      .join("");

    const destCards = $$(".dest-card", destStack);
    if (!destCards.length) return;

    let activeDest = 0;
    let carouselLocked = false;

    /* Create navigation buttons automatically. */
    const prevButton = document.createElement("button");
    prevButton.className = "dest-carousel-btn prev";
    prevButton.type = "button";
    prevButton.setAttribute("aria-label", "Previous destination");
    prevButton.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

    const nextButton = document.createElement("button");
    nextButton.className = "dest-carousel-btn next";
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Next destination");
    nextButton.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

    destStack.appendChild(prevButton);
    destStack.appendChild(nextButton);

    /* ---------------------------------------------------------
     UPDATE CAROUSEL
     --------------------------------------------------------- */
    const updateDestCarousel = (animate = true) => {
      const width = window.innerWidth;

      let spacing;
      let sideScale;
      let blurAmount;

      if (width <= 600) {
        spacing = 125;
        sideScale = 0.78;
        blurAmount = 3;
      } else if (width <= 900) {
        spacing = 170;
        sideScale = 0.8;
        blurAmount = 3.5;
      } else {
        spacing = 205;
        sideScale = 0.82;
        blurAmount = 4;
      }

      destCards.forEach((card, i) => {
        /* Circular difference so first card doesn't start pushed right. */
        let diff = i - activeDest;
        const total = destCards.length;

        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        /* Only show: 2 cards left, center card, 2 cards right */
        const absDiff = Math.abs(diff);

        if (absDiff > 2) {
          card.style.transform = "translate(-50%, -50%) scale(.58)";
          card.style.filter = `blur(${blurAmount + 2}px)`;
          card.style.opacity = "0";
          card.style.pointerEvents = "none";
          card.style.zIndex = "1";
          return;
        }

        if (diff === 0) {
          /* CENTER */
          card.style.transform = "translate(-50%, -50%) scale(1)";
          card.style.filter = "blur(0px)";
          card.style.opacity = "1";
          card.style.zIndex = "20";
          card.style.pointerEvents = "auto";
          card.classList.add("is-active");
        } else {
          /* LEFT / RIGHT SIDE */
          const scale = absDiff === 1 ? sideScale : sideScale - 0.08;
          const blur = absDiff === 1 ? blurAmount : blurAmount + 2;
          const opacity = absDiff === 1 ? 0.72 : 0.42;

          card.style.transform = `translate(calc(-50% + ${diff * spacing}px), -50%) scale(${scale})`;
          card.style.filter = `blur(${blur}px)`;
          card.style.opacity = opacity;
          card.style.zIndex = 20 - absDiff;
          card.style.pointerEvents = absDiff === 1 ? "auto" : "none";
          card.classList.remove("is-active");
        }
      });
    };

    /* ---------------------------------------------------------
     MOVE NEXT / PREVIOUS
     --------------------------------------------------------- */
    const goNext = () => {
      if (carouselLocked) return;
      carouselLocked = true;
      destStack.classList.add("is-moving");

      activeDest = (activeDest + 1) % destCards.length;
      updateDestCarousel(true);

      setTimeout(() => {
        carouselLocked = false;
        destStack.classList.remove("is-moving");
      }, 680);
    };

    const goPrevious = () => {
      if (carouselLocked) return;
      carouselLocked = true;
      destStack.classList.add("is-moving");

      activeDest = (activeDest - 1 + destCards.length) % destCards.length;
      updateDestCarousel(true);

      setTimeout(() => {
        carouselLocked = false;
        destStack.classList.remove("is-moving");
      }, 680);
    };

    prevButton.addEventListener("click", (event) => {
      event.stopPropagation();
      goPrevious();
    });

    nextButton.addEventListener("click", (event) => {
      event.stopPropagation();
      goNext();
    });

    /* CARD CLICK */
    destCards.forEach((card, index) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest(".wishlist-heart")) return;
        event.stopPropagation();
        if (carouselLocked) return;

        // Middle card -> details page
        if (index === activeDest) {
          const name = destinations[index].name;
          window.location.href = `details.html?type=destinations&name=${encodeURIComponent(name)}`;
          return;
        }

        // left -Right card -> carousel move
        const total = destCards.length;
        let diff = index - activeDest;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        diff > 0 ? goNext() : goPrevious();
      });
    });

    /* KEYBOARD SUPPORT */
    document.addEventListener("keydown", (event) => {
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
    });

    window.addEventListener("resize", () => {
      updateDestCarousel(false);
    });

    /* INITIAL STATE */
    updateDestCarousel(false);
  };

  /* =========================================================
     EXPLORE BY INTEREST -> TRIPS (filter + slider / full grid)
     ========================================================= */
  const setupTrips = (trips) => {
    const tripsSection = $("#tripsSection");
    const tripsGrid = $("#tripsGrid");
    const tripsMore = $("#tripsMore");
    const tripsPrev = $("#tripsPrev");
    const tripsNext = $("#tripsNext");
    const interestButtons = $$(".trip-items[data-filter]");

    if (!tripsSection || !tripsGrid) return;

    let activeFilter = "all";
    const moreBaseHref = tripsMore?.getAttribute("href") || "adventures.html";
    const tripCard = (trip) => `
  <article class="trip-card">
    ${wishlistHeartHtml(trip)}
    <div class="trip-thumb">
      <img src="${trip.img}" alt="${trip.name}" loading="lazy" />
    </div>
    <div class="trip-details">
      <h3>${trip.name}</h3>
      ${trip.price ? `<p class="trip-price">${trip.price}</p>` : ""}
      ${
        trip.rating
          ? `<p class="trip-rating">
               <i class="fa-solid fa-star"></i>
               <b>${trip.rating}</b>
               ${trip.reviews ? `<span>(${trip.reviews})</span>` : ""}
             </p>`
          : ""
      }
    </div>
  </article>`;
    // arrows show/hide
    const updateArrows = () => {
      const overflows = tripsGrid.scrollWidth > tripsGrid.clientWidth + 2;
      tripsSection.classList.toggle("no-overflow", !overflows);
    };

    // "Explore more" link: 
    const updateMoreLink = () => {
      if (!tripsMore) return;
      tripsMore.setAttribute(
        "href",
        activeFilter === "all"
          ? moreBaseHref
          : `${moreBaseHref}?interest=${activeFilter}`,
      );
    };

    const renderTrips = () => {
      const list = trips.filter(
        (trip) => activeFilter === "all" || trip.tags.includes(activeFilter),
      );
      tripsGrid.innerHTML = list.map(tripCard).join("");
      tripsGrid.scrollLeft = 0;
      tripsSection.classList.toggle("is-empty", list.length === 0);
      updateArrows();
      updateMoreLink();
    };

    /* INTEREST pills */
    interestButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        if (filter === activeFilter) return;
        activeFilter = filter;

        interestButtons.forEach((b) => {
          const isActive = b === button;
          b.classList.toggle("active", isActive);
          b.setAttribute("aria-pressed", String(isActive));
        });

        renderTrips();
      });
    });

    /* SLIDER arrows */
    const slide = (direction) =>
      tripsGrid.scrollBy({
        left: direction * tripsGrid.clientWidth * 0.8,
        behavior: "smooth",
      });
    tripsPrev?.addEventListener("click", () => slide(-1));
    tripsNext?.addEventListener("click", () => slide(1));

    window.addEventListener("resize", updateArrows, { passive: true });

    renderTrips(); // default: All
  };

  /* =========================================================
     DISABLE EMPTY HASH LINKS (but not auth-mode links)
     ========================================================= */
  $$('a[href="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.hasAttribute("data-auth-mode")) return;
      event.preventDefault();
    });
  });

  /* =========================================================
     REDUCED MOTION
     ========================================================= */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduce-motion");
  }

  /* Trip / package card click -> details page */
  document.addEventListener("click", (event) => {
    if (event.target.closest(".wishlist-heart")) return; // heart par click detail page na khole
    const card = event.target.closest(".trip-card, .package-card");
    if (!card) return;
    const name = card.querySelector("h3")?.textContent.trim();
    if (!name) return;
    const type = card.classList.contains("package-card") ? "packages" : "trips";
    window.location.href = `details.html?type=${type}&name=${encodeURIComponent(name)}`;
  });

  /* =========================================================
     BOOTSTRAP: fetch destinations.json once, then build every
     data-driven section (packages, destinations, trips).
     ========================================================= */
  setupWishlistPanel();

  loadTravelData().then((data) => {
    setupPackagesCarousel(withStableIds(data.packages || []));
    setupDestinationsCarousel(withStableIds(data.destinations || []));
    setupTrips(withStableIds(data.trips || []));
  });
});
