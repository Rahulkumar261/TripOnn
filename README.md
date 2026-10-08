# TripOnn ✈️

**Explore beyond limits.** TripOnn is a responsive travel website front end built with plain HTML, CSS and JavaScript. Browse holiday packages, filter trips by interest, save favourites to a wishlist, search flights and hotels, and open a detail page for any trip with a map, inclusions, itinerary and nearby places.

> 🚧 Work in progress. New features are added regularly.

## Live demo

<!-- Add your link here once it is hosted, for example on Netlify or GitHub Pages -->
Coming soon.

## Features

**Home page**
- Hero banner with Packages / Hotels / Flights tabs
- Auto-scrolling infinite packages carousel
- "Explore by interest" filter (Mountain, Adventure, City, Honeymoon, Wildlife, Culture, Luxury) with trip cards showing price and rating
- 3D depth carousel for handpicked destinations
- Limited-time offer banner with a live countdown
- Email subscribe form with validation
- Customer reviews and a full footer

**Trip details page**
- Opens when a trip, package or destination card is clicked
- Hero image, rating and best time to visit
- Embedded Google Map and an "Open in Google Maps" link
- What's included (flights, hotel, breakfast and more)
- Day-wise itinerary
- Nearby places, each linked to Google Maps
- Booking card (date and travellers, demo only) and quick info

**Flights and hotels**
- Search form, filter sidebar and sort options
- Flight list with a date-price strip
- Hotel list with property-type tabs

**Common**
- Wishlist saved in `localStorage`, shared across pages, with a navbar dropdown and item count
- Login / Sign up modal with form validation
- Scroll progress bar and sticky header
- Mobile hamburger menu and a fully responsive layout
- Reduced-motion support

## Tech stack

- HTML5, CSS3 (custom properties, grid, flexbox, media queries)
- Vanilla JavaScript (ES6+)
- [Font Awesome](https://fontawesome.com/) icons
- Google Fonts: DM Sans and Manrope
- JSON files as a simple data source

## Project structure

```
TripOnn/
├── index.html            # Home page
├── details.html          # Trip details page
├── packages.html         # All packages page (coming soon)
├── adventures.html       # Adventures page
├── favicon.ico
├── css/
│   ├── tripOnn.css       # Main styles
│   ├── wishlist.css      # Wishlist heart and dropdown
│   ├── booking.css       # Flights and hotels
│   └── details.css       # Details page
├── js/
│   ├── wishlist.js       # Wishlist storage module (load first)
│   ├── tripOnn.js        # Home page logic, carousels, login
│   ├── booking.js        # Flights and hotels search and filters
│   └── details.js        # Builds the details page from JSON
├── data/
│   ├── destinations.json # Packages, destinations and trips
│   ├── details.json      # Extra info per place (about, itinerary, nearby)
│   └── booking.json      # Flights and hotels
└── src/                  # Images
    └── favicon/          # Favicon PNGs
```

## Run locally

The site loads JSON files with `fetch`, so it must be served over HTTP. Opening an HTML file directly will not work.

1. Clone the repo
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```
2. Open the folder in VS Code and click **Go Live** (Live Server extension).
3. Open the address Live Server shows, for example `http://localhost:5500`.

To test on your phone, connect it to the same WiFi and open `http://<your-computer-ip>:<port>`.

## Adding a new place

1. Add it to `data/destinations.json` under `trips`, `packages` or `destinations`:
   ```json
   { "name": "Goa", "img": "./src/goa.jpg", "tags": ["adventure"],
     "price": "₹ 30,000", "rating": 4.7, "reviews": "380" }
   ```
2. For full details, add an entry to `data/details.json`. The `names` list must contain the same `name` used above:
   ```json
   "goa": {
     "names": ["Goa"],
     "mapQuery": "Goa, India",
     "country": "India",
     "bestTime": "Nov - Feb",
     "duration": "3 Nights / 4 Days",
     "about": "Beaches, nightlife and old churches.",
     "inclusions": ["hotel", "breakfast", "transfers"],
     "itinerary": [{ "title": "Arrival", "text": "Check-in and beach evening." }],
     "nearby": [{ "name": "Baga Beach", "dist": "10 km", "note": "Water sports" }]
   }
   ```

Places without an entry in `details.json` still get a details page with default content and a working map.

## Roadmap

- [ ] All packages page
- [ ] Multi-step booking flow
- [ ] Photo gallery on the details page
- [ ] Weather and currency converter
- [ ] User dashboard
- [ ] AI travel assistant
- [ ] Real backend for login and bookings

## Notes

- Login, booking and subscribe forms are front-end demos. No data is sent to a server.
- Images come from Unsplash, Pexels and other public sources and are used for demonstration only.

## Author

Made by **Rahul Kumar**
- GitHub: [@Rahulkumar261](https://github.com/Rahulkumar261)
## License

Copyright (c) 2026 <Rahul sethi>. All rights reserved.

This code is published for viewing and portfolio purposes only. You may not copy,
modify, distribute or use it, in whole or in part, without written permission.