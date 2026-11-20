"""
Migrate Buxin Store catalogue + settings into Neon Postgres.
Reads DATABASE_URL from .env. Never commits secrets.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_batch, Json

ROOT = Path(__file__).resolve().parent
BATCH = 200


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
    # psycopg2 can choke on channel_binding=require
    url = re.sub(r"[&?]channel_binding=[^&]*", "", url)
    return url


def js_literal_to_json(raw: str):
    text = re.sub(r"/\*[\s\S]*?\*/", "", raw)
    text = re.sub(r"//.*?$", "", text, flags=re.M)
    text = re.sub(r"([{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', text)
    text = text.replace("'", '"')
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return json.loads(text)


def parse_js_assign(path: Path, name: str):
    text = path.read_text(encoding="utf-8")
    match = re.search(rf"window\.{re.escape(name)}\s*=\s*", text)
    if not match:
        sys.exit(f"Could not parse {name} from {path}")
    rest = text[match.end():].lstrip()
    try:
        return json.JSONDecoder().raw_decode(rest)[0]
    except json.JSONDecodeError:
        # JS object literals (unquoted keys / comments), e.g. config.js
        end = rest.rfind("};")
        if end == -1:
            end = rest.rfind("];")
        if end == -1:
            sys.exit(f"Could not find end of {name} in {path}")
        return js_literal_to_json(rest[: end + 1])


def connect(url: str):
    return psycopg2.connect(url, connect_timeout=30)


def main() -> None:
    url = load_env()
    products = parse_js_assign(ROOT / "js" / "products-data.js", "CATALOG_PRODUCTS")
    store = parse_js_assign(ROOT / "js" / "store-data.js", "STORE_DATA")
    config = parse_js_assign(ROOT / "js" / "config.js", "STORE_CONFIG")
    schema = (ROOT / "sql" / "schema.sql").read_text(encoding="utf-8")

    settings = {**(store.get("settings") or {}), **{k: config[k] for k in (
        "currency", "currencyLocale", "usdToInr", "inrToGmd", "priceMarkup"
    ) if k in config}}
    rules = store.get("priceRules") or {}
    overrides = rules.get("overrides") or {}
    gambia_ids = [str(x) for x in (store.get("gambiaIds") or [])]

    print(f"Connecting… products={len(products)} overrides={len(overrides)} gambia={len(gambia_ids)}")
    with connect(url) as conn:
        conn.autocommit = False
        with conn.cursor() as cur:
            cur.execute(schema)
            cur.execute("DELETE FROM gambia_products")
            cur.execute("DELETE FROM product_price_overrides")
            cur.execute("DELETE FROM products")
            cur.execute("DELETE FROM store_settings")

            cur.execute(
                """
                INSERT INTO store_settings (
                  id, store_name, whatsapp_number, cloudinary_cloud_name, cloudinary_upload_preset,
                  currency, currency_locale, usd_to_inr, inr_to_gmd, price_markup, shipping_fee,
                  price_factor, price_offset, price_last_operation, price_last_amount, updated_at
                ) VALUES (
                  1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now()
                )
                """,
                (
                    settings.get("storeName") or config.get("storeName") or "Buxin Store",
                    re.sub(r"\D", "", str(settings.get("whatsappNumber") or config.get("whatsappNumber") or "")),
                    settings.get("cloudinaryCloudName") or config.get("cloudinaryCloudName") or "",
                    settings.get("cloudinaryUploadPreset") or config.get("cloudinaryUploadPreset") or "",
                    config.get("currency") or "GMD",
                    config.get("currencyLocale") or "en-GM",
                    float(config.get("usdToInr") or 88),
                    float(config.get("inrToGmd") or 0.8003321),
                    float(config.get("priceMarkup") or 1),
                    float(store.get("shippingFee") or 0),
                    float(rules.get("factor") or 1),
                    float(rules.get("offset") or 0),
                    str(rules.get("lastOperation") or ""),
                    None if rules.get("lastAmount") in (None, "") else float(rules.get("lastAmount")),
                ),
            )

            rows = []
            for p in products:
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
                """,
                rows,
                page_size=BATCH,
            )
            print(f"Inserted {len(rows)} products")

            product_ids = {r[0] for r in rows}
            override_rows = [
                (str(pid), float(price))
                for pid, price in overrides.items()
                if str(pid) in product_ids and price is not None
            ]
            if override_rows:
                execute_batch(
                    cur,
                    "INSERT INTO product_price_overrides (product_id, price_gmd) VALUES (%s, %s)",
                    override_rows,
                    page_size=BATCH,
                )
            print(f"Inserted {len(override_rows)} price overrides")

            gambia_rows = [(pid,) for pid in gambia_ids if pid in product_ids]
            if gambia_rows:
                execute_batch(
                    cur,
                    "INSERT INTO gambia_products (product_id) VALUES (%s)",
                    gambia_rows,
                    page_size=BATCH,
                )
            print(f"Inserted {len(gambia_rows)} Gambia marks")

            cur.execute("SELECT count(*) FROM products")
            count = cur.fetchone()[0]
            cur.execute("SELECT store_name, whatsapp_number FROM store_settings WHERE id=1")
            store_name, whatsapp = cur.fetchone()
        conn.commit()

    print(f"Done. Neon products={count} store={store_name!r} whatsapp={whatsapp}")


if __name__ == "__main__":
    main()
