import pytest

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.test_client() as test_client:
        yield test_client


def test_dashboard_page(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"DevOps Live API Dashboard" in response.data
    assert b"Air Quality" in response.data
    assert b"GitHub Actions" in response.data
    assert b"NASA Astronomy" in response.data


def test_health_endpoint(client):
    response = client.get("/health")
    data = response.get_json()

    assert response.status_code == 200
    assert data["status"] == "healthy"
    assert data["application"] == "devops-live-api-dashboard"
    assert data["port"] == 8090


def test_air_quality_requires_valid_city(client, monkeypatch):
    class EmptyLocationResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"results": []}

    def mock_get(*args, **kwargs):
        return EmptyLocationResponse()

    monkeypatch.setattr("app.requests.get", mock_get)

    response = client.get("/api/air-quality?city=InvalidTestCity")
    data = response.get_json()

    assert response.status_code == 404
    assert "not found" in data["error"].lower()


def test_country_requires_name(client):
    response = client.get("/api/country?name=")
    data = response.get_json()

    assert response.status_code == 400
    assert "country name" in data["error"].lower()

def test_trivia_interface_is_on_dashboard(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"Entertainment Trivia Challenge" in response.data
    assert b'trivia-category' in response.data
    assert b'trivia-result' in response.data


def test_trivia_returns_five_questions(client, monkeypatch):
    class TriviaResponse:
        def raise_for_status(self):
            return None

        def json(self):
            question = {
                "category": "Entertainment: Film",
                "difficulty": "easy",
                "question": "Which actor&#039;s movie is this?",
                "correct_answer": "Tom &amp; Jerry",
                "incorrect_answers": [
                    "Option A",
                    "Option B",
                    "Option C",
                ],
            }

            return {
                "response_code": 0,
                "results": [question.copy() for _ in range(5)],
            }

    def mock_get(url, **kwargs):
        assert url == "https://opentdb.com/api.php"
        assert kwargs["params"]["amount"] == 5
        assert kwargs["params"]["category"] == 11
        assert kwargs["params"]["type"] == "multiple"
        return TriviaResponse()

    monkeypatch.setattr("app.requests.get", mock_get)

    response = client.get("/api/trivia?category=film")
    data = response.get_json()

    assert response.status_code == 200
    assert data["status"] == "success"
    assert data["selected_category"] == "film"
    assert data["count"] == 5
    assert len(data["questions"]) == 5

    first_question = data["questions"][0]

    assert first_question["question"] == "Which actor's movie is this?"
    assert first_question["correct_answer"] == "Tom & Jerry"
    assert len(first_question["answers"]) == 4
    assert "Tom & Jerry" in first_question["answers"]


def test_trivia_rejects_invalid_category(client):
    response = client.get("/api/trivia?category=invalid")
    data = response.get_json()

    assert response.status_code == 400
    assert data["status"] == "error"
    assert "invalid trivia category" in data["message"].lower()
