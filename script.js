const plannerForm = document.getElementById("plannerForm");
const locationInput = document.getElementById("locationInput");
const dateInput = document.getElementById("dateInput");
const shootType = document.getElementById("shootType");
const statusMessage = document.getElementById("statusMessage");
const resultsSection = document.getElementById("resultsSection");
const saveShootButton = document.getElementById("saveShootButton");
const clearSavedButton = document.getElementById("clearSavedButton");
const savedShootsList = document.getElementById("savedShootsList");

let currentShoot = null;

// Use today's date as the default.
dateInput.value = new Date().toISOString().split("T")[0];

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function formatTime(isoString, timeZone) {
  if (!isoString) {
    return "Not available";
  }

  return new Date(isoString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timeZone
  });
}

function formatRange(begin, end, timeZone) {
  if (!begin || !end) {
    return "Not available";
  }

  return `${formatTime(begin, timeZone)} – ${formatTime(end, timeZone)}`;
}

function formatDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

async function findLocation(searchText) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(searchText)}` +
    "&count=1&language=en&format=json";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Location search failed.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Location not found. Try adding a state or country.");
  }

  return data.results[0];
}

async function getSolarTimes(latitude, longitude, date, timezone) {
  const url =
    "https://api.sunrise-sunset.org/v2" +
    `?lat=${latitude}` +
    `&lng=${longitude}` +
    `&date=${date}` +
    `&tz=${encodeURIComponent(timezone)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Solar timing request failed.");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.message || "Solar timing data could not be loaded.");
  }

  return data;
}

function buildRecommendation(type, solarData, timeZone) {
  const morningGolden = formatRange(
    solarData.golden_hour?.morning?.begin,
    solarData.golden_hour?.morning?.end,
    timeZone
  );

  const eveningGolden = formatRange(
    solarData.golden_hour?.evening?.begin,
    solarData.golden_hour?.evening?.end,
    timeZone
  );

  const eveningBlue = formatRange(
    solarData.blue_hour?.evening?.begin,
    solarData.blue_hour?.evening?.end,
    timeZone
  );

  if (type === "Portrait") {
    return {
      title: "Use the evening golden hour for portraits",
      paragraphs: [
        `Best starting window: ${eveningGolden}.`,
        "Start near the beginning of golden hour for warmer directional light. Closer to sunset, try backlighting your subject for softer edges and a glowing background.",
        `If you want a cooler, moodier look afterward, continue into evening blue hour: ${eveningBlue}.`
      ]
    };
  }

  if (type === "Landscape") {
    return {
      title: "Arrive before the light gets dramatic",
      paragraphs: [
        `Golden-hour options: ${morningGolden} or ${eveningGolden}.`,
        "For landscapes, arrive 20–30 minutes early so you can compose before the light changes. Keep shooting through sunset because the sky can continue changing afterward.",
        `Evening blue hour (${eveningBlue}) can work well for city skylines, water, and scenes with artificial lights.`
      ]
    };
  }

  if (type === "Street") {
    return {
      title: "Look for long shadows and changing contrast",
      paragraphs: [
        `Try the evening golden hour: ${eveningGolden}.`,
        "Use side streets and building edges to catch pockets of warm light, silhouettes, reflections, and longer shadows. Street scenes can change quickly, so keep moving rather than staying in one spot.",
        `Blue hour begins afterward around ${eveningBlue}, which can be useful for neon signs and city lights.`
      ]
    };
  }

  return {
    title: "Use directional light to shape buildings",
    paragraphs: [
      `Try either ${morningGolden} or ${eveningGolden}.`,
      "Architecture often looks strongest when low-angle light creates visible texture and shadow across a facade. The better choice depends on which direction the building faces.",
      `The sunset azimuth below can help you estimate which side of a building may receive the strongest evening light.`
    ]
  };
}

function directionFromAzimuth(degrees) {
  if (degrees === null || degrees === undefined) {
    return "Not available";
  }

  const directions = [
    "N", "NE", "E", "SE",
    "S", "SW", "W", "NW"
  ];

  const index = Math.round(degrees / 45) % 8;
  return `${directions[index]} (${degrees.toFixed(0)}°)`;
}

function displayResults(location, solarData, selectedShootType) {
  const locationName = [
    location.name,
    location.admin1,
    location.country
  ].filter(Boolean).join(", ");

  const timeZone = location.timezone;

  document.getElementById("resultLocation").textContent = locationName;
  document.getElementById("resultDate").textContent =
    `${formatDate(solarData.date)} · ${selectedShootType}`;

  document.getElementById("sunriseTime").textContent =
    formatTime(solarData.sunrise, timeZone);

  document.getElementById("sunsetTime").textContent =
    formatTime(solarData.sunset, timeZone);

  document.getElementById("morningGolden").textContent =
    formatRange(
      solarData.golden_hour?.morning?.begin,
      solarData.golden_hour?.morning?.end,
      timeZone
    );

  document.getElementById("eveningGolden").textContent =
    formatRange(
      solarData.golden_hour?.evening?.begin,
      solarData.golden_hour?.evening?.end,
      timeZone
    );

  document.getElementById("morningBlue").textContent =
    formatRange(
      solarData.blue_hour?.morning?.begin,
      solarData.blue_hour?.morning?.end,
      timeZone
    );

  document.getElementById("eveningBlue").textContent =
    formatRange(
      solarData.blue_hour?.evening?.begin,
      solarData.blue_hour?.evening?.end,
      timeZone
    );

  const recommendation = buildRecommendation(
    selectedShootType,
    solarData,
    timeZone
  );

  document.getElementById("recommendationTitle").textContent =
    recommendation.title;

  document.getElementById("recommendationText").innerHTML =
    recommendation.paragraphs
      .map(paragraph => `<p>${paragraph}</p>`)
      .join("");

  document.getElementById("moonInfo").textContent =
    solarData.moon_phase
      ? `${solarData.moon_phase} · ${Math.round(solarData.moon_illumination)}%`
      : "Not available";

  document.getElementById("sunsetDirection").textContent =
    directionFromAzimuth(solarData.solar_position?.sunset_azimuth);

  document.getElementById("timezoneInfo").textContent =
    solarData.tzid || timeZone;

  resultsSection.classList.remove("hidden");

  currentShoot = {
    id: Date.now(),
    location: locationName,
    date: solarData.date,
    shootType: selectedShootType,
    timezone: timeZone,
    sunrise: solarData.sunrise,
    sunset: solarData.sunset,
    morningGoldenBegin: solarData.golden_hour?.morning?.begin || null,
    morningGoldenEnd: solarData.golden_hour?.morning?.end || null,
    eveningGoldenBegin: solarData.golden_hour?.evening?.begin || null,
    eveningGoldenEnd: solarData.golden_hour?.evening?.end || null
  };
}

function getSavedShoots() {
  const stored = localStorage.getItem("goldenSavedShoots");

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function storeSavedShoots(shoots) {
  localStorage.setItem("goldenSavedShoots", JSON.stringify(shoots));
}

function renderSavedShoots() {
  const shoots = getSavedShoots();

  if (shoots.length === 0) {
    savedShootsList.innerHTML =
      '<p class="muted">No shoots saved yet.</p>';
    return;
  }

  savedShootsList.innerHTML = shoots
    .map(shoot => {
      const goldenTime = formatRange(
        shoot.eveningGoldenBegin,
        shoot.eveningGoldenEnd,
        shoot.timezone
      );

      return `
        <article class="saved-item">
          <div>
            <h3>${shoot.location}</h3>
            <p>
              ${formatDate(shoot.date)} · ${shoot.shootType}
              · Evening golden hour: ${goldenTime}
            </p>
          </div>

          <button
            class="delete-button"
            type="button"
            data-id="${shoot.id}"
          >
            Delete
          </button>
        </article>
      `;
    })
    .join("");
}

plannerForm.addEventListener("submit", async event => {
  event.preventDefault();

  const locationText = locationInput.value.trim();
  const selectedDate = dateInput.value;
  const selectedShootType = shootType.value;

  if (!locationText || !selectedDate) {
    showStatus("Enter both a location and date.", true);
    return;
  }

  try {
    showStatus("Finding location and calculating light...");
    resultsSection.classList.add("hidden");

    const location = await findLocation(locationText);

    const solarData = await getSolarTimes(
      location.latitude,
      location.longitude,
      selectedDate,
      location.timezone
    );

    if (solarData.sun_status !== "normal") {
      showStatus(
        "This location has unusual daylight conditions on that date. Some solar events may be unavailable."
      );
    } else {
      showStatus("");
    }

    displayResults(location, solarData, selectedShootType);
  } catch (error) {
    console.error(error);
    showStatus(error.message, true);
  }
});

saveShootButton.addEventListener("click", () => {
  if (!currentShoot) {
    return;
  }

  const shoots = getSavedShoots();

  const duplicate = shoots.some(
    shoot =>
      shoot.location === currentShoot.location &&
      shoot.date === currentShoot.date &&
      shoot.shootType === currentShoot.shootType
  );

  if (duplicate) {
    showStatus("That shoot is already saved.");
    return;
  }

  shoots.push(currentShoot);
  storeSavedShoots(shoots);
  renderSavedShoots();
  showStatus("Shoot saved in this browser.");
});

savedShootsList.addEventListener("click", event => {
  if (!event.target.classList.contains("delete-button")) {
    return;
  }

  const id = Number(event.target.dataset.id);

  const updatedShoots = getSavedShoots().filter(
    shoot => shoot.id !== id
  );

  storeSavedShoots(updatedShoots);
  renderSavedShoots();
});

clearSavedButton.addEventListener("click", () => {
  localStorage.removeItem("goldenSavedShoots");
  renderSavedShoots();
  showStatus("Saved shoots cleared.");
});

renderSavedShoots();
