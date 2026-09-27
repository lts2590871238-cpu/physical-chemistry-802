"""Inventory every question/solution and every referenced picture. Run from repo root."""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'public' / 'data'
REPORT = ROOT / 'audit' / 'reports'
REPORT.mkdir(parents=True, exist_ok=True)

questions = json.loads((DATA / 'questions.json').read_text(encoding='utf-8'))
solutions = json.loads((DATA / 'solutions_all.json').read_text(encoding='utf-8'))
if isinstance(questions, dict):
    questions = questions['questions']
all_questions = [(q, 'exam', solutions.get(q['id'])) for q in questions]
for paper in ('A', 'B'):
    source = json.loads((DATA / f'prediction_{paper}.json').read_text(encoding='utf-8'))
    all_questions += [(q, f'prediction_{paper}', q) for q in source['questions']]

DRAW = re.compile(r'(?:绘制|绘出|绘|画出|画|作出|作图|绘图)\s*.{0,80}?(?:相图|图|曲线|示意图)|(?:相图|步冷曲线|能量图|示意图)\s*.{0,15}?(?:画|绘)', re.S)
DRAW_CONTEXT = re.compile(r'(?:图|曲线|p[-–]V|T[-–]S|能量剖面)', re.I)

rows = []
for q, collection, sol in all_questions:
    qid = q['id']
    raw = q.get('raw', '')
    match = DRAW.search(raw)
    drawing = bool(q.get('type') != 'judge' and match and DRAW_CONTEXT.search(match.group()))
    pics = q.get('figs', [])
    orig_missing = [src for src in pics if not (ROOT / 'public' / src.lstrip('/')).is_file()]
    redraw = list((ROOT / 'public' / 'redrawn-diagrams').glob(f'{qid}-*.svg'))
    answer = ROOT / 'public' / 'answer-diagrams' / f'{qid}-answer.svg'
    answer_text = ' '.join(str((sol or {}).get(k, '')) for k in ('solution', 'method'))
    rows.append({
        'id': qid, 'collection': collection, 'type': q.get('type'),
        'draw_required': int(drawing), 'draw_excerpt': (match.group().replace('\n', ' ') if match else '')[:90],
        'has_fig': int(bool(q.get('has_fig'))), 'source_figs': len(pics),
        'source_fig_missing': ';'.join(orig_missing), 'redrawn': int(bool(redraw)),
        'answer_diagram': int(answer.is_file()), 'solution_present': int(bool((sol or {}).get('solution'))),
        'answer_present': int(bool((sol or {}).get('answer'))),
        'drawing_text_present': int(bool(DRAW_CONTEXT.search(answer_text))),
    })

with (REPORT / 'figure_audit_inventory.csv').open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

print(f"questions={len(rows)} exam={sum(r['collection']=='exam' for r in rows)} predictions={sum(r['collection']!='exam' for r in rows)}")
print(f"drawing_required={sum(r['draw_required'] for r in rows)} answer_diagrams={sum(r['answer_diagram'] for r in rows)}")
print(f"source_fig_questions={sum(bool(r['source_figs']) for r in rows)} missing_assets={sum(bool(r['source_fig_missing']) for r in rows)} redrawn={sum(r['redrawn'] for r in rows)}")
print('Drawing requests lacking diagram:')
for r in rows:
    if r['draw_required'] and not r['answer_diagram']:
        print(f"{r['id']} {r['collection']} {r['draw_excerpt']}")
