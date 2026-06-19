"""Generate the 10 Step-1 BIP6 PNG icons in the Noor accent colors.

Run once: `python3 scripts/generate-bip6-icons.py` from the project root.
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "bip6", "image")
os.makedirs(OUT, exist_ok=True)

ACCENT = (78, 222, 163, 255)         # 0x4edea3
ACCENT_DEEP = (16, 185, 129, 255)    # 0x10b981
MUTED = (187, 202, 191, 255)         # 0xbbcabf
INACTIVE = (143, 143, 143, 255)      # 0x8f8f8f
TRANSPARENT = (0, 0, 0, 0)


def new_image(size):
    return Image.new("RGBA", (size, size), TRANSPARENT)


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print(f"wrote {path} ({img.size[0]}x{img.size[1]})")


# --- HOME -----------------------------------------------------------------

def draw_pin(size=24, color=ACCENT):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    # Pin: teardrop (circle + triangle pointing down)
    cx = size / 2
    head_r = size * 0.32
    head_cy = head_r + 2
    d.ellipse((cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r), outline=color, width=2)
    # Tail
    d.polygon([
        (cx - head_r * 0.55, head_cy + head_r * 0.4),
        (cx + head_r * 0.55, head_cy + head_r * 0.4),
        (cx, size - 1),
    ], fill=color)
    # Inner dot
    d.ellipse((cx - head_r * 0.35, head_cy - head_r * 0.35, cx + head_r * 0.35, head_cy + head_r * 0.35), fill=color)
    return img


def draw_compass(size=20, color=ACCENT_DEEP):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    # Outer ring
    pad = 1.5
    d.ellipse((pad, pad, size - pad, size - pad), outline=color, width=2)
    # Needle (diamond vertical)
    cx = size / 2
    cy = size / 2
    needle = size * 0.35
    d.polygon([
        (cx, cy - needle),
        (cx + needle * 0.4, cy),
        (cx, cy + needle),
        (cx - needle * 0.4, cy),
    ], outline=color, width=1)
    # Center dot
    d.ellipse((cx - 1.5, cy - 1.5, cx + 1.5, cy + 1.5), fill=color)
    return img


def draw_gear(size=20, color=MUTED):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    cx = cy = size / 2
    r_outer = size * 0.42
    r_inner = r_outer - 2.2
    # 8 teeth as rotated rectangles
    import math
    teeth = 8
    tooth_w = 2.2
    tooth_h = r_outer * 0.35
    for i in range(teeth):
        a = (2 * math.pi * i) / teeth
        # Tooth rectangle centered along the radial direction
        tx = cx + math.cos(a) * (r_outer - tooth_h / 2 + 1) - tooth_w / 2
        ty = cy + math.sin(a) * (r_outer - tooth_h / 2 + 1) - tooth_h / 2
        tooth = Image.new("RGBA", (int(tooth_w + 1), int(tooth_h + 1)), TRANSPARENT)
        td = ImageDraw.Draw(tooth)
        td.rectangle((0, 0, tooth_w, tooth_h), fill=color)
        tooth = tooth.rotate(-math.degrees(a), resample=Image.BICUBIC)
        img.alpha_composite(tooth, (int(tx), int(ty)))
    # Body ring
    d = ImageDraw.Draw(img)
    d.ellipse((cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer), outline=color, width=2)
    d.ellipse((cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner), outline=color, width=1)
    return img


# --- SETTINGS -------------------------------------------------------------

def draw_back(size=24, color=ACCENT):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    # Chevron-style back arrow (left-pointing)
    cx = size / 2
    cy = size / 2
    arm = size * 0.32
    thick = 2.5
    d.line([(cx + arm, cy - arm), (cx - arm, cy)], fill=color, width=int(thick))
    d.line([(cx - arm, cy), (cx + arm, cy + arm)], fill=color, width=int(thick))
    return img


def draw_chevron(size=16, color=ACCENT):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    cx = size / 2
    cy = size / 2
    arm = size * 0.32
    thick = 2
    d.line([(cx - arm, cy - arm), (cx + arm, cy)], fill=color, width=int(thick))
    d.line([(cx + arm, cy), (cx - arm, cy + arm)], fill=color, width=int(thick))
    return img


def draw_radio(size=20, on=False):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    pad = 1.5
    color = ACCENT if on else INACTIVE
    d.ellipse((pad, pad, size - pad, size - pad), outline=color, width=2)
    if on:
        r = size * 0.22
        cx = cy = size / 2
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
    return img


# --- QIBLA ----------------------------------------------------------------

def draw_qibla_arrow(size=140, color=MUTED):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    cx = size / 2
    # Big upward arrow filling the canvas
    head_w = size * 0.55
    head_h = size * 0.45
    shaft_w = size * 0.22
    shaft_h = size * 0.45
    # Tip at (cx, 6); base of head at y = 6 + head_h
    head_base_y = 6 + head_h
    # Shaft from head_base_y to head_base_y + shaft_h
    shaft_top_y = head_base_y - head_h * 0.15
    shaft_bot_y = shaft_top_y + shaft_h
    # Head triangle
    d.polygon([
        (cx, 6),
        (cx + head_w / 2, head_base_y),
        (cx + shaft_w / 2, head_base_y),
        (cx + shaft_w / 2, shaft_bot_y),
        (cx - shaft_w / 2, shaft_bot_y),
        (cx - shaft_w / 2, head_base_y),
        (cx - head_w / 2, head_base_y),
    ], fill=color)
    return img


def draw_kaaba(size=72, color=ACCENT):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    # Cube + small roof line
    pad = 6
    d.rectangle((pad, pad + size * 0.1, size - pad, size - pad), outline=color, width=3)
    # Door
    dw = size * 0.2
    dx = size / 2 - dw / 2
    dy_top = size - pad - size * 0.5
    d.rectangle((dx, dy_top, dx + dw, size - pad), outline=color, width=2)
    return img


def draw_watch(size=72, color=ACCENT_DEEP):
    img = new_image(size)
    d = ImageDraw.Draw(img)
    cx = cy = size / 2
    r = size * 0.32
    # Watch body
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=3)
    # Crown
    crown_w = size * 0.08
    crown_h = size * 0.1
    d.rectangle((cx + r - 1, cy - crown_h / 2, cx + r + crown_w, cy + crown_h / 2), fill=color)
    # 12/3/6/9 ticks
    tick = size * 0.06
    for dx, dy in [(0, -r * 0.7), (r * 0.7, 0), (0, r * 0.7), (-r * 0.7, 0)]:
        x, y = cx + dx, cy + dy
        d.ellipse((x - tick / 2, y - tick / 2, x + tick / 2, y + tick / 2), fill=color)
    return img


# -------------------------------------------------------------------------

def main():
    save(draw_pin(), "ic_pin.png")
    save(draw_compass(), "ic_compass.png")
    save(draw_gear(), "ic_gear.png")
    save(draw_back(), "ic_back.png")
    save(draw_chevron(), "ic_chevron.png")
    save(draw_radio(on=True), "ic_radio_on.png")
    save(draw_radio(on=False), "ic_radio_off.png")
    save(draw_qibla_arrow(), "ic_qibla_arrow.png")
    save(draw_kaaba(), "ic_kaaba.png")
    save(draw_watch(), "ic_watch.png")


if __name__ == "__main__":
    main()
