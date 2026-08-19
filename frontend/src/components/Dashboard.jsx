import React from 'react'

function Stat({ label, value, sub, color='blue' }) {
  const colors={blue:'bg-blue-50 border-blue-200 text-blue-800',
                green:'bg-green-50 border-green-200 text-green-800',
                amber:'bg-amber-50 border-amber-200 text-amber-800',
                red:'bg-red-50 border-red-200 text-red-800'}
  return (
    <div className={`border rounded-lg p-4 ${colors[color]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
    </div>
  )
}

export default function Dashboard({ result }) {
  if (!result) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-lg">No results yet.</p>
      <p className="text-sm mt-2">Go to <strong>Medicine Input</strong> and run the pipeline.</p>
    </div>
  )
  const r=result, an=r.analog, m=r.target, roi=r.roi||{}
  const vr=r.validation||{}
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard</h2>

      {/* Target + Analog */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Target Medicine" value={m?.generic_name||'-'} sub={`${m?.dosage_form} ${m?.strength}`} color="blue"/>
        <Stat label="Selected Analog" value={an?.generic_name||'-'} sub={`Tier ${an?.tier} | Score ${an?.score}`} color="green"/>
        <Stat label="Similarity Score" value={an?.score ? (an.score*100).toFixed(1)+'%' : '-'} sub="Profile+Behavior+Quality" color="blue"/>
        <Stat label="Form Compatible" value={an?.form_compat ? 'YES' : 'NO'} sub={`Dosage Form: ${an?.dosage_form||'-'}`} color={an?.form_compat?'green':'amber'}/>
      </div>

      {/* Dataset */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Events" value={r.dataset?.events?.toLocaleString()||'-'} color="blue"/>
        <Stat label="HCPs" value={r.dataset?.hcps?.toLocaleString()||'-'} color="blue"/>
        <Stat label="Medicines" value={r.dataset?.medicines||'-'} color="blue"/>
        <Stat label="Date Range" value={r.dataset?.date_range||'-'} color="blue"/>
      </div>

      {/* ML */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Best Pipeline" value={r.model?.best_pipeline||'-'} color="green"/>
        <Stat label="Val MAE" value={r.model?.val_mae?.toFixed(4)||'-'} color="green"/>
        <Stat label="NDCG@100 (Val)" value={r.model?.val_ndcg100?.toFixed(4)||'-'} color="green"/>
        <Stat label="Potential AUC" value={r.model?.potential_auc?.toFixed(4)||'-'} color="green"/>
      </div>

      {/* Allocation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="HCPs Predicted" value={r.hcp_universe?.predicted?.toLocaleString()||'-'} color="blue"/>
        <Stat label="Top 100 Selected" value={r.hcp_universe?.selected||'-'} color="green"/>
        <Stat label="Samples Allocated" value={r.allocated_samples?.toLocaleString()||'-'} color="green"/>
        <Stat label="Allocation Diff" value={((r.total_samples||0)-(r.allocated_samples||0))} color="green"/>
      </div>

      {/* ROI */}
      {roi.roi_pct !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat label="ROI" value={`${roi.roi_pct?.toFixed(2)||roi.projected_roi_percent?.toFixed(2)||'-'}%`}
                color={(roi.roi_pct||roi.projected_roi_percent)>=0?'green':'red'}/>
          <Stat label="Sample Investment" value={`Rs.${roi.sample_investment?.toLocaleString(undefined,{maximumFractionDigits:0})||'-'}`} color="amber"/>
          <Stat label="Incr. Profit" value={`Rs.${roi.profit?.toLocaleString(undefined,{maximumFractionDigits:0})||roi.expected_incremental_profit?.toLocaleString(undefined,{maximumFractionDigits:0})||'-'}`} color="amber"/>
          <Stat label="Break-even Lift" value={roi.breakeven_lift ? (roi.breakeven_lift*100).toFixed(1)+'%' : '-'} color="amber"/>
        </div>
      )}

      {/* Validation badges */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Validation Status</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(vr).map(([k,v])=>(
            typeof v === 'boolean' &&
            <span key={k} className={`px-2 py-1 rounded text-xs font-medium ${v?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
              {v?'✓':'✗'} {k.replace(/_/g,' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
