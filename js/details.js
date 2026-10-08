document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const $ = (s, p = document) => p.querySelector(s);
  const root = $("#detail");
  const slug = (s) =>
    String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const load = async (url) => {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      console.error("Could not load", url, e);
      return null;
    }
  };

  // Icons + labels for the "What's included" row
  const FACILITY = {
    flights: ["fa-plane", "Flights"],
    hotel: ["fa-hotel", "Hotel stay"],
    breakfast: ["fa-utensils", "Breakfast"],
    transfers: ["fa-van-shuttle", "Transfers"],
    sightseeing: ["fa-camera", "Sightseeing"],
    insurance: ["fa-shield-halved", "Insurance"],
    visa: ["fa-passport", "Visa help"],
    guide: ["fa-user-tie", "Local guide"],
  };

  // Used when a place has no entry in details.json
  const DEFAULT = {
    about: "A handpicked TripOnn trip with stays, transfers and local experiences planned for you.",
    duration: "5 Nights / 6 Days",
    bestTime: "Check with our travel expert",
    inclusions: ["flights", "hotel", "breakfast", "transfers", "sightseeing", "insurance"],
    itinerary: [
      { title: "Arrival", text: "Airport pickup and hotel check-in." },
      { title: "Local sightseeing", text: "Guided tour of the main sights." },
      { title: "Free day", text: "Relax or add an optional activity." },
      { title: "Departure", text: "Check-out and airport drop." },
    ],
    nearby: [],
  };

  const params = new URLSearchParams(location.search);
  const rawType = params.get("type");
const type = ["packages", "destinations"].includes(rawType) ? rawType : "trips";
  const name = params.get("name") || "";

  const [travel, extra] = await Promise.all([
    load("./data/destinations.json"),
    load("./data/details.json"),
  ]);

  const list = (travel && travel[type]) || [];
  const index = list.findIndex((i) => i.name === name);
  const item = list[index];

  if (!item) {
    root.innerHTML = `<p class="d-empty">Trip not found. <a href="index.html">Back to home</a></p>`;
    return;
  }

  // Same id format as tripOnn.js (withStableIds) so the heart state stays in sync
  const id = `${slug(item.name)}-${index}`;
  const key = Object.keys(extra || {}).find((k) =>
    extra[k].names.some((n) => n.toLowerCase() === item.name.toLowerCase()),
  );
  const info = { ...DEFAULT, ...((extra && extra[key]) || {}) };

  const place = info.mapQuery || item.name;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=9&output=embed`;
  const mapLink = (q) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const saved = window.TripOnnWishlist && window.TripOnnWishlist.isWishlisted(id);
  const today = new Date().toISOString().split("T")[0];

  document.title = `${item.name} | TripOnn`;

  const quick = [
    ["Country", info.country],
    ["Language", info.language],
    ["Currency", info.currency],
    ["Best time", info.bestTime],
    ["Duration", info.duration],
  ].filter((r) => r[1]);

  root.innerHTML = `
    <section class="d-hero">
      <button class="wishlist-heart${saved ? " active" : ""}" type="button"
        data-id="${id}" data-name="${item.name}" data-img="${item.img}"
        data-price="${item.price || ""}" aria-label="Save to wishlist">
        <i class="fa-${saved ? "solid" : "regular"} fa-heart"></i>
      </button>
      <img src="${item.img}" alt="${item.name}" />
      <div class="d-hero-info">
        <h1>${item.name}</h1>
        <div class="d-meta">
          ${item.rating ? `<span><i class="fa-solid fa-star"></i>${item.rating} (${item.reviews || 0} reviews)</span>` : ""}
          <span><i class="fa-regular fa-calendar"></i>Best time: ${info.bestTime}</span>
        </div>
      </div>
    </section>

    <nav class="d-tabs">
      <a href="#overview">Overview</a>
      <a href="#inclusions">Inclusions</a>
      <a href="#itinerary">Itinerary</a>
      <a href="#nearby">Nearby places</a>
      <a href="#map">Map</a>
    </nav>

    <div class="d-grid">
      <div>
        <section class="d-sec" id="overview">
          <h2>About ${item.name}</h2>
          <p>${info.about}</p>
        </section>

        <section class="d-sec" id="inclusions">
          <h2>What's included</h2>
          <div class="d-inc">
            ${info.inclusions
              .filter((k) => FACILITY[k])
              .map((k) => `<div><i class="fa-solid ${FACILITY[k][0]}"></i>${FACILITY[k][1]}</div>`)
              .join("")}
          </div>
        </section>

        <section class="d-sec" id="itinerary">
          <h2>Day-wise itinerary</h2>
          <ol class="d-days">
            ${info.itinerary
              .map((d, i) => `<li><b>Day ${i + 1}: ${d.title}</b><small>${d.text}</small></li>`)
              .join("")}
          </ol>
        </section>

        <section class="d-sec" id="nearby">
          <h2>Places near ${item.name}</h2>
          ${
            info.nearby.length
              ? `<div class="d-near">${info.nearby
                  .map(
                    (n) => `<a href="${mapLink(n.name + ", " + place)}" target="_blank" rel="noopener">
                      <i class="fa-solid fa-location-dot"></i>
                      <b>${n.name}</b><span>${n.note}</span><em>${n.dist} away</em></a>`,
                  )
                  .join("")}</div>`
              : `<p>Nearby places will be added soon. Use the map below to explore the area.</p>`
          }
        </section>

        <section class="d-sec d-map" id="map">
          <h2>Location</h2>
          <iframe src="${mapSrc}" loading="lazy" title="Map of ${item.name}"></iframe>
          <a class="d-maplink" href="${mapLink(place)}" target="_blank" rel="noopener">
            Open in Google Maps <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </section>
      </div>

      <aside class="d-side">
        <section class="d-sec" id="booking">
          <h2>${info.duration}</h2>
          <div class="d-price">${item.price || "On request"} <small>/ person</small></div>
          <div class="d-form">
            <label>Travel date <input type="date" id="dDate" min="${today}" /></label>
            <label>Travellers <input type="number" id="dPeople" min="1" max="20" value="2" /></label>
            <button type="button" class="d-book" id="dBook">Book now</button>
            <p class="d-msg" id="dMsg"></p>
          </div>
        </section>
        <section class="d-sec">
          <h2>Quick info</h2>
          <ul class="d-quick">
            ${quick.map((r) => `<li><span>${r[0]}</span><b>${r[1]}</b></li>`).join("")}
          </ul>
        </section>
      </aside>
    </div>`;

  // Booking: validate, then confirm.
  const dateEl = $("#dDate");
  const peopleEl = $("#dPeople");
  const msg = $("#dMsg");
  const book = () => {
    const people = Number(peopleEl.value);
    dateEl.classList.toggle("input-error", !dateEl.value);
    peopleEl.classList.toggle("input-error", !(people >= 1));
    if (!dateEl.value || !(people >= 1)) {
      msg.style.color = "#e0563f";
      msg.textContent = "Choose a travel date and number of travellers.";
      return;
    }
    msg.style.color = "";
    msg.textContent = `Request sent: ${item.name}, ${people} traveller(s) on ${dateEl.value}.`;
  };
  $("#dBook").addEventListener("click", book);
  $("#btn1")?.addEventListener("click", () => {
    $("#booking").scrollIntoView({ behavior: "smooth", block: "center" });
  });
});
