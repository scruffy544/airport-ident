#!/usr/bin/env python3
"""
AirportIDGear — Batch Mockup-to-Etsy Automation
=================================================

Runs the "attach mockups to Etsy" pipeline for a small batch of airports
at a time, so you can review results before moving on to the next batch.

------------------------------------------------------------------
WHAT THIS DOES NOT DO
------------------------------------------------------------------
This does NOT create or publish Printify/Etsy listings — you still do
that yourself with the Uploader, exactly like now. This script only
takes over the tedious part AFTER a listing already exists: generating
the 7 mockups, hosting them, and attaching them to that listing.

------------------------------------------------------------------
SETUP — do this once
------------------------------------------------------------------
1. Fill in your Printify Personal Access Token below. There is only ONE
   line to edit for this - it starts with PRINTIFY_TOKEN = "" - just
   paste your token between the two quote marks on that line.
   (Same token you paste into the Uploader normally — find it in your
   Printify account under My Profile > Connections.)

2. Make sure this script sits in the same AirportMockups folder as
   generate_mockups.py, with backgrounds/ and ovals/ already set up
   the same way as before.

3. Create a file called batch.csv in this same folder, with one line
   per airport you've ALREADY published via the Uploader:

     code,listing_id
     W48,4543101951
     0N4,4321098765
     23DE,4321098766

   (airport code must match the oval filename in ovals/, e.g. ovals/W48.png)

------------------------------------------------------------------
RUNNING IT
------------------------------------------------------------------
    python3 batch_to_etsy.py

It processes airports from batch.csv in groups of BATCH_SIZE (default
5). After each group, it stops and tells you to review before
continuing — just run the script again to do the next group. Airports
already completed are tracked in processed.log and skipped
automatically, so it's always safe to re-run.
"""

import csv
import base64
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# ------------------------------------------------------------------
# CONFIG — fill this in
# ------------------------------------------------------------------
PRINTIFY_TOKEN = ""  # <-- paste your Printify Personal Access Token between these quotes, nowhere else
ETSY_ROUTE_URL = "https://airportdiagram.com/api/etsy"
BATCH_SIZE = 5

BACKGROUNDS_ORDER = [
    "suitcase", "phone_case", "car_window",
    "truck_window", "binder", "travel_mug", "laptop",
]

BATCH_CSV = Path("batch.csv")
PROCESSED_LOG = Path("processed.log")
OUTPUT_DIR = Path("output")


def http_post_json(url, data, headers):
    body = json.dumps(data).encode("utf-8")
    default_headers = {
        "User-Agent": "AirportIDGear-Uploader/1.0 (+https://airportdiagram.com)",
        "Accept": "application/json",
    }
    default_headers.update(headers)
    req = urllib.request.Request(url, data=body, headers=default_headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            try:
                return json.loads(raw), resp.status
            except json.JSONDecodeError:
                raise RuntimeError(f"Unexpected non-JSON response (status {resp.status}): {raw[:300]!r}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        if not raw.strip():
            raise RuntimeError(
                f"HTTP {e.code} {e.reason} with an empty response body. "
                f"This usually means the request was rejected before reaching the normal API logic — "
                f"most often an invalid/missing token. Double-check PRINTIFY_TOKEN is set to your real token."
            )
        try:
            return json.loads(raw), e.code
        except json.JSONDecodeError:
            raise RuntimeError(f"HTTP {e.code} {e.reason}: {raw[:300]!r}")


def upload_to_printify(image_path):
    """Upload one mockup image to Printify's Media Library via your own
    airportdiagram.com/api/printify proxy (same route your Uploader already
    uses successfully) — this avoids Cloudflare flagging a direct request
    from a home computer as automated traffic."""
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    data, status = http_post_json(
        "https://airportdiagram.com/api/printify",
        {
            "endpoint": "/v1/uploads/images.json",
            "method": "POST",
            "token": PRINTIFY_TOKEN,
            "data": {"file_name": image_path.name, "contents": b64},
        },
        {"Content-Type": "application/json"},
    )
    if status >= 300 or "preview_url" not in data:
        raise RuntimeError(f"Printify upload failed for {image_path.name}: {data}")
    return data["preview_url"]


def attach_to_etsy(listing_id, image_url, rank):
    data, status = http_post_json(
        ETSY_ROUTE_URL,
        {"action": "uploadImage", "listingId": listing_id, "imageUrl": image_url, "rank": rank},
        {"Content-Type": "application/json"},
    )
    if status >= 300:
        raise RuntimeError(f"Etsy attach failed (rank {rank}): {data}")
    return data


def load_processed():
    if not PROCESSED_LOG.exists():
        return set()
    return set(PROCESSED_LOG.read_text().splitlines())


def mark_processed(code):
    with open(PROCESSED_LOG, "a") as f:
        f.write(code + "\n")


def main():
    if not PRINTIFY_TOKEN.strip():
        sys.exit("PRINTIFY_TOKEN is empty — open this script in Notepad, find the ONE line near the "
                  "top starting with 'PRINTIFY_TOKEN = \"\"' and paste your token between those two quote marks.")

    if not BATCH_CSV.exists():
        sys.exit(f"Missing {BATCH_CSV} — create it with 'code,listing_id' rows (see instructions at top of script).")

    rows = []
    with open(BATCH_CSV, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        # Normalize header names in case of stray whitespace
        if reader.fieldnames:
            reader.fieldnames = [h.strip() for h in reader.fieldnames]
        if reader.fieldnames != ["code", "listing_id"]:
            sys.exit(
                f"batch.csv's header row looks wrong.\n"
                f"  Expected first line to read exactly: code,listing_id\n"
                f"  Found instead: {','.join(reader.fieldnames or [])}\n"
                f"Open batch.csv and check the very first line matches exactly."
            )
        for row in reader:
            code = (row.get("code") or "").strip().strip('"')
            listing_id = (row.get("listing_id") or "").strip().strip('"')
            # Recovery: if the whole "code,listing_id" ended up jammed into
            # the code field as one quoted value (common Excel single-cell
            # paste artifact), split it back apart here.
            if not listing_id and "," in code:
                code, _, listing_id = code.rpartition(",")
                code = code.strip().strip('"')
                listing_id = listing_id.strip().strip('"')
            if not code or not listing_id:
                continue  # skip genuinely blank/malformed lines
            rows.append((code, listing_id))

    processed = load_processed()
    todo = [(c, l) for c, l in rows if c not in processed]

    if not todo:
        print("Nothing to do — every airport in batch.csv is already processed.")
        return

    this_batch = todo[:BATCH_SIZE]
    print(f"Processing {len(this_batch)} airport(s) this run "
          f"({len(todo) - len(this_batch)} remaining after this batch)...\n")

    for code, listing_id in this_batch:
        print(f"--- {code} (listing {listing_id}) ---")
        airport_out_dir = OUTPUT_DIR / code

        if not airport_out_dir.exists():
            print(f"  ! No mockups found in {airport_out_dir}/ — "
                  f"run generate_mockups.py first with {code}.png in ovals/. Skipping.")
            continue

        try:
            for rank, bg_name in enumerate(BACKGROUNDS_ORDER, start=2):
                img_path = airport_out_dir / f"{code}_{bg_name}.jpg"
                if not img_path.exists():
                    print(f"  ! Missing {img_path.name}, skipping this background.")
                    continue

                print(f"  Uploading {bg_name} to Printify...")
                public_url = upload_to_printify(img_path)

                print(f"  Attaching {bg_name} to Etsy listing (rank {rank})...")
                attach_to_etsy(listing_id, public_url, rank)

                time.sleep(0.3)  # stay well under Etsy's rate limit

            mark_processed(code)
            print(f"  Done: {code}\n")

        except Exception as e:
            print(f"  ERROR on {code}: {e}")
            print(f"  {code} was NOT marked complete — fix the issue and re-run to retry.\n")

    remaining = len(todo) - len(this_batch)
    print("=" * 50)
    if remaining > 0:
        print(f"Batch complete. {remaining} airport(s) left in batch.csv.")
        print("Review the listings above on Etsy, then run this script again for the next batch.")
    else:
        print("All airports in batch.csv are now processed!")


if __name__ == "__main__":
    main()
