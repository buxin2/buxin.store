"""Upsert GM-KIT-* products + gambia marks into Neon without wiping the catalogue."""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_batch, Json

ROOT = Path(__file__).resolve().parent


def load_env() -> str:
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        sys.exit("DATABASE_URL missing. Put it in .env")
    return re.sub(r"[&?]channel_binding=[^&]*", "", url)


def main() -> None:
    text = (ROOT / "js" / "products-data.js").read_text(encoding="utf-8")
    start = text.find("[")
    catalog = json.loads(text[start:].rstrip().rstrip(";"))
    kits = [p for p in catalog if str(p.get("id", "")).startswith("GM-KIT-")]
    if not kits:
        sys.exit("No GM-KIT products found in products-data.js")

    schema = (ROOT / "sql" / "schema.sql").read_text(encoding="utf-8")
    url = load_env()
    print(f"Upserting {len(kits)} Gambia kits…")
    with psycopg2.connect(url, connect_timeout=30) as conn:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute(schema)
            rows = []
            for p in kits:
                images = p.get("images")
                rows.append(
                    (
                        str(p["id"]),
                        str(p.get("name") or ""),
                        str(p.get("title") or p.get("name") or ""),
                        float(p.get("price") or 0),
                        None if p.get("costUsd") in (None, "") else float(p["costUsd"]),
                        str(p.get("priceCurrency") or ""),
                        str(p.get("description") or ""),
                        str(p.get("image") or ""),
                        str(p.get("category") or "General"),
                        Json(images) if images is not None else None,
                    )
                )
            execute_batch(
                cur,
                """
                INSERT INTO products (id, name, title, price, cost_usd, price_currency, description, image, category, images)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name,
                  title = EXCLUDED.title,
                  price = EXCLUDED.price,
                  cost_usd = EXCLUDED.cost_usd,
                  price_currency = EXCLUDED.price_currency,
                  description = EXCLUDED.description,
                  image = EXCLUDED.image,
                  category = EXCLUDED.category,
                  images = EXCLUDED.images,
                  updated_at = now()
                """,
                rows,
                page_size=100,
            )
            ids = [(r[0],) for r in rows]
            execute_batch(
                cur,
                """
                INSERT INTO gambia_products (product_id)
                VALUES (%s)
                ON CONFLICT (product_id) DO NOTHING
                """,
                ids,
                page_size=100,
            )
            cur.execute("SELECT count(*) FROM products WHERE id LIKE 'GM-KIT-%%'")
            count = cur.fetchone()[0]
            cur.execute("SELECT count(*) FROM gambia_products WHERE product_id LIKE 'GM-KIT-%%'")
            gambia = cur.fetchone()[0]
        conn.commit()
    print(f"Done. Neon GM-KIT products={count} gambia marks={gambia}")


if __name__ == "__main__":
    main()
