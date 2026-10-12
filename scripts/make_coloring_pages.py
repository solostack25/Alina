import cv2, numpy as np, warnings, json, os
warnings.filterwarnings("ignore")
from skimage.measure import label
from skimage.morphology import dilation, disk
from lineart import lineart

OUT = "/home/claude/alina/public/coloring"
os.makedirs(OUT, exist_ok=True)

def rgba(path):
    return cv2.cvtColor(cv2.imread(path, cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA)

def keep_main(im):
    a = im[..., 3] > 128
    lab = label(a, connectivity=2)
    if lab.max() > 1:
        sizes = np.bincount(lab.ravel()); sizes[0] = 0
        keep = lab == sizes.argmax()
        im = im.copy(); im[~dilation(keep, disk(2)), 3] = 0
    ys, xs = np.where(im[..., 3] > 0)
    return im[ys.min():ys.max()+1, xs.min():xs.max()+1]

def place(canvas, im, x, y, h):
    s = h / im.shape[0]
    im = cv2.resize(im, (int(im.shape[1]*s), h), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC)
    H, W = canvas.shape[:2]
    x0, y0 = max(0, x), max(0, y); x1, y1 = min(W, x + im.shape[1]), min(H, y + im.shape[0])
    sub = im[y0-y:y1-y, x0-x:x1-x]
    al = sub[..., 3:4] / 255.0
    canvas[y0:y1, x0:x1, :3] = (sub[..., :3] * al + canvas[y0:y1, x0:x1, :3] * (1 - al)).astype(np.uint8)
    canvas[y0:y1, x0:x1, 3] = np.maximum(canvas[y0:y1, x0:x1, 3], sub[..., 3])
    return canvas

def star_pts(cx, cy, r):
    pts = []
    for i in range(10):
        ang = -np.pi/2 + i*np.pi/5
        rr = r if i % 2 == 0 else r*0.45
        pts.append([cx + rr*np.cos(ang), cy + rr*np.sin(ang)])
    return np.array(pts, np.int32)

def heart_pts(cx, cy, r):
    t = np.linspace(0, 2*np.pi, 80)
    x = 16*np.sin(t)**3; y = -(13*np.cos(t) - 5*np.cos(2*t) - 2*np.cos(3*t) - np.cos(4*t))
    return np.stack([cx + x*r/17, cy + y*r/17], 1).astype(np.int32)

def decorate(lines, shapes):
    m = np.zeros(lines.shape, np.uint8)
    for kind, cx, cy, r in shapes:
        pts = star_pts(cx, cy, r) if kind == "star" else heart_pts(cx, cy, r)
        cv2.polylines(m, [pts], True, 255, 5, cv2.LINE_AA)
    return lines | (m > 100)

def export(pid, lines):
    H, W = lines.shape
    reg = label(~lines, connectivity=1).astype(np.int32)
    # region ids packed into RGB of a lossless PNG (0 = line, not fillable)
    ids = np.zeros((H, W, 3), np.uint8)
    ids[..., 0] = reg & 255; ids[..., 1] = (reg >> 8) & 255
    cv2.imwrite(f"{OUT}/{pid}-regions.png", cv2.cvtColor(ids, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    # display lines: soft dark ink on transparent
    soft = cv2.GaussianBlur(lines.astype(np.float32), (0, 0), 0.7)
    ink = np.zeros((H, W, 4), np.uint8); ink[..., :3] = (43, 35, 80)
    ink[..., 3] = np.clip(soft * 1.6, 0, 1) * 255
    cv2.imwrite(f"{OUT}/{pid}-lines.png", cv2.cvtColor(ink, cv2.COLOR_RGBA2BGRA), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    # preview with random region colors to check for leaks
    rng = np.random.default_rng(1); pal = rng.integers(120, 255, (reg.max()+1, 3)).astype(np.uint8); pal[0] = 0
    cv2.imwrite(f"prev_{pid}.png", cv2.cvtColor(pal[reg], cv2.COLOR_RGB2BGR))
    return W, H, int(reg.max())

alina = keep_main(rgba("alina-hero2-cut.png"))
liyana = keep_main(rgba("liyana-hero2-cut.png"))
src = rgba("/root/.claude/uploads/fc8e0a5a-9000-5ed4-91c4-c6335196058d/9bc35f50-image.png") if False else None

pages = {}
H = 900
def page(pid, W, items, shapes):
    canvas = np.zeros((H, W, 4), np.uint8); canvas[..., :3] = 255
    for im, x, y, h in items: place(canvas, im, x, y, h)
    L = lineart(canvas, sigma=1.2, t=6.0)
    L = decorate(L, shapes)
    pages[pid] = export(pid, L)

aw = int(alina.shape[1] * 840 / alina.shape[0]); lw = int(liyana.shape[1] * 760 / liyana.shape[0])
page("alina", 900, [(alina, (900-aw)//2 + 40, 50, 840)],
     [("star", 110, 120, 70), ("star", 790, 90, 45), ("star", 90, 700, 50), ("star", 210, 300, 32)])
page("liyana", 900, [(liyana, (900-lw)//2, 110, 760)],
     [("heart", 780, 120, 70), ("heart", 120, 100, 50), ("heart", 800, 760, 48), ("heart", 690, 260, 30)])
page("sisters", 1400, [(liyana, 40, 160, 700), (alina, 690, 40, 830)],
     [("heart", 120, 110, 60), ("star", 640, 100, 60), ("heart", 560, 800, 45), ("star", 1320, 120, 50), ("star", 1300, 820, 40)])
# close-ups from the top of each hero
ah = alina[: int(alina.shape[0]*0.36)]; lh = liyana[: int(liyana.shape[0]*0.5), int(liyana.shape[1]*0.18):]
page("alina-face", 900, [(ah, 450 - int(ah.shape[1]*820/ah.shape[0])//2, 60, 820)],
     [("star", 110, 120, 60), ("star", 800, 760, 55)])
page("liyana-face", 900, [(lh, 450 - int(lh.shape[1]*820/lh.shape[0])//2, 60, 820)],
     [("heart", 110, 780, 60), ("heart", 800, 110, 55)])
json.dump(pages, open("pages.json", "w"))
print(pages)
