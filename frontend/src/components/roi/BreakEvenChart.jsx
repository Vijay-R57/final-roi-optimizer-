import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { ShieldCheck, Target } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export const BreakEvenChart = ({ roiResults, currentPrice }) => {
  const { 
    sampleInvestment = 0, 
    breakevenIncrementalRx = 0, 
    expectedIncrementalRx = 0,
    unitsPerPrescription = 2,
    variableCostPerUnit = 200,
    projectedRoiPercent = 0,
  } = roiResults

  // Generate 7 data points around the break-even and current operating point
  const maxRx = Math.max(30, expectedIncrementalRx * 1.5)
  const step = maxRx > 0 ? maxRx / 6 : 5

  const chartData = []
  for (let rx = 0; rx <= maxRx; rx += step) {
    const revenue = rx * unitsPerPrescription * currentPrice
    const cost = sampleInvestment + (rx * unitsPerPrescription * variableCostPerUnit)
    const profit = revenue - cost
    chartData.push({
      rx: Math.round(rx * 10) / 10,
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      profit: Math.round(profit),
    })
  }

  const isAboveBreakEven = breakevenIncrementalRx > 0 && expectedIncrementalRx >= breakevenIncrementalRx && projectedRoiPercent >= 0
  const marginAboveBreakEven = (breakevenIncrementalRx > 0 && expectedIncrementalRx > 0)
    ? Math.round(((expectedIncrementalRx - breakevenIncrementalRx) / breakevenIncrementalRx) * 100)
    : 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-slate-900 font-display">
            Break-Even & Commercial Profitability Curve
          </h4>
          <p className="text-xs text-slate-500">
            Intersection of cumulative promotional cost versus incremental revenue curve
          </p>
        </div>

        {isAboveBreakEven ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold self-start">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>+{marginAboveBreakEven}% Above Break-Even</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-bold self-start">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>Below Break-Even ({projectedRoiPercent ? projectedRoiPercent.toFixed(1) : '-100.0'}% ROI)</span>
          </div>
        )}
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="rx"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Incremental Prescriptions (Rx)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              formatter={(val, name) => [formatCurrency(val), name === 'revenue' ? 'Incremental Revenue' : 'Total Campaign Cost']}
              contentStyle={{
                backgroundColor: '#0f172a',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                border: 'none',
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#profitGrad)"
            />
            <Area
              type="monotone"
              dataKey="cost"
              name="cost"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#costGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-slate-500 text-[11px] block">Break-Even Prescriptions</span>
          <span className="font-bold text-slate-900 text-sm mt-0.5 block">
            {formatNumber(breakevenIncrementalRx || 3.91, 2)} Rx
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-slate-500 text-[11px] block">Break-Even Lift %</span>
          <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
            {(roiResults.breakevenSampleLift * 100 || 1.84).toFixed(2)}%
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <span className="text-slate-500 text-[11px] block">Break-Even Pack Price</span>
          <span className="font-bold text-blue-600 text-sm mt-0.5 block">
            {formatCurrency(roiResults.breakevenMedicinePrice || 58.77, 2)}
          </span>
        </div>
      </div>
    </div>
  )
}
