import React, { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function HCPRanking({ result }) {
  const [search, setSearch] = useState('')
  if (!result) return <div className="text-gray-400 py-20 text-center">Run the pipeline first.</div>

  const hcps = result.prescriber_distribution || []
  const filtered = hcps.filter(h=>
    !search || Object.values(h).some(v=>String(v).toLowerCase().includes(search.toLowerCase()))
  )

  const catColor = { 'Very High':'#22c55e','High':'#3b82f6','Medium':'#f59e0b','Low':'#94a3b8' }
  const scatterData = hcps.slice(0,200).map(h=>({
    x: h.Expected_3M_Demand, y: h.Potential_Score,
    cat: h.Potential_Category, name: h.hcp_id
  }))

  return (
    <div className="max-w-6xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">HCP Ranking — Top {hcps.length}</h2>

      {/* Universe stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ['Master HCPs',    result.hcp_universe?.master?.toLocaleString()],
          ['Predicted',      result.hcp_universe?.predicted?.toLocaleString()],
          ['With History',   result.hcp_universe?.with_history?.toLocaleString()],
          ['Selected Top N', result.hcp_universe?.selected],
        ].map(([l,v])=>(
          <div key={l} className="bg-white border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{v||'-'}</div>
            <div className="text-xs text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Scatter */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Demand vs Potential Score</h3>
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart><CartesianGrid/>
            <XAxis type="number" dataKey="x" name="3M Demand" label={{value:'Expected 3M Demand',position:'insideBottom',offset:-5}}/>
            <YAxis type="number" dataKey="y" name="Pot. Score" label={{value:'Potential Score',angle:-90,position:'insideLeft'}}/>
            <Tooltip cursor={{strokeDasharray:'3 3'}}
              content={({payload})=>payload?.length?
                <div className="bg-white border rounded p-2 text-xs shadow">
                  <div>{payload[0]?.payload?.name}</div>
                  <div>Demand: {payload[0]?.payload?.x?.toFixed(2)}</div>
                  <div>PotScore: {payload[0]?.payload?.y?.toFixed(1)}</div>
                </div>:null}/>
            <Scatter data={scatterData} fill="#3b82f6"
              shape={(props)=>{
                const fill=catColor[props.payload?.cat]||'#3b82f6'
                return <circle cx={props.cx} cy={props.cy} r={4} fill={fill} fillOpacity={0.7}/>
              }}/>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2 text-xs">
          {Object.entries(catColor).map(([cat,color])=>(
            <div key={cat} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{background:color}}/>
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">HCP List</h3>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search HCPs..."
            className="border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-gray-600 text-xs uppercase">
                {['Rank','HCP ID','Name','Specialty','Zone','3M Demand','Pot Score','Category','Samples'].map(h=>
                  <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h,i)=>(
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-500">{i+1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{h.hcp_id}</td>
                  <td className="px-3 py-2">{h.hcp_name}</td>
                  <td className="px-3 py-2">{h.specialty}</td>
                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{h.zone}</span></td>
                  <td className="px-3 py-2 font-semibold">{h.Expected_3M_Demand?.toFixed(2)}</td>
                  <td className="px-3 py-2">{h.Potential_Score?.toFixed(1)}</td>
                  <td className="px-3 py-2">
                    <span style={{background:(catColor[h.Potential_Category]||'#94a3b8')+'20',color:catColor[h.Potential_Category]||'#64748b'}}
                      className="px-2 py-0.5 rounded text-xs font-medium">{h.Potential_Category}</span>
                  </td>
                  <td className="px-3 py-2 font-bold text-blue-700">{h.Samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
