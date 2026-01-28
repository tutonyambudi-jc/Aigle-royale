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

export function calcBaggageExtrasXof(input: { extraPieces?: number; overweightKg?: number }): number {
  const pieces = Number.isFinite(input.extraPieces) ? Math.max(0, Math.floor(input.extraPieces as number)) : 0
  const overweightKg = Number.isFinite(input.overweightKg) ? Math.max(0, Number(input.overweightKg)) : 0
  const piecePrice = getExtraBaggagePiecePriceXof()
  const perKg = getExtraBaggageOverweightPriceXofPerKg()
  return pieces * piecePrice + overweightKg * perKg
}

