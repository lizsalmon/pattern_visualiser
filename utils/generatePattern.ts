// Outer array = one entry per cell (length rows*cols, row-major order).
// Inner array = that cell's 0/1 value across frames (same length for every cell).
// This mirrors the shape expected by validateGrid / the LED grid animator.

export type PatternType =
  | 'wave-left-right'
  | 'wave-right-left'
  | 'wave-top-down'
  | 'wave-bottom-up'
  | 'wave-diagonal-tl-br'
  | 'wave-diagonal-tr-bl'
  | 'bounce-horizontal'
  | 'bounce-vertical'

export interface PatternOption {
  id: PatternType
  label: string
}

export const PATTERN_OPTIONS: PatternOption[] = [
  { id: 'wave-left-right', label: 'Wave: Left → Right' },
  { id: 'wave-right-left', label: 'Wave: Right → Left' },
  { id: 'wave-top-down', label: 'Wave: Top → Down' },
  { id: 'wave-bottom-up', label: 'Wave: Bottom → Up' },
  { id: 'wave-diagonal-tl-br', label: 'Wave: Diagonal (Top-Left → Bottom-Right)' },
  { id: 'wave-diagonal-tr-bl', label: 'Wave: Diagonal (Top-Right → Bottom-Left)' },
  { id: 'bounce-horizontal', label: 'Bounce: Horizontal' },
  { id: 'bounce-vertical', label: 'Bounce: Vertical' },
]

type LitPredicate = (row: number, col: number) => boolean

/**
 * Generates frame-based cell data for a given pattern type and grid size.
 *
 * @param type Which pattern to generate (see PATTERN_OPTIONS).
 * @param rows Number of grid rows (must be a positive integer).
 * @param cols Number of grid columns (must be a positive integer).
 * @returns Cells in row-major order, each an array of 0/1 values across frames.
 */
export function generatePattern(type: PatternType, rows: number, cols: number): number[][] {
  const frames = buildFrameSequence(type, rows, cols)
  const numFrames = frames.length

  const cells: number[][] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frameValues: number[] = []
      for (let f = 0; f < numFrames; f++) {
        frameValues.push(frames[f](row, col) ? 1 : 0)
      }
      cells.push(frameValues)
    }
  }
  return cells
}

function buildFrameSequence(type: PatternType, rows: number, cols: number): LitPredicate[] {
  switch (type) {
    case 'wave-left-right':
      return sequence(cols, (f) => (_row, col) => col === f)
    case 'wave-right-left':
      return sequence(cols, (f) => (_row, col) => col === cols - 1 - f)
    case 'wave-top-down':
      return sequence(rows, (f) => (row) => row === f)
    case 'wave-bottom-up':
      return sequence(rows, (f) => (row) => row === rows - 1 - f)
    case 'wave-diagonal-tl-br':
      return sequence(rows + cols - 1, (f) => (row, col) => row + col === f)
    case 'wave-diagonal-tr-bl':
      return sequence(rows + cols - 1, (f) => (row, col) => row + (cols - 1 - col) === f)
    case 'bounce-horizontal':
      return pingPong(cols).map((col) => (_row, c) => c === col)
    case 'bounce-vertical':
      return pingPong(rows).map((row) => (r) => r === row)
    default: {
      const exhaustiveCheck: never = type
      throw new Error(`Unknown pattern type: ${exhaustiveCheck as string}`)
    }
  }
}

// Builds a sequence of `count` predicates via `factory(frameIndex)`. Always
// produces at least one frame, even if `count` is somehow <= 0.
function sequence(count: number, factory: (frameIndex: number) => LitPredicate): LitPredicate[] {
  return Array.from({ length: Math.max(count, 1) }, (_, f) => factory(f))
}

// Produces a forward-then-backward index sequence for a ping-pong "bounce"
// animation, e.g. for n=4: [0,1,2,3,2,1]. Looping this continuously gives a
// smooth bounce with no paused/duplicate frame at either end. Collapses to a
// single frame when n <= 1.
function pingPong(n: number): number[] {
  if (n <= 1) return [0]
  const forward = Array.from({ length: n }, (_, i) => i)
  const backward = Array.from({ length: n - 2 }, (_, i) => n - 2 - i)
  return [...forward, ...backward]
}
