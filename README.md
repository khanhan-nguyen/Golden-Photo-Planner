# Golden 📸

Golden is a vanilla JavaScript photo-timing planner. The user enters a location, date, and type of photo shoot. The app finds the location coordinates, retrieves solar-event data, and creates a simple shooting plan around golden hour and blue hour.

## Features

- Search a city or place name
- Find sunrise and sunset
- Show morning/evening golden hour
- Show morning/evening blue hour
- Display moon phase and illumination
- Show approximate sunset direction
- Generate a rule-based recommendation for:
  - Portrait photography
  - Landscape photography
  - Street photography
  - Architecture photography
- Save shoot plans using `localStorage`
- Delete saved shoots or clear all saved data
- Responsive design for desktop and mobile

## Technologies

- HTML
- CSS
- Vanilla JavaScript
- Fetch API
- async / await
- DOM manipulation
- Local Storage
- Open-Meteo Geocoding API
- Sunrise-Sunset.org API v2

## Project structure

```text
Golden_Project/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How the data flows

```text
User enters location
        ↓
Open-Meteo Geocoding API
        ↓
latitude + longitude + timezone
        ↓
Sunrise-Sunset.org API v2
        ↓
sunrise / sunset / golden hour / blue hour
        ↓
JavaScript recommendation logic
        ↓
Results displayed in the browser
```

## Run locally

Because Golden uses web APIs, run the folder through a small local web server rather than double-clicking `index.html`.

If Python is installed:

```powershell
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

Stop the server with `Ctrl + C`.

You can also use the VS Code Live Server extension.

## Key JavaScript functions to understand

### `findLocation(searchText)`
Calls the Open-Meteo Geocoding API and returns the first matching location.

### `getSolarTimes(latitude, longitude, date, timezone)`
Calls Sunrise-Sunset.org API v2 to get astronomical timing data.

### `buildRecommendation(type, solarData, timeZone)`
Uses your own rule-based logic to create a photo-shoot recommendation.

### `displayResults(location, solarData, selectedShootType)`
Updates the HTML with the returned data.

### `getSavedShoots()` / `storeSavedShoots()`
Read and write shoot plans with browser `localStorage`.

## API attribution

Location search uses Open-Meteo Geocoding data (based on GeoNames).

Solar-event data uses Sunrise-Sunset.org:
https://sunrise-sunset.org/

## Suggested future upgrades

- Let the user choose between multiple matching cities
- Add weather/cloud cover for dates within a forecast window
- Add a map view
- Allow notes for each saved shoot
- Add favorite photography locations
- Add sunrise/sunset direction visualization
