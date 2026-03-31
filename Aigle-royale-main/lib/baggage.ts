/**
 * Règles bagages « incluses » (hors suppléments payants).
 * Source unique pour cartes trajet, calculateur, textes réservation et tarification suppléments.
 */
export const BAGGAGE_STANDARD = {
  checked: {
    /** Pièces en soute incluses par passager */
    maxPiecesPerPassenger: 2,
    /** Poids max par pièce en soute (kg) */
    maxKgPerPiece: 20,
    maxDimsCm: [75, 50, 30] as const,
  },
  carryOn: {
    maxPiecesPerPassenger: 1,
    maxKgPerPiece: 10,
    maxDimsCm: [55, 40, 20] as const,
  },
} as const

export type BaggageStandard = typeof BAGGAGE_STANDARD

export function formatBaggageDimsCm(dims: readonly [number, number, number]): string {
  const [l, w, h] = dims
  return `${l} × ${w} × ${h} cm`
}

/** Libellé court pour cartes « trajets disponibles » (soute). */
export function baggageCheckedShortLabelFr(): string {
  const { maxPiecesPerPassenger, maxKgPerPiece } = BAGGAGE_STANDARD.checked
  return `${maxPiecesPerPassenger} × ${maxKgPerPiece} kg`
}

/** Libellé court pour cartes (cabine). */
export function baggageCarryOnShortLabelFr(): string {
  const { maxKgPerPiece } = BAGGAGE_STANDARD.carryOn
  return `${maxKgPerPiece} kg`
}

/** Phrase d’intro type calculateur / rappel passager. */
export function baggageStandardIntroLineFr(): string {
  const c = BAGGAGE_STANDARD.checked
  const co = BAGGAGE_STANDARD.carryOn
  return `Limite par passager : ${c.maxPiecesPerPassenger} bagages soute (${c.maxKgPerPiece} kg chacun) + ${co.maxPiecesPerPassenger} bagage à main (${co.maxKgPerPiece} kg).`
}

export function getExtraBaggagePiecePriceXof(): number {
  const raw = process.env.NEXT_PUBLIC_EXTRA_BAGGAGE_PIECE_PRICE_FC
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n >= 0 ? n : 1000
}

export function getExtraBaggageOverweightPriceXofPerKg(): number {
  const raw = process.env.NEXT_PUBLIC_EXTRA_BAGGAGE_OVERWEIGHT_PRICE_FC_PER_KG
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n >= 0 ? n : 200
}

/**
 * Montant supplément (FC) pour bagages hors quota standard :
 * - pièces en soute au-delà de {@link BAGGAGE_STANDARD}.checked par passager,
 * - surpoids total (kg) au-delà des limites par pièce.
 */
export function calcBaggageExtrasXof(input: { extraPieces?: number; overweightKg?: number }): number {
  const pieces = Number.isFinite(input.extraPieces) ? Math.max(0, Math.floor(input.extraPieces as number)) : 0
  const overweightKg = Number.isFinite(input.overweightKg) ? Math.max(0, Number(input.overweightKg)) : 0
  const piecePrice = getExtraBaggagePiecePriceXof()
  const perKg = getExtraBaggageOverweightPriceXofPerKg()
  return pieces * piecePrice + overweightKg * perKg
}
