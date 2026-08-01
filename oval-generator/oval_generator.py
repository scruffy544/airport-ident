import subprocess, os, math
from PIL import Image, ImageDraw, ImageFont

W, H = 3000, 2100
CX, CY = 1500, 1050
RX, RY = 1370.5, 920.5
INNER_RX, INNER_RY = 1340, 890

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TMP = "/home/claude/oval_final/tmp"
os.makedirs(TMP, exist_ok=True)

TOP_MARGIN = 95
BOTTOM_MARGIN = 100

def render_flat(text, pointsize):
    font = ImageFont.truetype(FONT_PATH, pointsize)
    w = int(font.getlength(text)) + 60
    h = pointsize * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.text((30, h // 2), text, font=font, fill="black", anchor="lm")
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img

def ellipse_point_and_normal(t, rx, ry):
    """Point on the ellipse at parameter t (t=0 is the top vertex), plus its
    outward unit normal direction. Used for TRUE curvature (not a circular
    approximation), so equidistance from the border holds even for very
    wide text spans."""
    x = rx * math.sin(t)
    y = -ry * math.cos(t)
    nx, ny = x / (rx ** 2), y / (ry ** 2)
    norm = math.hypot(nx, ny)
    return x, y, nx / norm, ny / norm


def find_t_for_x(target_x, rx, ry):
    lo, hi = (0.0, math.pi / 2) if target_x >= 0 else (-math.pi / 2, 0.0)
    for _ in range(40):
        mid = (lo + hi) / 2
        x, _, _, _ = ellipse_point_and_normal(mid, rx, ry)
        if x < target_x:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def warp_arc(flat_img, margin_px, top=True, strip_w=3):
    """Continuous strip-based bend along the TRUE ellipse curve (not a
    circular approximation) — every point genuinely equidistant from the
    actual border, holding even for very wide/long text. Returns
    (cropped_image, offset_x, offset_y) where offset is this image's
    top-left position relative to the ellipse's own center (CX, CY) —
    use that directly as the paste position onto the base image."""
    src_w, src_h = flat_img.size
    out_w = src_w + 400
    out_h = int(2 * RY) + 400  # generous room for the full ellipse range either direction
    out = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))
    out_cx = out_w / 2
    out_cy = out_h / 2

    n_strips = max(1, src_w // strip_w)
    for i in range(n_strips):
        sx0 = i * strip_w
        sx1 = min(src_w, sx0 + strip_w)
        if sx1 <= sx0:
            continue
        strip = flat_img.crop((sx0, 0, sx1, src_h))
        x_center = (sx0 + sx1) / 2 - src_w / 2

        t = find_t_for_x(x_center, RX, RY)
        ex, ey, nx, ny = ellipse_point_and_normal(t, RX, RY)
        # Move inward along the normal by margin_px (normal points outward)
        ex_m, ey_m = ex - nx * margin_px, ey - ny * margin_px

        rot_deg = -math.degrees(t)
        if not top:
            ey_m = -ey_m
            rot_deg = -rot_deg

        rotated = strip.rotate(rot_deg, expand=True, resample=Image.BICUBIC)
        rw, rh = rotated.size

        dst_x = out_cx + ex_m - rw / 2
        dst_y = out_cy + ey_m - rh / 2
        out.alpha_composite(rotated, (int(dst_x), int(dst_y)))

    bbox = out.getbbox()
    if not bbox:
        return out, 0, 0
    cropped = out.crop(bbox)
    offset_x = bbox[0] - out_cx
    offset_y = bbox[1] - out_cy
    return cropped, offset_x, offset_y

def sh(cmd):
    subprocess.run(cmd, shell=True, check=True)

_BASE_CACHE = None

def get_base():
    global _BASE_CACHE
    if _BASE_CACHE is None:
        sh(f'convert -size {W}x{H} xc:none -fill white -draw "ellipse {CX},{CY} {RX},{RY} 0,360" '
           f'-fill none -stroke black -strokewidth 14 -draw "ellipse {CX},{CY} {RX},{RY} 0,360" '
           f'-stroke black -strokewidth 6 -draw "ellipse {CX},{CY} {INNER_RX},{INNER_RY} 0,360" '
           f'{TMP}/base.png')
        _BASE_CACHE = Image.open(f'{TMP}/base.png').convert("RGBA")
    return _BASE_CACHE.copy()

def create_oval(code, name, city, state, outdir):
    name_up = name.upper()
    location = f"{city}, {state}".upper()

    base = get_base()

    code_size = 760 if len(code) <= 3 else 690
    font = ImageFont.truetype(FONT_PATH, code_size)
    tmp_img = Image.new("RGBA", (3000, 1600), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp_img)
    d.text((1500, 800), code, font=font, fill="black", anchor="mm")
    bbox = tmp_img.getbbox()
    code_img = tmp_img.crop(bbox)
    cw, ch = code_img.size
    base.paste(code_img, (CX - cw // 2, CY - ch // 2), code_img)

    flat_name = render_flat(name_up, 101)
    MAX_NAME_WIDTH = 0.88 * (2 * RX)
    if flat_name.size[0] > MAX_NAME_WIDTH:
        scale = MAX_NAME_WIDTH / flat_name.size[0]
        reduced_size = max(45, int(101 * scale))
        flat_name = render_flat(name_up, reduced_size)
    name_img, off_x, off_y = warp_arc(flat_name, TOP_MARGIN, top=True)
    base.paste(name_img, (int(CX + off_x), int(CY + off_y)), name_img)

    flat_loc = render_flat(location, 94)
    loc_img, loff_x, loff_y = warp_arc(flat_loc, BOTTOM_MARGIN, top=False)
    base.paste(loc_img, (int(CX + loff_x), int(CY + loff_y)), loc_img)

    outpath = f"{outdir}/{code}-oval-5x35.png"
    base.save(outpath)
    return outpath
