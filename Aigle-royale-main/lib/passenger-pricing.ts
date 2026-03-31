// Type removed as it doesn't exist in Prisma client

/**
 * Determine automatic passenger type based on age
 * @param age - Age of the passenger in years
 * @returns Recommended passenger type
 */
export function getPassengerTypeByAge(age: number): 'ADULT' | 'CHILD' | 'INFANT' | 'SENIOR' {
  if (age >= 0 && age <= 1) {
    return 'INFANT';
  } else if (age >= 2 && age <= 11) {
    return 'CHILD';
  } else if (age >= 60) {
    return 'SENIOR';
  } else {
    return 'ADULT';
  }
}

/**
 * Calculate price with passenger type discount
 * @param basePrice - Original ticket price
 * @param passengerPricing - Pricing rule from database
 * @returns Object with basePrice, discountAmount, and finalPrice
 */
export function calculatePassengerPrice(
  basePrice: number,
  passengerPricing: any
): { basePrice: number; discountAmount: number; finalPrice: number } {
  const discountAmount = (basePrice * passengerPricing.discountPercent) / 100;
  const finalPrice = basePrice - discountAmount;

  return {
    basePrice,
    discountAmount,
    finalPrice,
  };
}

/**
 * Validate if passenger age matches the selected passenger type
 * @param age - Age of the passenger
 * @param passengerType - Selected passenger type
 * @param pricingRule - Pricing rule from database
 * @returns Object with isValid flag and error message if invalid
 */
export function validateAgeForPassengerType(
  age: number,
  passengerType: string,
  pricingRule: any | null
): { isValid: boolean; error?: string } {
  if (!pricingRule) {
    return { isValid: false, error: 'Type de passager invalide' };
  }

  // DISABLED type doesn't have age restrictions
  if (passengerType === 'DISABLED') {
    return { isValid: true };
  }

  const { minAge, maxAge } = pricingRule;

  // Check minimum age
  if (minAge !== null && age < minAge) {
    return {
      isValid: false,
      error: `L'âge minimum pour le tarif ${passengerType} est ${minAge} ans`,
    };
  }

  // Check maximum age
  if (maxAge !== null && age > maxAge) {
    return {
      isValid: false,
      error: `L'âge maximum pour le tarif ${passengerType} est ${maxAge} ans`,
    };
  }

  return { isValid: true };
}

/**
 * Get suggested passenger type with reason
 * @param age - Age of the passenger
 * @param hasDisability - Whether passenger has a disability
 * @returns Object with suggested type, reason, and discount info
 */
export function getSuggestedPassengerType(age: number, hasDisability: boolean = false): {
  type: 'ADULT' | 'CHILD' | 'INFANT' | 'SENIOR' | 'DISABLED';
  reason: string;
  discount: number;
} {
  if (hasDisability) {
    return {
      type: 'DISABLED',
      reason: 'Tarif réduit pour personne en situation de handicap',
      discount: 40,
    };
  }

  if (age >= 0 && age <= 1) {
    return {
      type: 'INFANT',
      reason: 'Tarif bébé (0-1 an)',
      discount: 80,
    };
  } else if (age >= 2 && age <= 11) {
    return {
      type: 'CHILD',
      reason: 'Tarif enfant (2-11 ans)',
      discount: 50,
    };
  } else if (age >= 60) {
    return {
      type: 'SENIOR',
      reason: 'Tarif senior (60+ ans)',
      discount: 30,
    };
  } else {
    return {
      type: 'ADULT',
      reason: 'Tarif adulte (prix plein)',
      discount: 0,
    };
  }
}

/**
 * Format discount information for display
 * @param discountPercent - Discount percentage
 * @param basePrice - Original price
 * @returns Formatted discount text
 */
export function formatDiscountInfo(discountPercent: number, basePrice: number): string {
  if (discountPercent === 0) {
    return 'Prix plein';
  }

  const discountAmount = (basePrice * discountPercent) / 100;
  const finalPrice = basePrice - discountAmount;

  return `Réduction de ${discountPercent}% (-${discountAmount.toFixed(0)} FC) = ${finalPrice.toFixed(0)} FC`;
}
