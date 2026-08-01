#!/usr/bin/env python3
"""
AirportIDGear — Batch Mockup Compositing Script
=================================================

Takes any airport's oval sticker PNG and stamps it onto all 7 lifestyle
mockup backgrounds (suitcase, phone case, car window, truck window,
binder, travel mug, laptop) at the exact position/size/rotation you
locked in when placing the oval in Canva.

------------------------------------------------------------------
SETUP — do this once
------------------------------------------------------------------
1. In each Canva design, DELETE the AI-generated placeholder oval,
   then export the clean background as a PNG. Save each one into
   the `backgrounds/` folder using these exact filenames:

     backgrounds/suitcase.png
     backgrounds/phone_case.png
     backgrounds/car_window.png
     backgrounds/truck_window.png
     backgrounds/binder.png
     backgrounds/travel_mug.png
     backgrounds/laptop.png

   (If you export at a different resolution than Canva's default,
   that's fine — the script scales the cm coordinates to whatever
   pixel size the PNG actually is.)

2. Put your airport oval PNGs (transparent background, oval artwork)
   into an `ovals/` folder. Filename = airport code, e.g. `DE29.png`,
   `BGM.png`, `BQK.png`, etc.

3. Run:
     pip install pillow --break-system-packages   (if not installed)
     python3 generate_mockups.py

   Output goes to `output/<AIRPORT_CODE>/<AIRPORT_CODE>_<background>.jpg`
   — one JPEG per airport per background (7 files per airport).

------------------------------------------------------------------
SKIPPING ALREADY-DONE OVALS
------------------------------------------------------------------
As your ovals/ folder grows, re-generating every single oval every
time gets slow and pointless for ones you already finished. This
version automatically SKIPS any oval whose output/<CODE>/ folder
already has all 7 mockup JPGs in it — so you can just leave every
oval you've ever made sitting in ovals/ permanently, and each run
only processes whatever's actually new.

If you ever need to force-regenerate one (say, after fixing a
background), just delete that airport's folder from output/ first,
and it'll be picked up as "new" again.

------------------------------------------------------------------
HOW THE COORDINATES WORK
------------------------------------------------------------------
All 7 Canva designs were created as "poster" type, which uses a fixed
canvas of 42.0 x 59.4 cm (A2). The X/Y/Width/Height/Rotation numbers
below are exactly what Canva's Position panel showed after placing an
oval on each design. The script converts those cm values into pixels
based on the actual size of the background PNG you export, so it
doesn't matter what resolution you export at.
"""

from pathlib import Path
from PIL import Image
import sys

# ------------------------------------------------------------------
# BACKGROUND CONFIG — one entry per mockup, coordinates from Canva
# ------------------------------------------------------------------
CANVAS_WIDTH_CM = 42.0
CANVAS_HEIGHT_CM = 59.4

BACKGROUNDS = [
    {
        "name": "suitcase",
        "file": "suitcase.png",
        "x_cm": 16.81, "y_cm": 29.7,
        "w_cm": 8.37, "h_cm": 5.86,
        "rotation_deg": 0,
    },
    {
        "name": "phone_case",
        "file": "phone_case.png",
        "x_cm": 13.54, "y_cm": 22.65,
        "w_cm": 15.6, "h_cm": 10.92,
        "rotation_deg": 0,
    },
    {
        "name": "car_window",
        "file": "car_window.png",
        "x_cm": 14.53, "y_cm": 25.36,
        "w_cm": 11.92, "h_cm": 8.35,
        "rotation_deg": 7.8,
    },
    {
        "name": "truck_window",
        "file": "truck_window.png",
        "x_cm": 4.2, "y_cm": 22.47,
        "w_cm": 7.44, "h_cm": 5.21,
        "rotation_deg": 0,
    },
    {
        "name": "binder",
        "file": "binder.png",
        "x_cm": 13.2, "y_cm": 23.02,
        "w_cm": 18.03, "h_cm": 12.62,
        "rotation_deg": 0,
    },
    {
        "name": "travel_mug",
        "file": "travel_mug.png",
        "x_cm": 14.07, "y_cm": 21.68,
        "w_cm": 14.63, "h_cm": 10.24,
        "rotation_deg": 0,
    },
    {
        "name": "laptop",
        "file": "laptop.png",
        "x_cm": 13.36, "y_cm": 26.79,
        "w_cm": 15.69, "h_cm": 11.78,
        "rotation_deg": 0,
    },
]

BACKGROUNDS_DIR = Path("backgrounds")
OVALS_DIR = Path("ovals")
OUTPUT_DIR = Path("output")


def composite_oval_on_background(bg_path: Path, oval_path: Path, config: dict) -> Image.Image:
    """Paste one airport's oval onto one background at the locked coordinates."""
    bg = Image.open(bg_path).convert("RGBA")
    bg_w, bg_h = bg.size

    # Convert Canva's cm coordinates to pixels based on THIS background's actual size
    px_per_cm_w = bg_w / CANVAS_WIDTH_CM
    px_per_cm_h = bg_h / CANVAS_HEIGHT_CM

    oval_w_px = round(config["w_cm"] * px_per_cm_w)
    oval_h_px = round(config["h_cm"] * px_per_cm_h)
    oval_x_px = round(config["x_cm"] * px_per_cm_w)
    oval_y_px = round(config["y_cm"] * px_per_cm_h)

    oval = Image.open(oval_path).convert("RGBA")
    oval = oval.resize((oval_w_px, oval_h_px), Image.LANCZOS)

    rotation = config.get("rotation_deg", 0)
    if rotation:
        # Rotate around the oval's own center, then re-center it on the
        # same target point so rotation doesn't shift the placement.
        center_x = oval_x_px + oval_w_px / 2
        center_y = oval_y_px + oval_h_px / 2
        oval = oval.rotate(-rotation, expand=True, resample=Image.BICUBIC)
        oval_x_px = round(center_x - oval.width / 2)
        oval_y_px = round(center_y - oval.height / 2)

    result = bg.copy()
    result.paste(oval, (oval_x_px, oval_y_px), oval)
    return result.convert("RGB")


def already_done(airport_code: str) -> bool:
    """True if this airport's output folder already has all 7 mockup JPGs."""
    out_dir = OUTPUT_DIR / airport_code
    if not out_dir.exists():
        return False
    for bg_config in BACKGROUNDS:
        expected = out_dir / f"{airport_code}_{bg_config['name']}.jpg"
        if not expected.exists():
            return False
    return True


def main():
    if not BACKGROUNDS_DIR.exists():
        sys.exit(f"Missing folder: {BACKGROUNDS_DIR}/  (see setup instructions at top of script)")
    if not OVALS_DIR.exists():
        sys.exit(f"Missing folder: {OVALS_DIR}/  (see setup instructions at top of script)")

    all_oval_files = sorted(OVALS_DIR.glob("*.png"))
    if not all_oval_files:
        sys.exit(f"No oval PNGs found in {OVALS_DIR}/")

    missing_bg = [b["file"] for b in BACKGROUNDS if not (BACKGROUNDS_DIR / b["file"]).exists()]
    if missing_bg:
        sys.exit(f"Missing background file(s): {', '.join(missing_bg)}")

    # Split into already-done vs new/needs-generating
    skipped = []
    oval_files = []
    for oval_path in all_oval_files:
        code = oval_path.stem
        if already_done(code):
            skipped.append(code)
        else:
            oval_files.append(oval_path)

    if skipped:
        print(f"Skipping {len(skipped)} already-completed airport(s): {', '.join(skipped)}")

    if not oval_files:
        print("Nothing new to generate — every oval already has its 7 mockups.")
        return

    print(f"Found {len(oval_files)} new airport oval(s) and {len(BACKGROUNDS)} background(s).")
    print(f"Generating {len(oval_files) * len(BACKGROUNDS)} mockup images...\n")

    for oval_path in oval_files:
        airport_code = oval_path.stem
        airport_out_dir = OUTPUT_DIR / airport_code
        airport_out_dir.mkdir(parents=True, exist_ok=True)

        for bg_config in BACKGROUNDS:
            bg_path = BACKGROUNDS_DIR / bg_config["file"]
            result = composite_oval_on_background(bg_path, oval_path, bg_config)

            out_path = airport_out_dir / f"{airport_code}_{bg_config['name']}.jpg"
            result.save(out_path, quality=92)

        print(f"  {airport_code}: {len(BACKGROUNDS)} mockups -> {airport_out_dir}/")

    print("\nDone!")


if __name__ == "__main__":
    main()
