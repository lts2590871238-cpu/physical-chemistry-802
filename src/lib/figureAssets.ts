import type { Question } from './types'

const REDRAWN_FIGURES: Record<string, string> = {
  '2003-Q26': 'redrawn-diagrams/2003-Q26-phase.svg',
  '2004-Q11': 'redrawn-diagrams/2004-Q11-phase.svg',
  '2005-Q29': 'redrawn-diagrams/2005-Q29-phase.svg',
  '2009-Q11': 'redrawn-diagrams/2009-Q11-phase.svg',
  '2010-Q30': 'redrawn-diagrams/2010-Q30-phase.svg',
  '2011-Q35': 'redrawn-diagrams/2011-Q35-phase.svg',
  '2016-Q27': 'redrawn-diagrams/2016-Q27-phase.svg',
  '2017-Q17': 'redrawn-diagrams/2017-Q17-phase.svg',
  '2017-Q25': 'redrawn-diagrams/2017-Q25-figure.svg',
  '2021-Q32': 'redrawn-diagrams/2021-Q32-phase.svg',
  '2023-Q10': 'redrawn-diagrams/2023-Q10-phase.svg',
  '2023-Q13': 'redrawn-diagrams/2023-Q13-figure.svg',
  '2024-Q31': 'redrawn-diagrams/2024-Q31-figure.svg',
  '2024-Q32': 'redrawn-diagrams/2024-Q32-phase.svg',
  '2025-Q04': 'redrawn-diagrams/2025-Q04-figure.svg',
  '2026-Q08': 'redrawn-diagrams/2026-Q08-phase.svg',
  '2026-Q36': 'redrawn-diagrams/2026-Q36-phase.svg',
}

export function questionFigure(q: Question): string | undefined {
  return REDRAWN_FIGURES[q.id] ?? q.figs?.find((fig) => /\.(?:png|jpe?g|webp|svg)$/i.test(fig))
}

export function isRedrawnFigure(id: string): boolean {
  return id in REDRAWN_FIGURES
}
