import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ModelPerformance({ result }) {
  if (!result) return <div className="text-gray-400 py-20 text-center">Run the pipeline first.</div>
  const m = result.model
  const fi = result.feature_importance || []

  // Build comparison data from result
  const allModels = []
  const dm = result.direct_val_metrics || {}
  const dtm = result.direct_test_metrics || {}
  const dlm = result.direct_val_metrics_log || {}
  const dlt = result.direct_test_metrics_log || {}
  const tvm = result.two_stage_val_metrics || {}
  const ttm = result.two_stage_test_metrics || {}

  Object.keys(dm).forEach(nm=>{
    allModels.push({name:`Direct_${nm}`,valMAE:dm[nm]?.MAE,testMAE:dtm[nm]?.MAE,testR2:dtm[nm]?.R2})
  })
  Object.keys(dlm).forEach(nm=>{
    allModels.push({name:`Log_${nm}`,valMAE:dlm[nm]?.MAE,testMAE:dlt[nm]?.MAE,testR2:dlt[nm]?.R2})
  })
  Object.keys(tvm).forEach(nm=>{
    allModels.push({name:`2Stage_${nm}`,valMAE:tvm[nm]?.MAE,testMAE:ttm[nm]?.MAE,testR2:ttm[nm]?.R2})
  })

  // Feature groups
  const grpMap = {}
  fi.forEach(f=>{ grpMap[f.Group]=(grpMap[f.Group]||0)+f.Importance })
  const grpData = Object.entries(grpMap).map(([Group,Importance])=>({Group,Importance:+Importance.toFixed(4)}))
    .sort((a,b)=>b.Importance-a.Importance)

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Model Performance</h2>

      {/* Selected model */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><div className="text-xs text-blue-600 uppercase font-semibold">Selected Pipeline</div>
             <div className="font-bold text-blue-800">{m?.best_pipeline||'-'}</div></div>
        <div><div className="text-xs text-blue-600 uppercase font-semibold">Val MAE</div>
             <div className="font-bold text-blue-800">{m?.val_mae?.toFixed(4)||'-'}</div></div>
        <div><div className="text-xs text-blue-600 uppercase font-semibold">Val NDCG@100</div>
             <div className="font-bold text-blue-800">{m?.val_ndcg100?.toFixed(4)||'-'}</div></div>
        <div><div className="text-xs text-blue-600 uppercase font-semibold">Blend</div>
             <div className="font-bold text-blue-800">{m?.blend_w_demand ? `${(m.blend_w_demand*100).toFixed(0)}% D + ${(m.blend_w_pot*100).toFixed(0)}% P` : '-'}</div></div>
      </div>

      {/* MAE comparison */}
      {allModels.length>0 && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Validation MAE Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={allModels}>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="valMAE" fill="#3b82f6" name="Val MAE" radius={[4,4,0,0]}/>
              <Bar dataKey="testMAE" fill="#10b981" name="Test MAE" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feature importance */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Top 20 Features</h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {fi.map((f,i)=>(
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-5 text-gray-400 text-right">{i+1}.</div>
                <div className="flex-1 truncate text-gray-700">{f.Feature}</div>
                <div className="w-14 text-right font-mono text-xs text-gray-500">{f.Importance.toFixed(4)}</div>
                <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{f.Group}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Importance by Group</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={grpData} layout="vertical">
              <XAxis type="number"/>
              <YAxis type="category" dataKey="Group" width={120} tick={{fontSize:11}}/>
              <Tooltip/>
              <Bar dataKey="Importance" fill="#6366f1" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
