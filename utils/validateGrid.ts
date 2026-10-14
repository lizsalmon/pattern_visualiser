// Outer array = one entry per cell (length rows*cols).
// Inner array = that cell's value across frames (length num_frames), 0 or 1.

export interface ValidationResult {
  errors: string[]
  cells: number[][]
}

/**
 * Validates a rows/cols/frames-JSON combination for the LED grid animator.
 *
 * - `rowsInput`/`colsInput` must coerce to positive integers.
 * - `framesText` must be valid JSON describing a non-empty array of cells
 *   (length `rows*cols`, row-major order), where every cell is an array of
 *   the same length containing only `0`/`1` values.
 */
export function validateGrid(rowsInput: unknown, colsInput: unknown, framesText: string): ValidationResult {
  const errors: string[] = []
  const r = Number(rowsInput)
  const c = Number(colsInput)

  if (!Number.isInteger(r) || r <= 0) {
    errors.push('Rows must be a positive integer.')
  }
  if (!Number.isInteger(c) || c <= 0) {
    errors.push('Columns must be a positive integer.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(framesText)
  } catch {
    errors.push('Input is not valid JSON.')
    return { errors, cells: [] }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    errors.push('Input must be a non-empty array of cells.')
    return { errors, cells: [] }
  }

  const expectedCells = Number.isInteger(r) && r > 0 && Number.isInteger(c) && c > 0 ? r * c : null

  if (expectedCells !== null && parsed.length !== expectedCells) {
    errors.push(`Expected ${expectedCells} cell(s) (rows x cols), but the outer array has ${parsed.length}.`)
  }

  let frameLength: number | null = null

  parsed.forEach((cellFrames, i) => {
    if (!Array.isArray(cellFrames)) {
      errors.push(`Cell ${i + 1} is not an array.`)
      return
    }
    if (frameLength === null) {
      frameLength = cellFrames.length
    } else if (cellFrames.length !== frameLength) {
      errors.push(
        `Cell ${i + 1} has ${cellFrames.length} frame value(s), expected ${frameLength} (every cell must have the same number of frames).`
      )
    }
    cellFrames.forEach((value, j) => {
      if (value !== 0 && value !== 1) {
        errors.push(`Cell ${i + 1} has an invalid value "${value}" at frame ${j + 1} (must be 0 or 1).`)
      }
    })
  })

  if (frameLength === null || frameLength === 0) {
    errors.push('Each cell must have at least one frame value.')
  }

  if (errors.length > 0) {
    return { errors, cells: [] }
  }

  return { errors: [], cells: parsed as number[][] }
}
