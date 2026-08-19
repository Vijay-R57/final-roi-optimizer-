import React from 'react'
import { Sliders, Package, Percent, DollarSign, Calendar, Globe } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export const CampaignConfigForm = ({ settings, onChange }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Campaign & Budget Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Set inventory limits, unit economics, and target promotional lift
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/80">
          Step 2: Inventory & ROI
        </span>
      </div>

      <div className="space-y-4">
        {/* Total Samples */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Total Available Samples (Inventory Budget)
            </label>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {formatNumber(settings.total_samples)} units
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="50000"
            step="500"
            value={settings.total_samples}
            onChange={(e) => onChange({ ...settings, total_samples: parseInt(e.target.value) || 1000 })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1,000</span>
            <span>10,000 (Standard)</span>
            <span>25,000</span>
            <span>50,000</span>
          </div>
        </div>

        {/* Expected Sample Lift Slider */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Expected Sample Lift (% incremental prescribing)
            </label>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {(settings.expected_sample_lift * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.30"
            step="0.005"
            value={settings.expected_sample_lift}
            onChange={(e) => onChange({ ...settings, expected_sample_lift: parseFloat(e.target.value) || 0.05 })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Assumed percentage increase in doctor's prescription rate resulting from sample drop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Sample Unit Cost */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Production Cost per Sample (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={settings.sample_cost}
                onChange={(e) => onChange({ ...settings, sample_cost: parseFloat(e.target.value) || 0.01 })}
                className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Direct packaging & delivery cost
            </p>
          </div>

          {/* Units per Rx */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Avg. Units per Prescription
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max="10"
              value={settings.average_units_per_prescription}
              onChange={(e) => onChange({ ...settings, average_units_per_prescription: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Packs filled per patient script (typically 2)
            </p>
          </div>

          {/* Variable Cost / Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Commercial Variable Cost (₹ / unit)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={settings.variable_cost_per_unit}
                onChange={(e) => onChange({ ...settings, variable_cost_per_unit: parseFloat(e.target.value) || 0 })}
                className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              COGS & distribution per sold unit
            </p>
          </div>

          {/* Target Geography */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Geography Focus
            </label>
            <select
              value={settings.target_geography}
              onChange={(e) => onChange({ ...settings, target_geography: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium"
            >
              <option value="Pan-India / Metropolitan Focus">Pan-India / Metropolitan Focus</option>
              <option value="South Territory (Chennai / Bengaluru)">South Territory (Chennai / Bengaluru)</option>
              <option value="North Territory (Delhi / NCR)">North Territory (Delhi / NCR)</option>
              <option value="West Territory (Mumbai / Pune)">West Territory (Mumbai / Pune)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Sales territory alignment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
