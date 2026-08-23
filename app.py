import os
from datetime import datetime, timezone
from urllib.parse import quote

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

REQUEST_TIMEOUT = 10


def api_error(message, status_code=502):
    return jsonify(
        status="error",
        message=message,
        timestamp=datetime.now(timezone.utc).isoformat()
    ), status_code


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/health")
def health():
    return jsonify(
        status="healthy",
        application="devops-live-api-dashboard",
        environment="development",
        version="1.0.0",
        port=8090,
        timestamp=datetime.now(timezone.utc).isoformat()
    ), 200


@app.route("/api/github-status")
def github_status():
    url = (
        "https://api.github.com/repos/"
        "KP9991/devops-status-app/actions/runs"
    )

    headers = {
        "Accept": "application/vnd.github+json"
    }

    params = {
        "branch": "main",
        "per_page": 1
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            params=params,
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()

        runs = response.json().get("workflow_runs", [])

        if not runs:
            return api_error("No GitHub Actions runs were found.", 404)

        run = runs[0]
        commit = run.get("head_commit") or {}

        return jsonify(
            status="success",
            workflow=run.get("name"),
            workflow_status=run.get("status"),
            conclusion=run.get("conclusion"),
            branch=run.get("head_branch"),
            commit_id=(run.get("head_sha") or "")[:7],
            commit_message=commit.get("message", "Not available"),
            actor=(run.get("actor") or {}).get("login"),
            event=run.get("event"),
            run_number=run.get("run_number"),
            run_url=run.get("html_url"),
            created_at=run.get("created_at"),
            updated_at=run.get("updated_at")
        )

    except requests.RequestException as error:
        return api_error(f"GitHub API request failed: {error}")


@app.route("/api/weather")
def weather():
    city = request.args.get("city", "Nagpur").strip()

    if not city:
        return api_error("Please provide a city name.", 400)

    try:
        geocoding_response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            },
            timeout=REQUEST_TIMEOUT
        )
        geocoding_response.raise_for_status()

        locations = geocoding_response.json().get("results", [])

        if not locations:
            return api_error(f"No location found for {city}.", 404)

        location = locations[0]

        weather_response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "apparent_temperature,"
                    "weather_code,"
                    "wind_speed_10m"
                ),
                "timezone": "auto"
            },
            timeout=REQUEST_TIMEOUT
        )
        weather_response.raise_for_status()

        current = weather_response.json().get("current", {})

        weather_descriptions = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snowfall",
            73: "Moderate snowfall",
            75: "Heavy snowfall",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            95: "Thunderstorm",
            96: "Thunderstorm with hail",
            99: "Severe thunderstorm with hail"
        }

        weather_code = current.get("weather_code")

        return jsonify(
            status="success",
            city=location.get("name"),
            state=location.get("admin1"),
            country=location.get("country"),
            latitude=location.get("latitude"),
            longitude=location.get("longitude"),
            temperature=current.get("temperature_2m"),
            apparent_temperature=current.get("apparent_temperature"),
            humidity=current.get("relative_humidity_2m"),
            wind_speed=current.get("wind_speed_10m"),
            condition=weather_descriptions.get(
                weather_code,
                "Unknown condition"
            ),
            observed_at=current.get("time")
        )

    except requests.RequestException as error:
        return api_error(f"Weather API request failed: {error}")


@app.route("/api/country")
def country():
    country_name = request.args.get("name", "India").strip()

    if not country_name:
        return jsonify(error="Please provide a country name."), 400

    try:
        url = f"https://countries.dev/name/{quote(country_name)}"

        response = requests.get(
            url,
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()

        countries = response.json()

        if not countries:
            return jsonify(error="Country was not found."), 404

        country_data = next(
            (
                item
                for item in countries
                if item.get("name", "").casefold()
                == country_name.casefold()
            ),
            None
        )

        if country_data is None:
            return jsonify(
                error=(
                    "Please enter the complete country name. "
                    f"No exact match found for '{country_name}'."
                )
            ), 404

        currencies = country_data.get("currencies", [])

        if currencies:
            currency = currencies[0]
            currency_text = (
                f"{currency.get('name', 'Unknown')} "
                f"({currency.get('code', 'N/A')})"
            )
        else:
            currency_text = "Not available"

        flags = country_data.get("flags", {})
        flag_url = flags.get("svg") or flags.get("png") or ""

        return jsonify(
            name=country_data.get("name", country_name),
            official_name=country_data.get("name", country_name),
            capital=country_data.get("capital", "Not available"),
            region=country_data.get("region", "Not available"),
            subregion=country_data.get("subregion", "Not available"),
            population=country_data.get("population", 0),
            currency=currency_text,
            flag=flag_url
        ), 200

    except requests.exceptions.HTTPError:
        return jsonify(
            error=f"Country '{country_name}' was not found."
        ), 404

    except requests.exceptions.RequestException as error:
        return jsonify(
            error=f"Country API connection failed: {error}"
        ), 502

@app.route("/api/currency")
def currency():
    source = request.args.get("from", "USD").strip().upper()
    target = request.args.get("to", "INR").strip().upper()

    try:
        amount = float(request.args.get("amount", "1"))
    except ValueError:
        return api_error("Amount must be a valid number.", 400)

    if amount <= 0:
        return api_error("Amount must be greater than zero.", 400)

    if len(source) != 3 or len(target) != 3:
        return api_error("Currency codes must contain three letters.", 400)

    try:
        response = requests.get(
            "https://api.frankfurter.dev/v1/latest",
            params={
                "base": source,
                "symbols": target
            },
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()

        data = response.json()
        rate = (data.get("rates") or {}).get(target)

        if rate is None:
            return api_error(
                f"Exchange rate unavailable for {source} to {target}.",
                404
            )

        converted_amount = round(amount * rate, 2)

        return jsonify(
            status="success",
            date=data.get("date"),
            source_currency=source,
            target_currency=target,
            amount=amount,
            rate=rate,
            converted_amount=converted_amount
        )

    except requests.RequestException as error:
        return api_error(f"Currency API request failed: {error}")


@app.route("/api/nasa")
def nasa():
    nasa_api_key = os.getenv("NASA_API_KEY", "DEMO_KEY")

    try:
        response = requests.get(
            "https://api.nasa.gov/planetary/apod",
            params={
                "api_key": nasa_api_key,
                "thumbs": "true"
            },
            timeout=REQUEST_TIMEOUT
        )
        response.raise_for_status()

        data = response.json()

        if data.get("media_type") == "video":
            display_url = data.get("thumbnail_url")
        else:
            display_url = data.get("url")

        return jsonify(
            status="success",
            title=data.get("title"),
            date=data.get("date"),
            explanation=data.get("explanation"),
            media_type=data.get("media_type"),
            display_url=display_url,
            original_url=data.get("url"),
            hd_url=data.get("hdurl"),
            copyright=data.get("copyright", "NASA/Public domain")
        )

    except requests.RequestException as error:
        return api_error(f"NASA API request failed: {error}")

@app.route("/api/air-quality")
def air_quality():
    city = request.args.get("city", "Nagpur").strip()

    if not city:
        return jsonify(error="Please provide a city name."), 400

    try:
        location_response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            },
            timeout=REQUEST_TIMEOUT
        )
        location_response.raise_for_status()

        locations = location_response.json().get("results", [])

        if not locations:
            return jsonify(
                error=f"City '{city}' was not found."
            ), 404

        location = locations[0]

        air_response = requests.get(
            "https://air-quality-api.open-meteo.com/v1/air-quality",
            params={
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "current": (
                    "us_aqi,pm2_5,pm10,"
                    "nitrogen_dioxide,ozone,uv_index"
                ),
                "timezone": "auto"
            },
            timeout=REQUEST_TIMEOUT
        )
        air_response.raise_for_status()

        current = air_response.json().get("current", {})
        aqi = current.get("us_aqi")

        if aqi is None:
            return jsonify(
                error="Current air-quality data is unavailable."
            ), 502

        if aqi <= 50:
            category = "Good"
            safety_advice = (
                "Air quality is good. Outdoor activity is suitable."
            )
        elif aqi <= 100:
            category = "Moderate"
            safety_advice = (
                "Sensitive people should reduce prolonged "
                "outdoor activity."
            )
        elif aqi <= 150:
            category = "Unhealthy for sensitive groups"
            safety_advice = (
                "Children, older adults and sensitive people "
                "should limit outdoor exertion."
            )
        elif aqi <= 200:
            category = "Unhealthy"
            safety_advice = (
                "Reduce prolonged or heavy outdoor activity."
            )
        elif aqi <= 300:
            category = "Very unhealthy"
            safety_advice = "Avoid strenuous outdoor activity."
        else:
            category = "Hazardous"
            safety_advice = "Remain indoors when possible."

        uv_index = current.get("uv_index")

        if uv_index is None:
            uv_index = 0

        if uv_index < 3:
            uv_advice = "Low UV risk."
        elif uv_index < 6:
            uv_advice = "Use sunscreen when staying outdoors."
        elif uv_index < 8:
            uv_advice = (
                "High UV: use sunscreen, shade and protection."
            )
        else:
            uv_advice = (
                "Very high UV: avoid prolonged direct sunlight."
            )

        return jsonify(
            city=location.get("name", city),
            country=location.get("country", "Unknown"),
            aqi=aqi,
            category=category,
            safety_advice=safety_advice,
            pm2_5=current.get("pm2_5"),
            pm10=current.get("pm10"),
            nitrogen_dioxide=current.get("nitrogen_dioxide"),
            ozone=current.get("ozone"),
            uv_index=uv_index,
            uv_advice=uv_advice,
            observed_at=current.get("time")
        ), 200

    except requests.exceptions.RequestException as error:
        return jsonify(
            error=f"Air-quality API connection failed: {error}"
        ), 502

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8090,
        debug=False
    )
