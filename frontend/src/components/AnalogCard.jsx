import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AnalogCard({ result }) {
  if (!result) return <div className="text-gray-400 py-20 text-center">Run the pipeline first.</div>
  const an = result.analog
  const cands = result.analog_candidates || result.candidate_medicines || []

  const scores = [
    { name:'Profile',  value: an?.profile   || 0 },
    { name:'Behavior', value: an?.behavior  || 0 },
    { name:'Quality',  value: an?.data_quality || 0 },
    { name:'Final',    value: an?.score     || 0 },
  ]
  const COLORS=['#3b82f6','#10b981','#f59e0b','#6366f1']

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Analog Selection</h2>

      {/* Selected analog */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-800">{an?.generic_name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold
                ${an?.form_compat ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                Tier {an?.tier} | {an?.form_compat ? 'Form Match' : 'No Form Match'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {an?.brand_name} · {an?.dosage_form} {an?.strength}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-700">
              {an?.score ? (an.score*100).toFixed(1) : '-'}%
            </div>
            <div className="text-xs text-gray-500">Final Score</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-800">{an?.historical_events?.toLocaleString()||'-'}</div>
            <div className="text-xs text-gray-500">Historical Events</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-800">{an?.active_hcps?.toLocaleString()||'-'}</div>
            <div className="text-xs text-gray-500">Active HCPs</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-800">{an?.historical_months||'-'}</div>
            <div className="text-xs text-gray-500">Months of Data</div>
          </div>
        </div>
      </div>

      {/* Score breakdown chart */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Score Breakdown</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={scores} layout="vertical">
            <XAxis type="number" domain={[0,1]} tickFormatter={v=>`${(v*100).toFixed(0)}%`}/>
            <YAxis type="category" dataKey="name" width={70}/>
            <Tooltip formatter={v=>`${(v*100).toFixed(1)}%`}/>
            <Bar dataKey="value" radius={[0,4,4,0]}>
              {scores.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 table */}
      {cands.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Top Candidates</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  {['Rank','ID','Generic','Form','Strength','Profile','Behavior','Quality','Score','Tier'].map(h=>
                    <th key={h} className="px-3 py-2 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {cands.map((c,i)=>(
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{c.Rank}</td>
                    <td className="px-3 py-2 font-mono text-xs">{c.medicine_id}</td>
                    <td className="px-3 py-2">{c.generic_name}</td>
                    <td className="px-3 py-2">{c.dosage_form}</td>
                    <td className="px-3 py-2">{c.strength}</td>
                    <td className="px-3 py-2">{c.Profile_Similarity?.toFixed(3)}</td>
                    <td className="px-3 py-2">{c.Behavior_Similarity?.toFixed(3)}</td>
                    <td className="px-3 py-2">{c.Data_Quality?.toFixed(3)}</td>
                    <td className="px-3 py-2 font-semibold text-blue-700">{c.Final_Analog_Score?.toFixed(4)}</td>
                    <td className="px-3 py-2">{c.Segment_Tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
