/**
 * Formatting utilities for enterprise pharma analytics
 */

export const formatCurrency = (val, decimals = 0) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val)
}

export const formatNumber = (val, decimals = 0) => {
  if (val === null || val === undefined || isNaN(val)) return '0'
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val)
}

export const formatPercent = (val, decimals = 1, isFraction = false) => {
  if (val === null || val === undefined || isNaN(val)) return '0.0%'
  const num = isFraction ? val * 100 : val
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`
}

export const formatPercentRaw = (val, decimals = 1, isFraction = false) => {
  if (val === null || val === undefined || isNaN(val)) return '0.0%'
  const num = isFraction ? val * 100 : val
  return `${num.toFixed(decimals)}%`
}

export const getTierBadge = (tier) => {
  const t = String(tier || '').toLowerCase()
  if (t.includes('very high') || t.includes('tier 1') || t === '1' || t === 'high') {
    return {
      label: 'HIGH POTENTIAL',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
      badgeClass: 'bg-emerald-500',
    }
  }
  if (t.includes('medium') || t.includes('tier 2') || t === '2') {
    return {
      label: 'MEDIUM POTENTIAL',
      color: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
      badgeClass: 'bg-amber-500',
    }
  }
  return {
    label: 'LOW POTENTIAL',
    color: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/20',
    badgeClass: 'bg-slate-400',
  }
}
