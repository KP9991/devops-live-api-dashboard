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
