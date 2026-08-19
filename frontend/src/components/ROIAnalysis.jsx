import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function ROIAnalysis({ result }) {
  if (!result) return <div className="text-gray-400 py-20 text-center">Run the pipeline first.</div>
  const roi = result.roi_base || {}
  const scen = Object.entries(result.roi_scenarios || {}).map(([name,sv])=>({
    name, lift:`${(sv.lift*100).toFixed(0)}%`,
    roi_pct: sv.projected_roi_percent,
    profit: sv.expected_incremental_profit,
    revenue: sv.expected_revenue,
  }))

  const roiPct = result.roi?.projected_roi_percent
  const isNeg  = roiPct < 0

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">ROI Analysis</h2>

      {/* Base ROI */}
      <div className={`border rounded-lg p-6 mb-6 ${isNeg?'bg-red-50 border-red-200':'bg-green-50 border-green-200'}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-700">Base Scenario (10% lift)</h3>
            {isNeg && (
              <p className="text-sm text-red-600 mt-1">
                ROI is negative under supplied assumptions. Break-even requires a higher lift or price.
              </p>
            )}
          </div>
          <div className={`text-4xl font-bold ${isNeg?'text-red-600':'text-green-600'}`}>
            {roiPct?.toFixed(2)}%
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            ['Investment', `Rs.${result.roi?.sample_investment?.toLocaleString(undefined,{maximumFractionDigits:0})}`],
            ['Revenue',    `Rs.${result.roi?.expected_revenue?.toLocaleString(undefined,{maximumFractionDigits:0})}`],
            ['Variable Cost', `Rs.${result.roi?.expected_variable_cost?.toLocaleString(undefined,{maximumFractionDigits:0})}`],
            ['Incr. Profit',  `Rs.${result.roi?.expected_incremental_profit?.toLocaleString(undefined,{maximumFractionDigits:0})}`],
          ].map(([l,v])=>(
            <div key={l} className="text-center">
              <div className="font-bold text-gray-800 text-lg">{v||'-'}</div>
              <div className="text-xs text-gray-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scenarios chart */}
      {scen.length>0 && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">ROI by Scenario</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scen}>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tickFormatter={v=>`${v.toFixed(0)}%`}/>
              <Tooltip formatter={(v,n)=>[`${v.toFixed(2)}%`,n]}/>
              <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3"/>
              <Bar dataKey="roi_pct" name="ROI %" radius={[4,4,0,0]}
                fill="#3b82f6"
                label={{position:'top',formatter:v=>`${v.toFixed(1)}%`,fontSize:10}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Break-even */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Break-even Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Required Lift',   `${(result.roi?.breakeven_sample_lift*100||0).toFixed(1)}%`],
            ['Required Price',  `Rs.${result.roi?.breakeven_medicine_price?.toLocaleString(undefined,{maximumFractionDigits:0})}`],
            ['Max Sample Cost', `Rs.${result.roi?.breakeven_sample_cost?.toFixed(2)}`],
            ['Required Rx',     result.roi?.breakeven_incremental_prescriptions?.toFixed(0)],
          ].map(([l,v])=>(
            <div key={l} className="bg-amber-50 border border-amber-200 rounded p-3 text-center">
              <div className="font-bold text-amber-800 text-lg">{v||'-'}</div>
              <div className="text-xs text-amber-600">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 italic">{result.roi?.disclaimer}</p>
    </div>
  )
}
