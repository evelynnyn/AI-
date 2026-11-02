from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.auth import CurrentUser, get_current_user
from app.main import app
from app.routers.readings import get_readings_repository
from tests.unit.fakes import InMemoryReadingsRepository

DAILY = {
    "question": "今天需要注意什麼？",
    "spread": "daily",
    "cards": [{"position": "今日", "card_id": "major-19"}],
}


@pytest.fixture
def repo() -> Iterator[InMemoryReadingsRepository]:
    repository = InMemoryReadingsRepository()
    app.dependency_overrides[get_readings_repository] = lambda: repository
    yield repository
    app.dependency_overrides.clear()


def sign_in_as(user_id: str) -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=user_id, email=f"{user_id}@example.com", access_token="token"
    )


def test_requires_login() -> None:
    response = TestClient(app).get("/api/v1/readings")

    assert response.status_code == 401
    assert response.json() == {"detail": "請先登入"}


def test_create_then_list(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")
    client = TestClient(app)

    created = client.post("/api/v1/readings", json=DAILY)
    listed = client.get("/api/v1/readings")

    assert created.status_code == 201
    assert created.json()["user_id"] == "alice"
    assert [r["id"] for r in listed.json()] == [created.json()["id"]]


def test_wrong_card_count_returns_400(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")
    body = {**DAILY, "spread": "three_card"}

    response = TestClient(app).post("/api/v1/readings", json=body)

    assert response.status_code == 400
    assert response.json() == {"detail": "此牌陣需要 3 張牌"}


def test_question_over_200_chars_returns_422(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")

    response = TestClient(app).post("/api/v1/readings", json={**DAILY, "question": "問" * 201})

    assert response.status_code == 422


def test_delete_other_users_reading_returns_404(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")
    client = TestClient(app)
    reading_id = client.post("/api/v1/readings", json=DAILY).json()["id"]

    sign_in_as("bob")
    response = client.delete(f"/api/v1/readings/{reading_id}")

    assert response.status_code == 404
    assert len(repo.rows) == 1


def test_unknown_card_id_returns_422(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")
    body = {**DAILY, "cards": [{"position": "今日", "card_id": "major-22"}]}

    response = TestClient(app).post("/api/v1/readings", json=body)

    assert response.status_code == 422
