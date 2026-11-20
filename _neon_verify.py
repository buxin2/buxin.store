from pathlib import Path
import os, re, psycopg2

for line in Path(".env").read_text(encoding="utf-8").splitlines():
    if line.startswith("DATABASE_URL="):
        os.environ["DATABASE_URL"] = line.split("=", 1)[1].strip()
url = re.sub(r"[&?]channel_binding=[^&]*", "", os.environ["DATABASE_URL"])
with psycopg2.connect(url) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM products")
        print("products", cur.fetchone()[0])
        cur.execute("SELECT count(*) FROM products WHERE cost_usd IS NOT NULL")
        print("with_cost", cur.fetchone()[0])
        cur.execute("SELECT count(*) FROM products WHERE coalesce(image,'') <> ''")
        print("with_image", cur.fetchone()[0])
        cur.execute("SELECT store_name, whatsapp_number, shipping_fee, currency FROM store_settings")
        print("settings", cur.fetchone())
