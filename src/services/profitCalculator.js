export function calculateFees({ ebayPrice }) {
  const ebayFee = round2(ebayPrice * 0.08)
  const paymentFee = round2(ebayPrice * 0.03)
  return { ebayFee, paymentFee, totalFees: round2(ebayFee + paymentFee) }
}

export function calculateProfit({
  ebayPrice,
  amazonCost,
  ebayFeeRate = 0.08,
  paymentFeeRate = 0.03,
}) {
  const ebayFee = round2(ebayPrice * ebayFeeRate)
  const paymentFee = round2(ebayPrice * paymentFeeRate)
  const netProfit = round2(ebayPrice - amazonCost - ebayFee - paymentFee)
  const margin = ebayPrice > 0 ? round2((netProfit / ebayPrice) * 100) : 0

  return { ebayFee, paymentFee, netProfit, margin }
}

export function suggestedEbayPrice({ amazonCost, targetMarginPct = 20 }) {
  // Solve: netProfit = ebayPrice - amazonCost - 0.16*ebayPrice
  // margin% ~= netProfit/ebayPrice. Use a simple target by adding markup.
  const markup = 1 + targetMarginPct / 100
  return round2(amazonCost * markup)
}

export function marketIndicator({ margin }) {
  if (margin >= 20) return { label: 'GOOD', color: 'green' }
  if (margin >= 10) return { label: 'RISKY', color: 'amber' }
  return { label: 'BAD', color: 'red' }
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

