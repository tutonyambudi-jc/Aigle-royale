/** Valeur historique / secours si compagnie absente ou non renseignée */
export const DEFAULT_FREIGHT_PRICE_PER_KG_FC = 10000

export type CompanyFreightPricingInput = {
  freightPricePerKg: number | null
} | null

/**
 * Prix au kg (FC) pour une compagnie. Valeur stockée en base ; sinon défaut métier.
 */
export function resolveFreightPricePerKg(company: CompanyFreightPricingInput): number {
  const v = company?.freightPricePerKg
  if (typeof v === 'number' && !Number.isNaN(v) && v >= 0) {
    return v
  }
  return DEFAULT_FREIGHT_PRICE_PER_KG_FC
}
