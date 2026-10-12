import cv2, numpy as np, sys, warnings
warnings.filterwarnings("ignore")
from skimage.segmentation import felzenszwalb, find_boundaries
from skimage.morphology import remove_small_objects, dilation, disk, skeletonize
from skimage.measure import label

def load(path, h=900):
    im = cv2.cvtColor(cv2.imread(path, cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA)
    return cv2.resize(im, (int(im.shape[1]*h/im.shape[0]), h), interpolation=cv2.INTER_AREA)

def lineart(rgba, sigma=1.4, t=4.0, seg_scale=900, seg_min=900, speck=40):
    a = rgba[..., 3] > 128
    rgb = rgba[..., :3].astype(np.float32).copy(); rgb[~a] = 255
    rgb = cv2.bilateralFilter(rgb, 9, 40, 7)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    # Difference of Gaussians: dark-side edges become strokes
    g1 = cv2.GaussianBlur(gray, (0, 0), sigma); g2 = cv2.GaussianBlur(gray, (0, 0), sigma * 1.6)
    dog = g1 - g2
    strokes = dog < -t
    # also color edges (e.g. pink against purple at similar brightness)
    lab = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
    for ch in (1, 2):
        c1 = cv2.GaussianBlur(lab[..., ch], (0, 0), sigma); c2 = cv2.GaussianBlur(lab[..., ch], (0, 0), sigma * 1.6)
        strokes |= np.abs(c1 - c2) > t * 1.2
    strokes &= a | dilation(a, disk(3))
    strokes = remove_small_objects(strokes, max_size=25)
    strokes = skeletonize(strokes)
    # big color regions close the shapes so the bucket fill doesn't leak
    seg = felzenszwalb(cv2.pyrMeanShiftFiltering(rgb.astype(np.uint8), 10, 28), scale=seg_scale, sigma=1.0, min_size=seg_min)
    seg[~a] = -1
    # outline dark areas (hair) so they separate from skin and costume
    dark = cv2.GaussianBlur(gray, (0, 0), 2.0) < 80
    dark = remove_small_objects(dark & a, max_size=400)
    darkb = find_boundaries(dark.astype(int), mode="inner")
    bounds = find_boundaries(seg, mode="inner")
    sil = find_boundaries(a.astype(int), mode="outer")
    lines = dilation(strokes | bounds | darkb, disk(1)) | dilation(sil, disk(2))
    # specks of white between lines would be impossible to tap; fold them into the lines
    reg = label(~lines, connectivity=1)
    sizes = np.bincount(reg.ravel()); tiny = sizes < speck; tiny[0] = False
    lines |= tiny[reg]
    return lines

if __name__ == "__main__":
    rgba = load(sys.argv[1])
    for i, (s, t) in enumerate([(1.4, 4.0), (1.8, 5.0), (1.2, 6.0)]):
        L = lineart(rgba, sigma=s, t=t)
        cv2.imwrite(f"la2_{i}.png", np.where(L, 25, 255).astype(np.uint8))
        print(i, "regions", label(~L, connectivity=1).max())
