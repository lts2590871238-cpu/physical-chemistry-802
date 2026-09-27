"""Fail if an active drawing answer or a redrawn question figure is missing/broken."""
import csv
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
rows = list(csv.DictReader((ROOT / 'audit/reports/figure_audit_inventory.csv').open(encoding='utf-8-sig', newline='')))
source_code = (ROOT / 'src/lib/figureAssets.ts').read_text(encoding='utf-8')
answer_code = (ROOT / 'src/lib/QuestionCard.tsx').read_text(encoding='utf-8')
figure_map = dict(re.findall(r"'((?:20\d\d-Q\d\d))': '(redrawn-diagrams/[^']+)'", source_code))
answer_block = re.search(r'const ANSWER_FIG_IDS = new Set\(\[([^]]+)\]\)', answer_code, re.S)
answer_ids = set(re.findall(r"'([^']+)'", answer_block.group(1))) if answer_block else set()

failures = []
active = [r for r in rows if r['collection'] != 'exam' or int(r['id'][:4]) <= 2023]
figure_rows = [r for r in rows if r['has_fig'] == '1']
drawing_rows = [r for r in active if r['draw_required'] == '1']

for r in active:
    if r['solution_present'] != '1' or r['answer_present'] != '1':
        failures.append(f"{r['id']}: active answer or solution missing")
for r in drawing_rows:
    if r['id'] not in answer_ids or r['answer_diagram'] != '1':
        failures.append(f"{r['id']}: required answer diagram not connected")
for r in figure_rows:
    src = figure_map.get(r['id'])
    if not src or not (ROOT / 'public' / src).is_file():
        failures.append(f"{r['id']}: redrawn question figure not connected")
    if r['source_fig_missing'] or r['source_figs'] == '0':
        failures.append(f"{r['id']}: original reference asset missing")
for r in rows:
    if r['has_fig'] == '0' and r['source_figs'] != '0':
        failures.append(f"{r['id']}: has_fig flag disagrees with assets")

assets = list((ROOT / 'public/redrawn-diagrams').glob('*.svg')) + list((ROOT / 'public/answer-diagrams').glob('*.svg'))
for asset in assets:
    try:
        tree = ET.parse(asset)
        svg = tree.getroot()
        if not svg.attrib.get('viewBox'):
            failures.append(f"{asset.name}: missing viewBox")
        if any(el.tag.endswith(('image', 'foreignObject')) for el in svg.iter()):
            failures.append(f"{asset.name}: contains raster or foreign content")
    except ET.ParseError as exc:
        failures.append(f"{asset.name}: invalid SVG: {exc}")

print(f"active_questions={len(active)} required_answer_drawings={len(drawing_rows)} source_figures={len(figure_rows)} svg_assets={len(assets)} FAIL={len(failures)}")
for issue in failures:
    print('FAIL', issue)
sys.exit(bool(failures))
