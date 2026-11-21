"""Push current store-data.js settings into Neon store_settings."""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

import psycopg2

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
        sys.exit("DATABASE_URL missing")
    return re.sub(r"[&?]channel_binding=[^&]*", "", url)


def main() -> None:
    text = (ROOT / "js" / "store-data.js").read_text(encoding="utf-8")
    data = json.loads(text.replace("window.STORE_DATA =", "", 1).strip().rstrip(";"))
    settings = data.get("settings") or {}
    rules = data.get("priceRules") or {}
    number = re.sub(r"\D", "", str(settings.get("whatsappNumber") or ""))
    with psycopg2.connect(load_env(), connect_timeout=30) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE store_settings SET
                  store_name = %s,
                  whatsapp_number = %s,
                  cloudinary_cloud_name = %s,
                  cloudinary_upload_preset = %s,
                  shipping_fee = %s,
                  price_factor = %s,
                  price_offset = %s,
                  price_last_operation = %s,
                  price_last_amount = %s,
                  updated_at = now()
                WHERE id = 1
                """,
                (
                    settings.get("storeName") or "Buxin Store",
                    number,
                    settings.get("cloudinaryCloudName") or "",
                    settings.get("cloudinaryUploadPreset") or "",
                    float(data.get("shippingFee") or 0),
                    float(rules.get("factor") or 1),
                    float(rules.get("offset") or 0),
                    str(rules.get("lastOperation") or ""),
                    None if rules.get("lastAmount") in (None, "") else float(rules.get("lastAmount")),
                ),
            )
            print("updated", cur.rowcount, "whatsapp=", number)
        conn.commit()


if __name__ == "__main__":
    main()
