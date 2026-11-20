"""
Pull catalogue + settings from Neon into local static JS files for GitHub Pages.
Reads DATABASE_URL from .env. Never commits secrets.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor

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
    url = load_env()
    with psycopg2.connect(url, connect_timeout=30) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM store_settings WHERE id=1")
            settings_row = cur.fetchone()
            if not settings_row:
                sys.exit("No store_settings row in Neon. Run _neon_migrate.py first.")
            cur.execute(
                """
                SELECT id, name, title, price, cost_usd, description, image, category, images
                FROM products
                ORDER BY category, name, id
                """
            )
            products = cur.fetchall()
            cur.execute("SELECT product_id, price_gmd FROM product_price_overrides")
            overrides = {r["product_id"]: float(r["price_gmd"]) for r in cur.fetchall()}
            cur.execute("SELECT product_id FROM gambia_products ORDER BY product_id")
            gambia_ids = [r["product_id"] for r in cur.fetchall()]

    catalog = []
    for p in products:
        item = {
            "id": p["id"],
            "name": p["name"],
            "title": p["title"] or p["name"],
            "price": float(p["price"] or 0),
            "description": p["description"] or "",
            "image": p["image"] or "",
            "category": p["category"] or "General",
        }
        if p["cost_usd"] is not None:
            item["costUsd"] = float(p["cost_usd"])
        if p["images"] is not None:
            item["images"] = p["images"]
        catalog.append(item)

    store_data = {
        "version": 1,
        "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "settings": {
            "storeName": settings_row["store_name"],
            "whatsappNumber": settings_row["whatsapp_number"],
            "cloudinaryCloudName": settings_row["cloudinary_cloud_name"],
            "cloudinaryUploadPreset": settings_row["cloudinary_upload_preset"],
        },
        "shippingFee": float(settings_row["shipping_fee"] or 0),
        "priceRules": {
            "factor": float(settings_row["price_factor"] or 1),
            "offset": float(settings_row["price_offset"] or 0),
            "overrides": overrides,
            "lastOperation": settings_row["price_last_operation"] or "",
            "lastAmount": None
            if settings_row["price_last_amount"] is None
            else float(settings_row["price_last_amount"]),
        },
        "gambiaIds": gambia_ids,
    }

    products_path = ROOT / "js" / "products-data.js"
    store_path = ROOT / "js" / "store-data.js"
    products_path.write_text(
        "window.CATALOG_PRODUCTS = " + json.dumps(catalog, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    store_path.write_text(
        "window.STORE_DATA = " + json.dumps(store_data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )

    # Keep public WhatsApp / Cloudinary / rates in config in sync (password stays local-only intent).
    config_path = ROOT / "js" / "config.js"
    config_text = config_path.read_text(encoding="utf-8")
    replacements = {
        "storeName": settings_row["store_name"],
        "whatsappNumber": settings_row["whatsapp_number"],
        "cloudinaryCloudName": settings_row["cloudinary_cloud_name"],
        "cloudinaryUploadPreset": settings_row["cloudinary_upload_preset"],
        "currency": settings_row["currency"],
        "currencyLocale": settings_row["currency_locale"],
        "usdToInr": settings_row["usd_to_inr"],
        "inrToGmd": settings_row["inr_to_gmd"],
        "priceMarkup": settings_row["price_markup"],
    }
    for key, value in replacements.items():
        if isinstance(value, str):
            config_text = re.sub(
                rf"({key}\s*:\s*)(?:\"[^\"]*\"|'[^']*')",
                rf'\1"{value}"',
                config_text,
                count=1,
            )
        else:
            config_text = re.sub(
                rf"({key}\s*:\s*)-?\d+(?:\.\d+)?",
                rf"\1{value}",
                config_text,
                count=1,
            )
    config_path.write_text(config_text, encoding="utf-8")

    print(f"Pulled {len(catalog)} products, {len(overrides)} overrides, {len(gambia_ids)} Gambia marks")
    print(f"Wrote {products_path.name}, {store_path.name}, and synced {config_path.name}")


if __name__ == "__main__":
    main()
