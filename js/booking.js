document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  console.log("[booking.js] loaded");

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  const hero = $(".hero");
  const h1 = $(".hero h1");
  const desc = $(".hero .description");

  const searchWrap = $(".hero-search");
  const home = $(".smooth-appear");
  const main = $("main");

  if (!hero || !searchWrap || !home) {
    console.warn("[booking.js] element nahi mila:", {
      hero,
      searchWrap,
      home,
    });
    return;
  }

  const orig = {
    h1: h1.innerHTML,
    desc: desc.innerHTML,
  };

  const heroImg = $(".hero-nav img");

  const HERO_IMGS = {
    packages: heroImg ? heroImg.getAttribute("src") : "",
    flights: "./src/flights-hero.jpg",
    hotels: "./src/hotels-hero.jpg",
  };

  const changeHero = (src) => {
    if (!heroImg || !src || heroImg.getAttribute("src") === src) return;

    heroImg.style.opacity = 0;

    setTimeout(() => {
      heroImg.onload = heroImg.onerror = () => {
        heroImg.style.opacity = 1;
      };

      heroImg.src = src;
    }, 250);
  };

  const inr = (n) => "₹" + n.toLocaleString("en-IN");

  let loadError = false;

  let FLIGHTS = [];
  let HOTELS = [];
  let ROUTES = [];
  let PLACES = [];

  const ready = fetch("./data/booking.json")
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((d) => {
      FLIGHTS = d.flights || [];
      HOTELS = d.hotels || [];
      ROUTES = d.routes || [];
      PLACES = d.places || [];

      console.log(
        `[booking.js] booking.json loaded: ${FLIGHTS.length} flights, ${HOTELS.length} hotels`
      );
    })
    .catch((err) => {
      loadError = true;
      console.error("[booking.js] Data didn't load:", err);
    });

  /* ---------- helpers ---------- */

  const heart = (id, name, img, price) => {
    const on = window.TripOnnWishlist?.isWishlisted(id);

    return `<button
      class="wishlist-heart${on ? " active" : ""}"
      type="button"
      data-id="${id}"
      data-name="${name}"
      data-img="${img}"
      data-price="${price}"
      aria-label="Wishlist">
      <i class="fa-${on ? "solid" : "regular"} fa-heart"></i>
    </button>`;
  };

  const field = (label, icon, input) =>
    `<label class="bk-f">
      <span>
        <i class="fa-solid ${icon}"></i> ${label}
      </span>
      ${input}
    </label>`;

  const check = (name, val, text) =>
    `<label class="bk-check">
      <input type="checkbox" name="${name}" value="${val}">
      ${text}
    </label>`;

  const dur = (m) =>
    `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;

  /* ---------- search forms ---------- */

  const forms = {
    flights: () => `
      ${field(
        "From",
        "fa-plane-departure",
        '<input id="bkFrom" value="Bhubaneswar (BBI)">'
      )}

      ${field(
        "To",
        "fa-plane-arrival",
        '<input id="bkTo" value="New Delhi (DEL)">'
      )}

      ${field(
        "Departure",
        "fa-calendar",
        '<input type="date" id="bkD1">'
      )}

      ${field(
        "Return",
        "fa-calendar",
        '<input type="date" id="bkD2">'
      )}

      ${field(
        "Travellers",
        "fa-user",
        '<input value="1 Adult, Economy">'
      )}

      <button type="button" class="bk-go">
        Search Flights
      </button>

      <p class="bk-chips">
        Popular routes:
        ${ROUTES.map(
          (r) =>
            `<button type="button" data-fill="${r}">${r}</button>`
        ).join("")}
      </p>
    `,

    hotels: () => `
      ${field(
        "Destination",
        "fa-location-dot",
        '<input id="bkDest" value="Goa, India">'
      )}

      ${field(
        "Check in",
        "fa-calendar",
        '<input type="date" id="bkD1">'
      )}

      ${field(
        "Check out",
        "fa-calendar",
        '<input type="date" id="bkD2">'
      )}

      ${field(
        "Guests & rooms",
        "fa-user",
        '<input value="2 Guests, 1 Room">'
      )}

      <button type="button" class="bk-go">
        Search Hotels
      </button>

      <p class="bk-chips">
        Popular destinations:
        ${PLACES.map(
          (r) =>
            `<button type="button" data-fill="${r}">${r}</button>`
        ).join("")}
      </p>
    `,
  };

  /* ---------- results views ---------- */

  const views = {
    flights: () => `
      <aside class="bk-side">

        <div class="bk-side-head">
          <b>Filters</b>
          <button type="button" data-clear>Clear all</button>
        </div>

        <h5>
          Max price:
          <span id="priceVal"></span>
        </h5>

        <input
          type="range"
          id="bkPrice"
          min="3000"
          max="20000"
          step="500"
          value="20000"
        >

        <h5>Stops</h5>

        ${check("stops", 0, "Non-stop")}
        ${check("stops", 1, "1 Stop")}

        <h5>Airlines</h5>

        ${[
          ...new Set(FLIGHTS.map((f) => f.air)),
        ]
          .map((a) => check("air", a, a))
          .join("")}

      </aside>

      <div class="bk-main">

        <div class="bk-top">
          <p id="bkCount"></p>

          <label>
            Sort by
            <select id="bkSort">
              <option value="price">Cheapest</option>
              <option value="m">Fastest</option>
            </select>
          </label>
        </div>

        <div class="bk-dates">
          ${[
            "Thu, 22 Oct|5,499",
            "Fri, 23 Oct|5,299",
            "Sat, 24 Oct|4,899",
            "Sun, 25 Oct|5,199",
            "Mon, 26 Oct|5,699",
          ]
            .map(
              (d, i) => `
                <button
                  type="button"
                  class="${i === 2 ? "active" : ""}">
                  <small>${d.split("|")[0]}</small>
                  <b>₹ ${d.split("|")[1]}</b>
                </button>
              `
            )
            .join("")}
        </div>

        <div id="bkList"></div>

      </div>
    `,

    hotels: () => `
      <aside class="bk-side">

        <div class="bk-side-head">
          <b>Filters</b>
          <button type="button" data-clear>Clear all</button>
        </div>

        <h5>
          Price per night:
          <span id="priceVal"></span>
        </h5>

        <input
          type="range"
          id="bkPrice"
          min="1000"
          max="25000"
          step="500"
          value="25000"
        >

        <h5>Star rating</h5>

        ${[5, 4, 3]
          .map((s) => check("star", s, "★".repeat(s)))
          .join("")}

        <h5>Guest rating</h5>

        ${check("rate", 4.5, "4.5+ Excellent")}
        ${check("rate", 4, "4.0+ Very good")}

      </aside>

      <div class="bk-main">

        <div class="bk-top">
          <p id="bkCount"></p>

          <label>
            Sort by

            <select id="bkSort">
              <option value="rate">Recommended</option>
              <option value="price">Price: low to high</option>
            </select>
          </label>
        </div>

        <div class="bk-tabs" id="bkTabs"></div>

        <div id="bkList"></div>

      </div>
    `,
  };

  /* ---------- state + render ---------- */

  const view = document.createElement("section");

  view.className = "bk-view";
  view.hidden = true;

  main.insertBefore(view, home);

  const form = document.createElement("div");

  form.className = "bk-form";

  searchWrap.appendChild(form);

  let mode = "packages";
  let hotelType = "All";

  const checked = (n) =>
    $$(`input[name="${n}"]:checked`, view).map((i) => i.value);

  const draw = () => {
    if (!view.innerHTML) return;

    const priceInput = $("#bkPrice", view);

    if (!priceInput) return;

    const max = +priceInput.value;

    $("#priceVal", view).textContent = inr(max);

    const sort = $("#bkSort", view).value;

    let list;

    /* ---------- FLIGHTS ---------- */

    if (mode === "flights") {
      const st = checked("stops");
      const ai = checked("air");

      list = FLIGHTS.filter(
        (f) =>
          f.price <= max &&
          (!st.length || st.includes(String(f.stops))) &&
          (!ai.length || ai.includes(f.air))
      ).sort((a, b) => a[sort] - b[sort]);

      $("#bkCount", view).innerHTML =
        `Showing <b>${list.length} flights</b> from ${$("#bkFrom").value} to ${$("#bkTo").value}`;

      $("#bkList", view).innerHTML = list
        .map((f) => {
          const id = `flight-${f.code.replace(" ", "")}`;
          const name = `${f.air} ${f.code}`;

          const flightImg =
            f.img || "./src/maldives.jpg";

          return `
            <article class="bk-card flight">

              ${heart(
                id,
                name,
                flightImg,
                inr(f.price)
              )}

              <!-- AIRLINE IMAGE -->
              <div
                class="logo-chip"
                style="background:${f.c}">
                <img
                  src="${flightImg}"
                  alt="${f.air}"
                  loading="lazy"
                  onerror="this.style.display='none'; this.parentElement.textContent='${f.air[0]}'"
                >
              </div>

              <!-- DEPARTURE -->
              <div class="f-time dep">
                <b>${f.dep}</b>
                <small>BBI</small>
              </div>

              <!-- DURATION -->
              <div class="f-mid">
                <small>${dur(f.m)}</small>
                <i></i>
                <small>
                  ${f.stops ? "1 stop" : "Non stop"}
                </small>
              </div>

              <!-- ARRIVAL -->
              <div class="f-time arr">
                <b>${f.arr}</b>
                <small>DEL</small>
              </div>

              <!-- FLIGHT NAME -->
              <div class="f-name">
                ${name}
              </div>

              <!-- PRICE -->
              <div class="f-price">
                <b>${inr(f.price)}</b>
                <small>per adult</small>

                <button
                  type="button"
                  class="bk-go">
                  Select
                </button>
              </div>

            </article>
          `;
        })
        .join("");
    }

    /* ---------- HOTELS ---------- */

    else {
      const sr = checked("star").map(Number);
      const rt = checked("rate").map(Number);

      const base = HOTELS.filter(
        (h) =>
          h.price <= max &&
          (!sr.length || sr.includes(h.star)) &&
          (!rt.length || h.rate >= Math.min(...rt))
      );

      const types = [
        "All",
        ...new Set(HOTELS.map((h) => h.type)),
      ];

      $("#bkTabs", view).innerHTML = types
        .map((t) => {
          const n =
            t === "All"
              ? base.length
              : base.filter((h) => h.type === t).length;

          return `
            <button
              type="button"
              class="${t === hotelType ? "active" : ""}"
              data-type="${t}">
              ${t} (${n})
            </button>
          `;
        })
        .join("");

      list = base
        .filter(
          (h) =>
            hotelType === "All" ||
            h.type === hotelType
        )
        .sort((a, b) =>
          sort === "price"
            ? a.price - b.price
            : b.rate - a.rate
        );

      $("#bkCount", view).innerHTML =
        `Showing <b>${list.length} properties</b> in ${$("#bkDest").value.split(",")[0]}`;

      $("#bkList", view).innerHTML = list
        .map(
          (h) => `
            <article class="bk-card hotel">

              ${heart(
                "hotel-" +
                  h.name
                    .toLowerCase()
                    .replace(/\W+/g, "-"),
                h.name,
                h.img,
                inr(h.price)
              )}

              <div class="h-img">

                ${
                  h.tag
                    ? `<span>${h.tag}</span>`
                    : ""
                }

                <img
                  src="${h.img}"
                  alt="${h.name}"
                  loading="lazy"
                >

              </div>

              <div class="h-info">

                <h3>${h.name}</h3>

                <p class="h-loc">
                  <i class="fa-solid fa-location-dot"></i>
                  ${h.loc}
                </p>

                <p class="h-rate">
                  <span class="stars">
                    ${"★".repeat(h.star)}
                  </span>

                  <b>${h.rate}</b>
                  (${h.rev} reviews)
                </p>

                <p class="h-am">
                  ${h.am
                    .map(
                      (a) =>
                        `<span>${a}</span>`
                    )
                    .join("")}
                </p>

              </div>

              <div class="f-price">

                <b>${inr(h.price)}</b>

                <small>per night</small>

                <button
                  type="button"
                  class="bk-go">
                  View Details
                </button>

              </div>

            </article>
          `
        )
        .join("");
    }

    if (!list.length) {
      $("#bkList", view).innerHTML = `
        <p class="bk-empty">
          ${
            loadError
              ? "booking.json load nahi hua. Path ya JSON check karo (F12 Console dekho)."
              : "No result found."
          }
        </p>
      `;
    }
  };

  /* ---------- mode ---------- */

  const setMode = (m) => {
    mode = m;
    hotelType = "All";

    const book = m !== "packages";

    $$(".hero-tab").forEach((t) =>
      t.classList.toggle(
        "active",
        t.dataset.mode === m
      )
    );

    hero.classList.toggle(
      "booking-mode",
      book
    );

    changeHero(HERO_IMGS[m]);

    home.hidden = book;
    view.hidden = !book;

    if (!book) {
      h1.innerHTML = orig.h1;
      desc.innerHTML = orig.desc;
      form.innerHTML = "";

      return;
    }

    h1.innerHTML =
      m === "flights"
        ? "Find Your<br>Perfect Flight"
        : "Find Your<br>Perfect Stay";

    desc.textContent =
      m === "flights"
        ? "Fly to your dream destinations with best fares and hassle-free booking."
        : "From luxury resorts to budget stays, find the perfect place for your next trip.";

    form.innerHTML = forms[m]();

    view.innerHTML = views[m]();

    draw();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ---------- events ---------- */

  $$(".hero-tab").forEach((t) =>
    t.addEventListener("click", () =>
      ready.then(() =>
        setMode(t.dataset.mode)
      )
    )
  );

  view.addEventListener("input", draw);

  view.addEventListener("click", (e) => {

    /* Mobile filters */

    const sideHead =
      e.target.closest(".bk-side-head");

    if (
      sideHead &&
      !e.target.closest("[data-clear]") &&
      window.innerWidth <= 900
    ) {
      sideHead.parentElement.classList.toggle(
        "open"
      );
    }

    /* Hotel tabs */

    const tab =
      e.target.closest("[data-type]");

    if (tab) {
      hotelType = tab.dataset.type;
      draw();
    }

    /* Flight dates */

    const day =
      e.target.closest(".bk-dates button");

    if (day) {
      $$(".bk-dates button", view).forEach(
        (b) =>
          b.classList.toggle(
            "active",
            b === day
          )
      );
    }

    /* Clear filters */

    if (
      e.target.closest("[data-clear]")
    ) {
      $$(
        "input[type=checkbox]",
        view
      ).forEach(
        (c) => (c.checked = false)
      );

      $("#bkPrice", view).value =
        $("#bkPrice", view).max;

      draw();
    }
  });

  form.addEventListener("click", (e) => {

    const chip =
      e.target.closest("[data-fill]");

    if (chip) {

      if (mode === "flights") {
        const [a, b] =
          chip.dataset.fill.split(" → ");

        $("#bkFrom").value = a;
        $("#bkTo").value = b;
      } else {
        $("#bkDest").value =
          chip.dataset.fill;
      }

      draw();
    }

    if (e.target.closest(".bk-go")) {
      draw();
    }
  });
});