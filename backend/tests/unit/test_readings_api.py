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
    "cards": [{"position": "today", "card_id": "sun"}],
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
    assert listed[0]["cards"] == [{"position": "today", "card_id": "sun", "reversed": False}]
    assert listed[0]["created_at"]


def test_us13_ac3_wrong_card_count_returns_400_and_saves_nothing(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")
    body = {**DAILY, "spread": "three"}

    response = TestClient(app).post("/api/v1/readings", json=body)

    assert response.status_code == 400
    assert response.json() == {"detail": "此牌陣需要 3 張牌"}
    assert repo.rows == []


@pytest.mark.parametrize(
    ("body", "detail"),
    [
        ({**DAILY, "cards": [{"position": "today", "card_id": "major-22"}]}, "找不到這張牌"),
        ({**DAILY, "cards": [{"position": "today", "card_id": "rider"}]}, "找不到這張牌"),
        ({**DAILY, "cards": [{"position": "past", "card_id": "sun"}]}, "牌的位置與牌陣不符"),
    ],
)
def test_us13_ac4_unknown_card_or_wrong_position_returns_400_and_saves_nothing(
    repo: InMemoryReadingsRepository, body: dict[str, object], detail: str
) -> None:
    sign_in_as("alice")

    response = TestClient(app).post("/api/v1/readings", json=body)

    assert response.status_code == 400
    assert response.json() == {"detail": detail}
    assert repo.rows == []


LENORMAND_NINE = {
    "question": "我的事業接下來會如何發展？",
    "spread": "lenormand-nine",
    "cards": [
        {"position": p, "card_id": c, "reversed": True}
        for p, c in zip(
            [
                "past-mind", "present-mind", "future-mind", "past", "center",
                "future", "past-deep", "present-deep", "future-deep",
            ],
            ["rider", "clover", "ship", "house", "tree", "clouds", "snake", "coffin", "bouquet"],
            strict=True,
        )
    ],
}  # fmt: skip


def test_us13_ac8_lenormand_reading_is_saved_upright(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")

    response = TestClient(app).post("/api/v1/readings", json=LENORMAND_NINE)

    assert response.status_code == 201
    assert len(repo.rows[0].cards) == 9
    assert all(card.reversed is False for card in repo.rows[0].cards)


def test_us13_ac9_duplicate_card_returns_400(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")
    cards = [{"position": p, "card_id": "fool"} for p in ["past", "present", "future"]]

    response = TestClient(app).post(
        "/api/v1/readings", json={**DAILY, "spread": "three", "cards": cards}
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "同一張牌不能出現兩次"}
    assert repo.rows == []


# US-14 紀錄中看到完整解讀與追問


def test_us14_ac1_reading_and_follow_ups_are_saved_and_listed(
    repo: InMemoryReadingsRepository,
) -> None:
    sign_in_as("alice")
    client = TestClient(app)
    reading_id = client.post("/api/v1/readings", json=DAILY).json()["id"]

    client.patch(f"/api/v1/readings/{reading_id}", json={"interpretation": "太陽說……"})
    response = client.patch(
        f"/api/v1/readings/{reading_id}",
        json={
            "suggestions": ["一", "二", "三"],
            "follow_ups": [{"question": "那我該怎麼做？", "answer": "先……"}],
        },
    )

    assert response.status_code == 200
    listed = client.get("/api/v1/readings").json()[0]
    assert listed["interpretation"] == "太陽說……"
    assert listed["suggestions"] == ["一", "二", "三"]
    assert listed["follow_ups"] == [{"question": "那我該怎麼做？", "answer": "先……"}]


def test_us14_ac2_cannot_update_other_users_reading(repo: InMemoryReadingsRepository) -> None:
    sign_in_as("alice")
    client = TestClient(app)
    reading_id = client.post("/api/v1/readings", json=DAILY).json()["id"]

    sign_in_as("bob")
    response = client.patch(f"/api/v1/readings/{reading_id}", json={"interpretation": "竄改"})

    assert response.status_code == 404
    assert response.json() == {"detail": "找不到這筆占卜紀錄"}
    assert repo.rows[0].interpretation is None


@pytest.mark.parametrize(
    "body",
    [
        {"follow_ups": [{"question": f"問{i}", "answer": "答"} for i in range(6)]},
        {"suggestions": ["一", "二", "三", "四"]},
    ],
)
def test_us14_ac3_more_than_five_follow_ups_or_three_suggestions_returns_422(
    repo: InMemoryReadingsRepository, body: dict[str, object]
) -> None:
    sign_in_as("alice")
    client = TestClient(app)
    reading_id = client.post("/api/v1/readings", json=DAILY).json()["id"]

    response = client.patch(f"/api/v1/readings/{reading_id}", json=body)

    assert response.status_code == 422
    assert repo.rows[0].follow_ups == []


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
