"""High-quality pre-scaling of client images for a 4K internal render (supersampled to 1080p).
Lanczos resampling to the size the image is actually displayed at (×1.2 headroom for the push-in) + gentle unsharp mask.
Originals are untouched; prepared copies go to Abu_Dhabi_Video/_prepared/ (same relative path, .png)."""
import os, glob
from PIL import Image, ImageFilter
LIB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Abu_Dhabi_Video'); OUT = os.path.join(LIB, '_prepared')
TARGET = {'02_Abu_Dhabi_Maps': (3840, 2160)}          # full-screen closing
CARD = (1200 * 1.2, 720 * 1.2)                         # island card photo frame at 4K (600×360 @1080p ×2) + push-in headroom
for f in sorted(glob.glob(os.path.join(LIB, '0*', '*'))):
    if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')): continue
    folder = os.path.basename(os.path.dirname(f)); tw, th = TARGET.get(folder, CARD)
    im = Image.open(f).convert('RGB'); w, h = im.size
    s = max(tw / w, th / h)                                  # cover-fit scale needed
    if s > 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.6 * min(s, 3), percent=55, threshold=2))
    o = os.path.join(OUT, folder, os.path.splitext(os.path.basename(f))[0] + '.png'); os.makedirs(os.path.dirname(o), exist_ok=True)
    im.save(o, optimize=True); print(f'{folder}/{os.path.basename(f)}: {w}x{h} -> {im.size[0]}x{im.size[1]} (x{max(s,1):.2f})')
