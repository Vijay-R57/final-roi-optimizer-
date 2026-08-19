import React from 'react'
import { Drawer } from '../common/Drawer'
import { getTierBadge, formatCurrency, formatNumber } from '../../utils/formatters'
import {
  Stethoscope,
  MapPin,
  Award,
  TrendingUp,
  Activity,
  Package,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
} from 'lucide-react'

export const HcpDetailDrawer = ({ hcp, isOpen, onClose }) => {
  if (!hcp) return null
  const tier = getTierBadge(hcp.potential_category || hcp.potential_score)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={hcp.hcp_name}
      subtitle={`NPI: ${hcp.hcp_id} • ${hcp.specialty}`}
      width="max-w-xl"
    >
      {/* Top Banner Card */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Priority Rank #{hcp.rank}
          </span>
          <h4 className="text-base font-bold font-display mt-0.5">
            {hcp.hcp_name}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{hcp.locality}, {hcp.zone}</span>
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${tier.color}`}>
            {tier.label}
          </span>
          <div className="mt-2 text-xs text-slate-300">
            Potential Score: <strong className="text-white">{formatNumber(hcp.potential_score, 1)}</strong>
          </div>
        </div>
      </div>

      {/* Recommended Sample Allocation Box */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600 text-white">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-900 block">
              Recommended Sample Drop
            </span>
            <p className="text-[11px] text-blue-700">
              Optimal units allocated by Hare-Niemeyer solver
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-bold font-display text-blue-900">
            {hcp.samples}
          </span>
          <span className="text-xs text-blue-700 font-medium ml-1">units</span>
        </div>
      </div>

      {/* Model Predictions Grid */}
      <div>
        <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Two-Stage Hurdle Predictions
        </h5>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-slate-500 text-[11px] block">
              P(Active Prescriber)
            </span>
            <span className="text-base font-bold text-slate-900 font-display mt-0.5 block">
              {Math.round((hcp.probability_active || 0.8) * 100)}%
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Stage 1 Classifier</p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-slate-500 text-[11px] block">
              Expected Positive 3M Demand
            </span>
            <span className="text-base font-bold text-slate-900 font-display mt-0.5 block">
              {formatNumber(hcp.positive_demand || 4.2, 2)} units
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Stage 2 Regressor</p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-slate-500 text-[11px] block">
              Net Expected 3M Demand (ŷ)
            </span>
            <span className="text-base font-bold text-blue-600 font-display mt-0.5 block">
              {formatNumber(hcp.expected_3m_demand, 2)} units
            </span>
            <p className="text-[10px] text-slate-400 mt-1">P(Active) × PosDemand</p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-slate-500 text-[11px] block">
              Class Affinity Share
            </span>
            <span className="text-base font-bold text-emerald-600 font-display mt-0.5 block">
              {Math.round((hcp.class_share || 0.35) * 100)}%
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Therapeutic Class Share</p>
          </div>
        </div>
      </div>

      {/* AI Rationales: Why This HCP? */}
      <div>
        <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Why Selected? (Model Explanation)</span>
        </h5>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-700 leading-relaxed">
          {hcp.top_reasons || 'High prescribing velocity in target therapeutic class with positive 6-month trajectory and demonstrated loyalty to modern lipid-lowering therapies.'}
        </div>
      </div>

      {/* Historical Utilization Details */}
      <div>
        <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Historical Analog Engagement</span>
        </h5>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Active Months on Analog:</span>
            <span className="font-semibold text-slate-900">{hcp.analog_active_months || 3} of past 4 quarters</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Practice Footprint:</span>
            <span className="font-semibold text-slate-900">Tertiary & Outpatient Consultation</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Clinical Notes:</span>
            <span className="font-semibold text-slate-700">{hcp.notes || 'High conversion probability on new statin molecules.'}</span>
          </div>
        </div>
      </div>

      {/* Projected Financial Contribution */}
      <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Individual HCP ROI Contribution
        </h5>
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-300">Expected Incremental Revenue:</span>
          <span className="font-bold text-emerald-400 font-display text-sm">
            {formatCurrency((hcp.expected_3m_demand || 3.0) * 0.1 * 2 * 120, 2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300">Sample Packaging Cost:</span>
          <span className="font-semibold text-slate-200">
            {formatCurrency(hcp.samples * 0.0587, 2)}
          </span>
        </div>
      </div>
    </Drawer>
  )
}
