from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
qa = root / 'audit' / '_qa'
files = sorted((root / 'public' / 'redrawn-diagrams').glob('*.svg'))
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 19)
for batch in range(0, len(files), 4):
    entries = files[batch:batch+4]
    out = Image.new('RGB', (1120, 4*400), 'white')
    d = ImageDraw.Draw(out)
    for i, f in enumerate(entries):
        id_ = f.name[:8]
        original = root / 'public' / 'figures' / id_[:4] / f'{id_}-original.webp'
        for col, img in enumerate((original, qa / f'{f.stem}.png')):
            with Image.open(img) as source:
                fitted = ImageOps.contain(source.convert('RGB'), (530, 350))
            x = 20 + col*550 + (530-fitted.width)//2
            y = i*400 + 38 + (350-fitted.height)//2
            out.paste(fitted, (x, y))
        d.text((20, i*400+8), f'{id_} original', font=font, fill='black')
        d.text((570, i*400+8), f'{id_} vector', font=font, fill='black')
    out.save(qa / f'montage-{batch//4+1}.png')
