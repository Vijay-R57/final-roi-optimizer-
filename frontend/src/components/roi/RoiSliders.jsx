import React from 'react'
import { Sliders, RefreshCw, Zap, TrendingUp } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export const RoiSliders = ({ params, onChange, onReset }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 font-display">
              Interactive Scenario Controls
            </h4>
            <p className="text-xs text-slate-500">
              Adjust variables in real-time to observe dynamic financial impact
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Slider 1: Sample Lift */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Expected Sample Lift (%)
            </label>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {(params.lift * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.30"
            step="0.005"
            value={params.lift}
            onChange={(e) => onChange({ ...params, lift: parseFloat(e.target.value) || 0.05 })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1% (Minimal)</span>
            <span>10% (Baseline)</span>
            <span>20% (Optimistic)</span>
            <span>30% (High)</span>
          </div>
        </div>

        {/* Slider 2: Medicine Price */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Commercial Medicine Price (₹)
            </label>
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {formatCurrency(params.price)}
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            step="5"
            value={params.price}
            onChange={(e) => onChange({ ...params, price: parseFloat(e.target.value) || 120 })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>₹50</span>
            <span>₹120 (Standard)</span>
            <span>₹250</span>
            <span>₹500</span>
          </div>
        </div>

        {/* Slider 3: Total Samples */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Total Sample Units
            </label>
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              {formatNumber(params.totalSamples)} units
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={params.totalSamples}
            onChange={(e) => onChange({ ...params, totalSamples: parseInt(e.target.value) || 1000 })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1,000</span>
            <span>10,000 (Target)</span>
            <span>25,000</span>
            <span>50,000</span>
          </div>
        </div>

        {/* Slider 4: Units per Rx */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Units per Prescription
            </label>
            <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              {params.unitsPerRx} packs / script
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={params.unitsPerRx}
            onChange={(e) => onChange({ ...params, unitsPerRx: parseInt(e.target.value) || 1 })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 Pack</span>
            <span>2 Packs (Standard)</span>
            <span>3 Packs</span>
            <span>5 Packs</span>
          </div>
        </div>
      </div>
    </div>
  )
}
