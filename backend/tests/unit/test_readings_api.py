"""API tests. Each test name starts with the acceptance criterion it checks (GitHub issues)."""

from collections.abc import Iterator
from uuid import uuid4

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


# US-02 輸入問題


def test_us02_ac2_question_of_exactly_200_chars_is_saved(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")

    response = TestClient(app).post("/api/v1/readings", json={**DAILY, "question": "問" * 200})

    assert response.status_code == 201
    assert repo.rows[0].question == "問" * 200


@pytest.mark.parametrize("question", ["", "   ", "\n\t "])
def test_us02_ac3_blank_question_returns_422_and_saves_nothing(
    repo: InMemoryReadingsRepository, question: str
) -> None:
    sign_in_as("alice")

    response = TestClient(app).post("/api/v1/readings", json={**DAILY, "question": question})

    assert response.status_code == 422
    assert repo.rows == []


def test_us02_ac4_question_over_200_chars_returns_422_and_saves_nothing(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")

    response = TestClient(app).post("/api/v1/readings", json={**DAILY, "question": "問" * 201})

    assert response.status_code == 422
    assert repo.rows == []


# US-13 保存占卜


def test_us13_ac1_saved_reading_is_listed_with_its_details(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")
    client = TestClient(app)

    created = client.post("/api/v1/readings", json={**DAILY, "reader": "fool"})
    listed = client.get("/api/v1/readings").json()

    assert created.status_code == 201
    assert len(listed) == 1
    assert listed[0]["id"] == created.json()["id"]
    assert listed[0]["user_id"] == "alice"
    assert listed[0]["question"] == "今天需要注意什麼？"
    assert listed[0]["spread"] == "daily"
    assert listed[0]["reader"] == "fool"
    assert listed[0]["cards"] == [{"position": "今日", "card_id": "major-19", "reversed": False}]
    assert listed[0]["created_at"]


def test_us13_ac3_wrong_card_count_returns_400_and_saves_nothing(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")
    body = {**DAILY, "spread": "three_card"}

    response = TestClient(app).post("/api/v1/readings", json=body)

    assert response.status_code == 400
    assert response.json() == {"detail": "此牌陣需要 3 張牌"}
    assert repo.rows == []


def test_us13_ac4_unknown_card_id_returns_422_and_saves_nothing(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")
    body = {**DAILY, "cards": [{"position": "今日", "card_id": "major-22"}]}

    response = TestClient(app).post("/api/v1/readings", json=body)

    assert response.status_code == 422
    assert repo.rows == []


# US-29 登入


def test_us29_ac8_api_without_login_returns_401() -> None:
    response = TestClient(app).get("/api/v1/readings")

    assert response.status_code == 401
    assert response.json() == {"detail": "請先登入"}


# US-30 刪除占卜紀錄


def test_us30_ac1_deleting_own_reading_removes_it(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")
    client = TestClient(app)
    reading_id = client.post("/api/v1/readings", json=DAILY).json()["id"]

    response = client.delete(f"/api/v1/readings/{reading_id}")

    assert response.status_code == 204
    assert client.get("/api/v1/readings").json() == []


def test_us30_ac3_deleting_other_users_reading_returns_404_and_keeps_it(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")
    client = TestClient(app)
    reading_id = client.post("/api/v1/readings", json=DAILY).json()["id"]

    sign_in_as("bob")
    response = client.delete(f"/api/v1/readings/{reading_id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "找不到這筆占卜紀錄"}
    assert [r.id for r in repo.rows] == [reading_id]


def test_us30_ac4_deleting_missing_reading_returns_404(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")

    response = TestClient(app).delete(f"/api/v1/readings/{uuid4()}")

    assert response.status_code == 404
    assert response.json() == {"detail": "找不到這筆占卜紀錄"}


def test_us30_ac5_non_uuid_id_returns_422(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")

    response = TestClient(app).delete("/api/v1/readings/not-a-uuid")

    assert response.status_code == 422
