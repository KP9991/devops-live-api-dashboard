const buttons = document.querySelectorAll("button[data-api]");


function setLoading(button, resultElement) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = "Loading...";
    resultElement.className = "result";
    resultElement.textContent = "Connecting to the external API...";
}


function finishLoading(button) {
    button.disabled = false;
    button.textContent = button.dataset.originalText;
}


function showError(resultElement, message) {
    resultElement.className = "result error";
    resultElement.innerHTML = `
        <strong>API request failed</strong><br>
        ${message}
    `;
}


async function getJson(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
}


async function loadGithub(button) {
    const result = document.getElementById("github-result");
    setLoading(button, result);

    try {
        const data = await getJson("/api/github-status");

        const conclusion =
            data.conclusion || data.status || "Currently running";

        result.className = "result success";
        result.innerHTML = `
            <div class="result-title">Latest workflow result</div>
            <p><strong>Workflow:</strong> ${data.workflow}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Conclusion:</strong> ${conclusion}</p>
            <p><strong>Branch:</strong> ${data.branch}</p>
            <p><strong>Event:</strong> ${data.event}</p>
            <p><strong>Commit:</strong> ${data.commit_id}</p>
            <p><strong>Message:</strong> ${data.commit_message}</p>
            <p><strong>Started by:</strong> ${data.actor}</p>
            <a href="${data.run_url}" target="_blank"
               rel="noopener noreferrer">
                Open workflow on GitHub
            </a>
        `;
    } catch (error) {
        showError(result, error.message);
    } finally {
        finishLoading(button);
    }
}


async function loadWeather(button) {
    const result = document.getElementById("weather-result");
    const cityInput = document.getElementById("weather-city");
    const city = cityInput.value.trim();

    if (!city) {
        showError(result, "Please enter a city name.");
        return;
    }

    setLoading(button, result);

    try {
        const data = await getJson(
            `/api/weather?city=${encodeURIComponent(city)}`
        );

        result.className = "result success";
        result.innerHTML = `
            <div class="result-title">
                ${data.city}, ${data.country}
            </div>
            <p><strong>Conditions:</strong> ${data.description}</p>
            <p><strong>Temperature:</strong> ${data.temperature} °C</p>
            <p>
                <strong>Feels like:</strong>
                ${data.apparent_temperature} °C
            </p>
            <p><strong>Humidity:</strong> ${data.humidity}%</p>
            <p><strong>Wind speed:</strong> ${data.wind_speed} km/h</p>
            <small>Weather data provided by Open-Meteo.</small>
        `;
    } catch (error) {
        showError(result, error.message);
    } finally {
        finishLoading(button);
    }
}


async function loadCountry(button) {
    const result = document.getElementById("country-result");
    const countryInput = document.getElementById("country-name");
    const country = countryInput.value.trim();

    if (!country) {
        showError(result, "Please enter a country name.");
        return;
    }

    setLoading(button, result);

    try {
        const data = await getJson(
            `/api/country?name=${encodeURIComponent(country)}`
        );

        const population = Number(data.population).toLocaleString();

        result.className = "result success";
        result.innerHTML = `
            <div class="result-title">${data.name}</div>
            <img
                class="flag"
                src="${data.flag}"
                alt="${data.name} flag"
            >
            <p><strong>Official name:</strong> ${data.official_name}</p>
            <p><strong>Capital:</strong> ${data.capital}</p>
            <p><strong>Region:</strong> ${data.region}</p>
            <p><strong>Population:</strong> ${population}</p>
            <p><strong>Currency:</strong> ${data.currency}</p>
        `;
    } catch (error) {
        showError(
            result,
            `${error.message}. The REST Countries service may require an updated endpoint or access token.`
        );
    } finally {
        finishLoading(button);
    }
}


async function loadCurrency(button) {
    const result = document.getElementById("currency-result");
    const amount = document.getElementById("currency-amount").value;
    const from = document.getElementById("currency-from").value;
    const to = document.getElementById("currency-to").value;

    if (!amount || Number(amount) < 0) {
        showError(result, "Please enter a valid amount.");
        return;
    }

    if (from === to) {
        result.className = "result success";
        result.innerHTML = `
            <div class="result-title">
                ${Number(amount).toFixed(2)} ${from}
                =
                ${Number(amount).toFixed(2)} ${to}
            </div>
            <p>The selected currencies are identical.</p>
        `;
        return;
    }

    setLoading(button, result);

    try {
        const url =
            `/api/currency?amount=${encodeURIComponent(amount)}` +
            `&from=${encodeURIComponent(from)}` +
            `&to=${encodeURIComponent(to)}`;

        const data = await getJson(url);

        result.className = "result success";
        result.innerHTML = `
            <div class="result-title">
                ${Number(data.amount).toFixed(2)} ${data.from}
                =
                ${Number(data.converted_amount).toFixed(2)} ${data.to}
            </div>
            <p>
                <strong>Exchange rate:</strong>
                1 ${data.from} = ${data.rate} ${data.to}
            </p>
            <p><strong>Rate date:</strong> ${data.date}</p>
            <small>Exchange-rate data provided by Frankfurter.</small>
        `;
    } catch (error) {
        showError(result, error.message);
    } finally {
        finishLoading(button);
    }
}


async function loadNasa(button) {
    const result = document.getElementById("nasa-result");
    setLoading(button, result);

    try {
        const data = await getJson("/api/nasa");

        let mediaContent;

        if (data.media_type === "image") {
            mediaContent = `
                <img src="${data.url}" alt="${data.title}">
            `;
        } else {
            mediaContent = `
                <p>
                    This NASA item is a video.
                    <a href="${data.url}" target="_blank"
                       rel="noopener noreferrer">
                        Open NASA media
                    </a>
                </p>
            `;
        }

        result.className = "result success";
        result.innerHTML = `
            <div class="result-title">${data.title}</div>
            <p><strong>Date:</strong> ${data.date}</p>
            ${mediaContent}
            <p>${data.explanation}</p>
            <small>Content provided by NASA APOD.</small>
        `;
    } catch (error) {
        showError(result, error.message);
    } finally {
        finishLoading(button);
    }
}

async function loadAirQuality(button) {
    const result = document.getElementById("air-quality-result");
    const cityInput = document.getElementById("air-city");
    const city = cityInput.value.trim();

    if (!city) {
        showError(result, "Please enter a city name.");
        return;
    }

    setLoading(button, result);

    try {
        const data = await getJson(
            `/api/air-quality?city=${encodeURIComponent(city)}`
        );

        let aqiClass = "success";

        if (data.aqi > 100) {
            aqiClass = "error";
        }

        const displayValue = (value, unit = "") => {
            if (value === null || value === undefined) {
                return "Not available";
            }

            return `${value}${unit}`;
        };

        result.className = `result ${aqiClass}`;
        result.innerHTML = `
            <div class="result-title">
                ${data.city}, ${data.country}
            </div>

            <p>
                <strong>US Air Quality Index:</strong>
                ${data.aqi} — ${data.category}
            </p>

            <p>
                <strong>PM2.5:</strong>
                ${displayValue(data.pm2_5, " μg/m³")}
            </p>

            <p>
                <strong>PM10:</strong>
                ${displayValue(data.pm10, " μg/m³")}
            </p>

            <p>
                <strong>Nitrogen dioxide:</strong>
                ${displayValue(data.nitrogen_dioxide, " μg/m³")}
            </p>

            <p>
                <strong>Ozone:</strong>
                ${displayValue(data.ozone, " μg/m³")}
            </p>

            <p>
                <strong>UV index:</strong>
                ${displayValue(data.uv_index)}
            </p>

            <p>
                <strong>Outdoor advice:</strong>
                ${data.safety_advice}
            </p>

            <p>
                <strong>UV advice:</strong>
                ${data.uv_advice}
            </p>

            <small>
                Observed at: ${data.observed_at || "Not available"}.
                Air-quality data provided by Open-Meteo and CAMS.
            </small>
        `;
    } catch (error) {
        showError(result, error.message);
    } finally {
        finishLoading(button);
    }
}
buttons.forEach((button) => {
    button.addEventListener("click", () => {
        const api = button.dataset.api;

        if (api === "github") {
            loadGithub(button);
        } else if (api === "weather") {
            loadWeather(button);
        } else if (api === "country") {
            loadCountry(button);
        } else if (api === "currency") {
            loadCurrency(button);
} else if (api === "air-quality") {
    loadAirQuality(button);
} else if (api === "nasa") {
    loadNasa(button);
}
    });
});
