import type { Question } from './types'

const REDRAWN_FIGURES: Record<string, string> = {
  '2003-Q26': 'redrawn-diagrams/2003-Q26-phase.svg',
}

export function questionFigure(q: Question): string | undefined {
  return REDRAWN_FIGURES[q.id] ?? q.figs?.find((fig) => /\.(?:png|jpe?g|webp|svg)$/i.test(fig))
}

export function isRedrawnFigure(id: string): boolean {
  return id in REDRAWN_FIGURES
}
