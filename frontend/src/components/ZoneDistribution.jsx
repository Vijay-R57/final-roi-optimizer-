import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444']

export default function ZoneDistribution({ result }) {
  if (!result) return <div className="text-gray-400 py-20 text-center">Run the pipeline first.</div>
  const zones = result.zone_distribution || []
  const total  = zones.reduce((s,z)=>s+z.Samples,0)

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Chennai Zone Distribution</h2>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-center text-green-700 font-semibold">
        Zone Total: {total.toLocaleString()} samples {total===result.total_samples ? '✓ EXACT' : ''}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Sample Distribution</h3>
          <PieChart width={340} height={280}>
            <Pie data={zones} dataKey="Samples" nameKey="zone" cx="50%" cy="50%"
              outerRadius={100} label={({zone,Percentage})=>`${zone}: ${Percentage}%`}>
              {zones.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip formatter={(v,n)=>[v.toLocaleString(), n]}/>
          </PieChart>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Zone Details</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className="px-3 py-2 text-left">Zone</th>
                <th className="px-3 py-2 text-right">HCPs</th>
                <th className="px-3 py-2 text-right">Demand</th>
                <th className="px-3 py-2 text-right">Samples</th>
                <th className="px-3 py-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z,i)=>(
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                    {z.zone}
                  </td>
                  <td className="px-3 py-2 text-right">{z.HCP_Count}</td>
                  <td className="px-3 py-2 text-right">{z.Expected_Demand?.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{z.Samples?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{z.Percentage}%</td>
                </tr>
              ))}
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-3 py-2">TOTAL</td>
                <td className="px-3 py-2 text-right">{zones.reduce((s,z)=>s+z.HCP_Count,0)}</td>
                <td className="px-3 py-2 text-right">{zones.reduce((s,z)=>s+(z.Expected_Demand||0),0).toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{total.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
