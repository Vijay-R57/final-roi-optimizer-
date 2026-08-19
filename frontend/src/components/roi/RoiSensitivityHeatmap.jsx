import React from 'react'
import { Grid, Info } from 'lucide-react'
import { formatPercent } from '../../utils/formatters'

export const RoiSensitivityHeatmap = ({ sensitivityData }) => {
  const prices = [80, 120, 160, 200, 250, 300]

  const getCellBg = (roi) => {
    if (roi >= 1500) return 'bg-emerald-600 text-white font-bold'
    if (roi >= 1000) return 'bg-emerald-500 text-white font-bold'
    if (roi >= 500)  return 'bg-emerald-100 text-emerald-950 font-bold'
    if (roi >= 200)  return 'bg-blue-100 text-blue-950 font-semibold'
    if (roi >= 50)   return 'bg-blue-50 text-blue-900 font-medium'
    if (roi >= 0)    return 'bg-slate-100 text-slate-800'
    return 'bg-rose-100 text-rose-800 font-bold'
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900 font-display">
            Multi-Scenario ROI Sensitivity Heatmap
          </h4>
          <p className="text-xs text-slate-500">
            Projected promotional ROI % across varying medicine prices and sample lift assumptions
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-block w-3 h-3 rounded bg-blue-50 border border-blue-200" />
          <span>Moderate</span>
          <span className="inline-block w-3 h-3 rounded bg-emerald-500 ml-2" />
          <span>High ROI</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-center text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4 text-left">Sample Lift %</th>
              {prices.map((p) => (
                <th key={p} className="py-3 px-3">
                  ₹{p} / pack
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {sensitivityData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-4 text-left font-bold text-slate-900 bg-slate-50/40">
                  {row.liftPercent}
                </td>
                {prices.map((p) => {
                  const val = row[`price_${p}`] !== undefined ? row[`price_${p}`] : (row[`Price_${p}`] || 0)
                  return (
                    <td key={p} className="py-2.5 px-3">
                      <div
                        title={`Lift: ${row.liftPercent} | Price: ₹${p} | ROI: +${val}%`}
                        className={`py-1.5 px-2 rounded-lg text-xs transition-all hover:scale-105 cursor-pointer ${getCellBg(val)}`}
                      >
                        +{val.toFixed(1)}%
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
