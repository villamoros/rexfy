from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.conftest import company, register

PET: dict[str, Any] = {
    "category": "plastic",
    "title": "Plástico PET post-industrial grado alimenticio",
    "description": "Material transparente, limpio y separado.",
    "condition": "clean_separated",
    "is_recurring": True,
    "quantity": 4.5,
    "quantity_unit": "t",
    "min_order_quantity": 1,
    "availability": "immediate",
    "city": "Bogotá D.C.",
    "pricing_type": "paid",
    "price": 850,
    "price_unit": "kg",
    "price_negotiable": True,
}


@pytest.fixture
def generator(client: TestClient) -> tuple[dict[str, str], str]:
    headers = register(client, "gen@example.com")
    return headers, company(client, headers, ["generator"], "900100200")


def create(client: TestClient, headers: dict[str, str], company_id: str, **overrides: Any) -> dict:
    response = client.post(
        "/listings", json={**PET, "company_id": company_id, **overrides}, headers=headers
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_publish_and_find(client: TestClient, generator: tuple[dict[str, str], str]) -> None:
    headers, company_id = generator
    listing = create(client, headers, company_id)
    assert listing["status"] == "draft"
    assert listing["quantity"] == 4.5
    assert listing["company"]["id"] == company_id

    # Drafts are invisible to the marketplace and to outsiders.
    assert client.get("/listings").json()["total"] == 0
    assert client.get(f"/listings/{listing['id']}").status_code == 404
    assert client.get(f"/listings/{listing['id']}", headers=headers).status_code == 200

    published = client.post(f"/listings/{listing['id']}/publish", headers=headers)
    assert published.status_code == 200
    assert published.json()["published_at"] is not None
    assert client.post(f"/listings/{listing['id']}/publish", headers=headers).status_code == 409

    page = client.get("/listings").json()
    assert page["total"] == 1
    assert page["items"][0]["title"] == PET["title"]
    assert client.get(f"/listings/{listing['id']}").status_code == 200


def test_only_generator_members_can_create(
    client: TestClient, generator: tuple[dict[str, str], str]
) -> None:
    _, gen_company = generator
    buyer = register(client, "buyer@example.com")
    buyer_company = company(client, buyer, ["buyer"], "800200300")

    assert (
        client.post(
            "/listings", json={**PET, "company_id": buyer_company}, headers=buyer
        ).status_code
        == 403
    )
    assert (
        client.post("/listings", json={**PET, "company_id": gen_company}, headers=buyer).status_code
        == 403
    )
    assert client.post("/listings", json={**PET, "company_id": gen_company}).status_code == 401


def test_outsider_cannot_edit_or_archive(
    client: TestClient, generator: tuple[dict[str, str], str]
) -> None:
    headers, company_id = generator
    listing = create(client, headers, company_id)
    client.post(f"/listings/{listing['id']}/publish", headers=headers)
    other = register(client, "otro@example.com")
    company(client, other, ["generator"], "800300400")

    assert (
        client.patch(
            f"/listings/{listing['id']}", json={"title": "Hackeado"}, headers=other
        ).status_code
        == 403
    )
    assert client.post(f"/listings/{listing['id']}/archive", headers=other).status_code == 403


@pytest.mark.parametrize(
    "overrides",
    [
        {"pricing_type": "paid", "price": None},
        {"min_order_quantity": 10},
        {"availability": "specific_date"},
        {"quantity": 0},
        {"title": "PET"},
    ],
)
def test_rejects_inconsistent_terms(
    client: TestClient, generator: tuple[dict[str, str], str], overrides: dict[str, Any]
) -> None:
    headers, company_id = generator
    response = client.post(
        "/listings", json={**PET, "company_id": company_id, **overrides}, headers=headers
    )
    assert response.status_code == 422


def test_free_listing_drops_price(
    client: TestClient, generator: tuple[dict[str, str], str]
) -> None:
    headers, company_id = generator
    listing = create(client, headers, company_id, pricing_type="free")
    assert listing["price"] is None
    assert listing["price_unit"] is None


def test_update_and_archive(client: TestClient, generator: tuple[dict[str, str], str]) -> None:
    headers, company_id = generator
    listing = create(client, headers, company_id)
    lid = listing["id"]

    updated = client.patch(f"/listings/{lid}", json={"quantity": 6, "title": None}, headers=headers)
    assert updated.status_code == 200
    assert updated.json()["quantity"] == 6
    assert updated.json()["title"] == PET["title"]

    bad = client.patch(f"/listings/{lid}", json={"min_order_quantity": 100}, headers=headers)
    assert bad.status_code == 422
    assert client.get(f"/listings/{lid}", headers=headers).json()["min_order_quantity"] == 1

    client.post(f"/listings/{lid}/publish", headers=headers)
    assert client.post(f"/listings/{lid}/archive", headers=headers).json()["status"] == "archived"
    assert client.get("/listings").json()["total"] == 0
    assert (
        client.patch(f"/listings/{lid}", json={"quantity": 1}, headers=headers).status_code == 409
    )

    mine = client.get("/me/listings", headers=headers).json()
    assert [m["status"] for m in mine] == ["archived"]


def test_search_treats_wildcards_literally(
    client: TestClient, generator: tuple[dict[str, str], str]
) -> None:
    headers, company_id = generator
    create(client, headers, company_id, publish=True, title="PET 100% reciclado")
    create(client, headers, company_id, publish=True, title="PET 1000 kg")
    found = client.get("/listings", params={"q": "100%"}).json()
    assert [i["title"] for i in found["items"]] == ["PET 100% reciclado"]


def test_search_filters(client: TestClient, generator: tuple[dict[str, str], str]) -> None:
    headers, company_id = generator
    rows = [
        {},
        {
            "category": "metal",
            "title": "Viruta de aluminio 6061",
            "city": "Medellín",
            "price": 1200,
            "availability": "this_week",
            "is_recurring": False,
        },
        {
            "category": "paper_cardboard",
            "title": "Cartón OCC compactado",
            "city": "Barranquilla",
            "pricing_type": "free",
        },
    ]
    for overrides in rows:
        lid = create(client, headers, company_id, **overrides)["id"]
        client.post(f"/listings/{lid}/publish", headers=headers)

    def titles(**params: Any) -> list[str]:
        return [i["title"] for i in client.get("/listings", params=params).json()["items"]]

    assert len(titles()) == 3
    assert titles(category=["metal", "paper_cardboard"], sort="price_asc") == [
        "Cartón OCC compactado",
        "Viruta de aluminio 6061",
    ]
    assert titles(q="aluminio") == ["Viruta de aluminio 6061"]
    assert titles(city="medell") == ["Viruta de aluminio 6061"]
    assert titles(pricing_type="free") == ["Cartón OCC compactado"]
    assert titles(availability=["this_week"]) == ["Viruta de aluminio 6061"]
    assert set(titles(recurring=True)) == {PET["title"], "Cartón OCC compactado"}
    page = client.get("/listings", params={"limit": 1, "offset": 1}).json()
    assert page["total"] == 3
    assert len(page["items"]) == 1


def test_create_and_publish_in_one_step(
    client: TestClient, generator: tuple[dict[str, str], str]
) -> None:
    headers, company_id = generator
    listing = create(client, headers, company_id, publish=True)
    assert listing["status"] == "published"
    assert listing["published_at"] is not None
    assert client.get(f"/listings/{listing['id']}").status_code == 200

    # A rejected listing leaves no draft behind.
    bad = client.post(
        "/listings",
        json={**PET, "company_id": company_id, "min_order_quantity": 10, "publish": True},
        headers=headers,
    )
    assert bad.status_code == 422
    assert [i["id"] for i in client.get("/me/listings", headers=headers).json()] == [listing["id"]]


PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def test_listing_photos(client: TestClient, generator: tuple[dict[str, str], str]) -> None:
    headers, company_id = generator
    listing = create(client, headers, company_id, publish=True)
    path = f"/listings/{listing['id']}/images"

    uploaded = client.post(
        path,
        files=[("files", ("a.png", PNG, "image/png")), ("files", ("b.png", PNG, "image/png"))],
        headers=headers,
    )
    assert uploaded.status_code == 201, uploaded.text
    images = uploaded.json()["images"]
    assert len(images) == 2
    served = client.get(images[0]["url"].removeprefix("http://localhost:8000"))
    assert served.status_code == 200
    assert served.content == PNG

    # Only real images, only the listing's company, at most six.
    fake = client.post(path, files=[("files", ("x.png", b"<svg/>", "image/png"))], headers=headers)
    assert fake.status_code == 422
    stranger = register(client, "otro@example.com")
    assert (
        client.post(
            path, files=[("files", ("a.png", PNG, "image/png"))], headers=stranger
        ).status_code
        == 403
    )
    too_many = client.post(
        path, files=[("files", (f"{i}.png", PNG, "image/png")) for i in range(5)], headers=headers
    )
    assert too_many.status_code == 422

    removed = client.delete(f"{path}/{images[0]['id']}", headers=headers)
    assert [i["id"] for i in removed.json()["images"]] == [images[1]["id"]]
    assert client.get(images[0]["url"].removeprefix("http://localhost:8000")).status_code == 404
