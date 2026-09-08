const buttons = document.querySelectorAll("button[data-api]");
let aiTriviaQuestions = [];
let aiTriviaIndex = 0;
let aiTriviaScore = 0;

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
let triviaQuestions = [];
let triviaQuestionIndex = 0;
let triviaScore = 0;

function showTriviaResults() {
    const result = document.getElementById("trivia-result");

    result.className = "result success";
    result.innerHTML = "";

    const title = document.createElement("div");
    title.className = "result-title";
    title.textContent = "Quiz Completed!";

    const score = document.createElement("p");
    score.className = "trivia-final-score";
    score.textContent =
        `Your score: ${triviaScore}/${triviaQuestions.length}`;

    const message = document.createElement("p");

    if (triviaScore === triviaQuestions.length) {
        message.textContent = "Perfect score! Excellent work.";
    } else if (triviaScore >= 3) {
        message.textContent = "Great attempt! You know your entertainment.";
    } else {
        message.textContent = "Good try! Play again and improve your score.";
    }

    const restartButton = document.createElement("button");
    restartButton.type = "button";
    restartButton.className = "trivia-next-button";
    restartButton.textContent = "Play Again";
    restartButton.addEventListener("click", () => {
        document.getElementById("trivia-start-button").click();
    });

    result.append(title, score, message, restartButton);
}

function showTriviaQuestion() {
    if (triviaQuestionIndex >= triviaQuestions.length) {
        showTriviaResults();
        return;
    }

    const result = document.getElementById("trivia-result");
    const item = triviaQuestions[triviaQuestionIndex];

    result.className = "result trivia-active";
    result.innerHTML = "";

    const progress = document.createElement("p");
    progress.className = "trivia-progress";
    progress.textContent =
        `Question ${triviaQuestionIndex + 1} of ${triviaQuestions.length}` +
        ` • Score: ${triviaScore}`;

    const metadata = document.createElement("p");
    metadata.className = "trivia-metadata";
    metadata.textContent =
        `${item.category} • Difficulty: ${item.difficulty}`;

    const question = document.createElement("h3");
    question.className = "trivia-question";
    question.textContent = item.question;

    const answers = document.createElement("div");
    answers.className = "trivia-answers";

    item.answers.forEach((answer) => {
        const answerButton = document.createElement("button");
        answerButton.type = "button";
        answerButton.className = "trivia-answer";
        answerButton.textContent = answer;

        answerButton.addEventListener("click", () => {
            const answerButtons =
                answers.querySelectorAll(".trivia-answer");


            answerButtons.forEach((currentButton) => {
                currentButton.disabled = true;

                if (currentButton.textContent === item.correct_answer) {
                    currentButton.classList.add("correct-answer");
                }
            });

            const feedback = document.createElement("p");
            feedback.className = "trivia-feedback";

            if (answer === item.correct_answer) {
                triviaScore += 1;
                answerButton.classList.add("correct-answer");
                feedback.textContent = "Correct answer!";
            } else {
                answerButton.classList.add("wrong-answer");
                feedback.textContent =
                    `Incorrect. Correct answer: ${item.correct_answer}`;
            }

            const nextButton = document.createElement("button");
            nextButton.type = "button";
            nextButton.className = "trivia-next-button";
            nextButton.textContent =
                triviaQuestionIndex === triviaQuestions.length - 1
                    ? "See Results"
                    : "Next Question";

            nextButton.addEventListener("click", () => {
                triviaQuestionIndex += 1;
                showTriviaQuestion();
            });

            result.append(feedback, nextButton);
        });

        answers.appendChild(answerButton);
    });

    result.append(progress, metadata, question, answers);
}

async function loadTrivia(button) {
    const result = document.getElementById("trivia-result");
    const category =
        document.getElementById("trivia-category").value;

    setLoading(button, result);

    try {
        const data = await getJson(
            `/api/trivia?category=${encodeURIComponent(category)}`
        );

        triviaQuestions = data.questions;
        triviaQuestionIndex = 0;
        triviaScore = 0;

        showTriviaQuestion();
    } catch (error) {
        showError(result, error.message);
    } finally {
        finishLoading(button);
    }
}

function showAITriviaResult() {
    const result = document.getElementById("ai-trivia-result");
    const totalQuestions = aiTriviaQuestions.length;
    const percentage = Math.round(
        (aiTriviaScore / totalQuestions) * 100
    );

    result.replaceChildren();
    result.className = "result success";

    const heading = document.createElement("h3");
    heading.className = "ai-trivia-final-title";
    heading.textContent = "Quiz Completed! / क्विज़ पूर्ण!";
    result.appendChild(heading);

    const score = document.createElement("p");
    score.className = "ai-trivia-final-score";
    score.textContent =
        `Your score: ${aiTriviaScore}/${totalQuestions} (${percentage}%)`;
    result.appendChild(score);

    const message = document.createElement("p");

    if (percentage >= 80) {
        message.textContent =
            "Excellent work! / बहुत बढ़िया!";
    } else if (percentage >= 50) {
        message.textContent =
            "Good effort! Keep learning. / अच्छा प्रयास!";
    } else {
        message.textContent =
            "Keep practising—you will improve! / अभ्यास जारी रखें!";
    }

    result.appendChild(message);

    const playAgainButton = document.createElement("button");
    playAgainButton.type = "button";
    playAgainButton.className = "ai-trivia-next";
    playAgainButton.textContent = "Generate Another Quiz";

    playAgainButton.addEventListener("click", () => {
        document
            .getElementById("ai-trivia-start-button")
            .click();
    });

    result.appendChild(playAgainButton);
}
function selectAITriviaAnswer(selectedIndex) {
    const question = aiTriviaQuestions[aiTriviaIndex];
    const result = document.getElementById("ai-trivia-result");
    const answerButtons = result.querySelectorAll(
        ".ai-trivia-answer"
    );
    const correctIndex = Number(question.correct_index);

    answerButtons.forEach((answerButton, index) => {
        answerButton.disabled = true;

        if (index === correctIndex) {
            answerButton.classList.add("correct");
        } else if (index === selectedIndex) {
            answerButton.classList.add("wrong");
        }
    });

    if (selectedIndex === correctIndex) {
        aiTriviaScore += 1;
    }

    const explanation = document.createElement("div");
    explanation.className = "ai-trivia-explanation";

    const explanationEnglish =
        question.explanation_en || "No explanation available.";
    const explanationHindi =
        question.explanation_hi || "";

    explanation.textContent =
        `${explanationEnglish}\n${explanationHindi}`;
    result.appendChild(explanation);

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "ai-trivia-next";

    const isLastQuestion =
        aiTriviaIndex === aiTriviaQuestions.length - 1;

    nextButton.textContent = isLastQuestion
        ? "View Final Score"
        : "Next Question";

    nextButton.addEventListener("click", () => {
        if (isLastQuestion) {
            showAITriviaResult();
        } else {
            aiTriviaIndex += 1;
            renderAITriviaQuestion();
        }
    });

    result.appendChild(nextButton);
}
function renderAITriviaQuestion() {
    const result = document.getElementById("ai-trivia-result");
    const question = aiTriviaQuestions[aiTriviaIndex];

    result.replaceChildren();
    result.className = "result success";

    const progress = document.createElement("p");
    progress.className = "ai-trivia-progress";
    progress.textContent =
        `Question ${aiTriviaIndex + 1} of ${aiTriviaQuestions.length}` +
        ` | Score: ${aiTriviaScore}`;
    result.appendChild(progress);

    const title = document.createElement("h3");
    title.className = "ai-trivia-question";
    title.textContent =
        `${question.question_en}\n${question.question_hi}`;
    result.appendChild(title);

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "ai-trivia-options";

    question.options_en.forEach((optionEnglish, index) => {
        const optionButton = document.createElement("button");
        optionButton.type = "button";
        optionButton.className = "ai-trivia-answer";

        const optionHindi = question.options_hi[index] || "";
        optionButton.textContent =
            `${index + 1}. ${optionEnglish}\n${optionHindi}`;

        optionButton.addEventListener("click", () => {
            selectAITriviaAnswer(index);
        });

        optionsContainer.appendChild(optionButton);
    });

    result.appendChild(optionsContainer);
}
async function loadAITrivia(button) {
    const result = document.getElementById("ai-trivia-result");
    const topic = document
        .getElementById("ai-trivia-topic")
        .value
        .trim();
    const difficulty = document.getElementById(
        "ai-trivia-difficulty"
    ).value;
    const count = Number(
        document.getElementById("ai-trivia-count").value
    );

    if (!topic) {
        showError(result, "Please enter a quiz topic.");
        return;
    }

    setLoading(button, result);

    try {
        const response = await fetch("/api/ai-trivia", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                topic: topic,
                difficulty: difficulty,
                count: count,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to generate the AI quiz."
            );
        }

        aiTriviaQuestions = data.questions || [];
        aiTriviaIndex = 0;
        aiTriviaScore = 0;

        if (aiTriviaQuestions.length === 0) {
            throw new Error("Gemini returned no quiz questions.");
        }

        renderAITriviaQuestion();
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
        } else if (api === "trivia") {
            loadTrivia(button);
        } else if (api === "nasa") {
            loadNasa(button);
        } else if (api === "ai-trivia") {
            loadAITrivia(button);
        }
    });
});
