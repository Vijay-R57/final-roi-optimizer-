import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { MapPin } from 'lucide-react'
import { formatNumber, formatCurrency } from '../../utils/formatters'

export const TerritoryComparisonChart = ({ zones }) => {
  const [activeMetric, setActiveMetric] = useState('samples')

  const chartData = zones.map((z) => {
    const samples = z.Samples || z.samples || 3000
    const demand = z.Expected_Demand || z.expected_demand || 60
    const incrRx = demand * 0.10
    const revenue = incrRx * 2 * 120
    const cost = samples * 0.0587
    const profit = revenue - (incrRx * 2 * 45)
    const roi = cost > 0 ? ((profit - cost) / cost) * 100 : 444.5

    return {
      name: z.zone?.replace(' Chennai', '') || z.zone,
      fullName: z.zone,
      samples,
      rx: Math.round(incrRx * 10) / 10,
      revenue: Math.round(revenue),
      roi: Math.round(roi),
    }
  })

  const metricConfigs = {
    samples: {
      label: 'Sample Units Allocated',
      dataKey: 'samples',
      color: '#2563eb', // blue-600
      formatter: (v) => `${formatNumber(v)} units`,
    },
    rx: {
      label: 'Expected Incremental Prescriptions (Rx)',
      dataKey: 'rx',
      color: '#10b981', // emerald-500
      formatter: (v) => `+${v} Rx`,
    },
    revenue: {
      label: 'Expected Incremental Revenue (₹)',
      dataKey: 'revenue',
      color: '#6366f1', // indigo-500
      formatter: (v) => formatCurrency(v),
    },
    roi: {
      label: 'Territory Return on Investment (ROI %)',
      dataKey: 'roi',
      color: '#f59e0b', // amber-500
      formatter: (v) => `+${v}% ROI`,
    },
  }

  const current = metricConfigs[activeMetric]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-slate-900 font-display">
            Territory Comparison Analytics
          </h4>
          <p className="text-xs text-slate-500">
            Compare regional allocation efficiency and commercial returns
          </p>
        </div>

        {/* Metric Toggle Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start">
          <button
            onClick={() => setActiveMetric('samples')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'samples'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Samples
          </button>
          <button
            onClick={() => setActiveMetric('rx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'rx'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Incr. Rx
          </button>
          <button
            onClick={() => setActiveMetric('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'revenue'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveMetric('roi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'roi'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ROI %
          </button>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="fullName" tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              formatter={(val) => [current.formatter(val), current.label]}
              contentStyle={{
                backgroundColor: '#0f172a',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                border: 'none',
              }}
            />
            <Bar dataKey={current.dataKey} fill={current.color} radius={[8, 8, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
