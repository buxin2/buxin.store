"""
Upload assets/products to Cloudinary and rewrite js/products-data.js image URLs.
Credentials come from environment only. Never commit secrets.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
PRODUCTS_JS = ROOT / "js" / "products-data.js"
ASSETS = ROOT / "assets" / "products"
STATE_PATH = ROOT / "_cloudinary_migrate_state.json"
LOG_PATH = ROOT / "_cloudinary_migrate.log"

def load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_dotenv()
CLOUD = os.environ.get("CLOUDINARY_CLOUD_NAME", "").strip()
API_KEY = os.environ.get("CLOUDINARY_API_KEY", "").strip()
API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "").strip()
FOLDER = os.environ.get("CLOUDINARY_FOLDER", "buxin-store").strip() or "buxin-store"


def log(msg: str) -> None:
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    print(line, flush=True)
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"uploads": {}, "failed": {}}


def save_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def load_products() -> list:
    text = PRODUCTS_JS.read_text(encoding="utf-8")
    start = text.find("[")
    end = text.rfind("]")
    if start < 0 or end < 0:
        raise SystemExit("Could not find products array in products-data.js")
    return json.loads(text[start : end + 1])


def write_products(products: list) -> None:
    payload = json.dumps(products, ensure_ascii=False, separators=(",", ":"))
    PRODUCTS_JS.write_text(
        "window.CATALOG_PRODUCTS = " + payload + ";\n",
        encoding="utf-8",
    )


def sign(params: dict) -> str:
    items = [f"{k}={params[k]}" for k in sorted(params) if params[k] is not None and params[k] != ""]
    to_sign = "&".join(items) + API_SECRET
    return hashlib.sha1(to_sign.encode("utf-8")).hexdigest()


def upload_file(path: Path, public_id: str, state: dict) -> str:
    if public_id in state["uploads"]:
        return state["uploads"][public_id]

    timestamp = str(int(time.time()))
    params = {
        "timestamp": timestamp,
        "folder": FOLDER,
        "public_id": public_id,
        "overwrite": "true",
        "unique_filename": "false",
        "use_filename": "false",
    }
    signature = sign(params)
    data = {
        **params,
        "api_key": API_KEY,
        "signature": signature,
    }
    url = f"https://api.cloudinary.com/v1_1/{CLOUD}/image/upload"
    for attempt in range(1, 6):
        with path.open("rb") as fh:
            files = {"file": (path.name, fh)}
            resp = requests.post(url, data=data, files=files, timeout=120)
        if resp.status_code == 200:
            secure = resp.json()["secure_url"]
            state["uploads"][public_id] = secure
            state["failed"].pop(public_id, None)
            save_state(state)
            return secure
        if resp.status_code in (420, 429, 500, 502, 503, 504):
            wait = min(60, 2 ** attempt * 2)
            log(f"retry {attempt}/5 for {path.name}: HTTP {resp.status_code}, wait {wait}s")
            time.sleep(wait)
            continue
        detail = resp.text[:300]
        raise RuntimeError(f"Upload failed for {path.name}: HTTP {resp.status_code} {detail}")
    raise RuntimeError(f"Upload failed after retries for {path.name}")


def basename_public_id(filename: str) -> str:
    stem = Path(filename).stem
    # Keep Cloudinary public_id path-safe
    return stem.replace(" ", "_")


def main() -> None:
    if not (CLOUD and API_KEY and API_SECRET):
        raise SystemExit(
            "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the environment."
        )

    products = load_products()
    state = load_state()
    log(f"Cloud={CLOUD} folder={FOLDER} products={len(products)} already_uploaded={len(state['uploads'])}")

    needed: dict[str, Path] = {}
    missing_files = []
    for product in products:
        image = str(product.get("image") or "").strip()
        if not image:
            continue
        if image.startswith("http://") or image.startswith("https://"):
            continue
        name = Path(image).name
        local = ASSETS / name
        if not local.exists():
            # try case-insensitive match
            matches = [p for p in ASSETS.iterdir() if p.is_file() and p.name.lower() == name.lower()]
            if matches:
                local = matches[0]
            else:
                missing_files.append(image)
                continue
        public_id = basename_public_id(local.name)
        needed[public_id] = local

    log(f"files_to_ensure={len(needed)} missing_local={len(missing_files)}")

    uploaded = 0
    for i, (public_id, path) in enumerate(needed.items(), 1):
        if public_id in state["uploads"]:
            continue
        try:
            url = upload_file(path, public_id, state)
            uploaded += 1
            if uploaded % 25 == 0 or i == len(needed):
                log(f"progress {i}/{len(needed)} newly_uploaded={uploaded} url_ok={bool(url)}")
            time.sleep(0.15)
        except Exception as exc:
            state["failed"][public_id] = str(exc)
            save_state(state)
            log(f"FAILED {path.name}: {exc}")

    # Rewrite catalog URLs
    changed = 0
    for product in products:
        image = str(product.get("image") or "").strip()
        if not image or image.startswith("http://") or image.startswith("https://"):
            continue
        name = Path(image).name
        public_id = basename_public_id(name)
        url = state["uploads"].get(public_id)
        if not url:
            # try matching by existing local filename stem variations
            local = ASSETS / name
            if local.exists():
                url = state["uploads"].get(basename_public_id(local.name))
        if url:
            product["image"] = url
            changed += 1

    write_products(products)
    log(f"done newly_uploaded={uploaded} catalog_images_updated={changed} failed={len(state['failed'])}")
    if state["failed"]:
        log("Some uploads failed. Re-run the script to retry failures.")
        sys.exit(2)


if __name__ == "__main__":
    main()
