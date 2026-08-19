import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function SampleAllocation({ result }) {
  if (!result) return <div className="text-gray-400 py-20 text-center">Run the pipeline first.</div>
  const hcps = (result.prescriber_distribution || []).slice(0, 30)
  const stats = result.alloc_stats || {}

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Sample Allocation</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[['Requested', result.total_samples?.toLocaleString()],
          ['Allocated', result.allocated_samples?.toLocaleString()],
          ['Max per HCP', stats.max],
          ['Min per HCP', stats.min]].map(([l,v])=>(
          <div key={l} className="bg-white border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{v||'-'}</div>
            <div className="text-xs text-gray-500 mt-1">{l}</div>
          </div>
        ))}
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-center text-green-700 font-semibold">
        Difference: {(result.total_samples||0)-(result.allocated_samples||0)} samples
        {(result.total_samples||0)===(result.allocated_samples||0) ? ' ✓ EXACT' : ''}
      </div>
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Top 30 HCP Sample Allocations</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={hcps.map((h,i)=>({name:`#${i+1}`,samples:h.Samples,hcp:h.hcp_id}))}>
            <XAxis dataKey="name" tick={{fontSize:10}}/>
            <YAxis/>
            <Tooltip content={({payload,label})=>payload?.length?
              <div className="bg-white border rounded p-2 text-xs shadow">
                <div>Rank: {label}</div>
                <div>HCP: {payload[0]?.payload?.hcp}</div>
                <div>Samples: {payload[0]?.value}</div>
              </div>:null}/>
            <Bar dataKey="samples" fill="#3b82f6" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
