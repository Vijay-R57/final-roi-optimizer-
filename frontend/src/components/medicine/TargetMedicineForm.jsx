import React from 'react'
import { Pill, Sparkles, Tag, Layers, Stethoscope } from 'lucide-react'

const THERAPEUTIC_CLASSES = [
  'Lipid Lowering',
  'Antidiabetic',
  'Antihypertensive',
  'Cardiovascular',
  'Anti-Infective',
  'Respiratory',
  'Gastrointestinal',
  'Central Nervous System',
  'Pain Management',
]

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Inhaler',
  'Ointment',
  'Drops',
]

const PRESETS = [
  {
    label: 'Atorvastatin 10mg (Lipid Lowering)',
    generic: 'Atorvastatin',
    brand: 'Newstat',
    tc: 'Lipid Lowering',
    form: 'Tablet',
    strength: '10 mg',
    price: 120.0,
  },
  {
    label: 'Rosuvastatin 20mg (Cardiovascular)',
    generic: 'Rosuvastatin',
    brand: 'Crestoril',
    tc: 'Lipid Lowering',
    form: 'Tablet',
    strength: '20 mg',
    price: 165.0,
  },
  {
    label: 'Metformin 500mg (Antidiabetic)',
    generic: 'Metformin',
    brand: 'Glycinorm',
    tc: 'Antidiabetic',
    form: 'Tablet',
    strength: '500 mg',
    price: 85.0,
  },
  {
    label: 'Telmisartan 40mg (Antihypertensive)',
    generic: 'Telmisartan',
    brand: 'Telmikind',
    tc: 'Antihypertensive',
    form: 'Tablet',
    strength: '40 mg',
    price: 110.0,
  },
]

export const TargetMedicineForm = ({ medicine, onChange }) => {
  const handlePresetSelect = (preset) => {
    onChange({
      generic_name: preset.generic,
      brand_name: preset.brand,
      therapeutic_class: preset.tc,
      dosage_form: preset.form,
      strength: preset.strength,
      medicine_price: preset.price,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Target Medicine Profile
            </h3>
            <p className="text-xs text-slate-500">
              Configure the clinical and commercial parameters of the target drug
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/80">
          Step 1: Clinical Specs
        </span>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-2">
          Load Reference Preset:
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Generic Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Generic (Molecule) Name *
          </label>
          <input
            type="text"
            value={medicine.generic_name}
            onChange={(e) => onChange({ ...medicine, generic_name: e.target.value })}
            placeholder="e.g. Atorvastatin"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
          />
        </div>

        {/* Brand Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Commercial Brand Name *
          </label>
          <input
            type="text"
            value={medicine.brand_name}
            onChange={(e) => onChange({ ...medicine, brand_name: e.target.value })}
            placeholder="e.g. Newstat"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
          />
        </div>

        {/* Therapeutic Class */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Therapeutic Class *
          </label>
          <select
            value={medicine.therapeutic_class}
            onChange={(e) => onChange({ ...medicine, therapeutic_class: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
          >
            {THERAPEUTIC_CLASSES.map((tc) => (
              <option key={tc} value={tc}>
                {tc}
              </option>
            ))}
          </select>
        </div>

        {/* Dosage Form */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Dosage Form *
          </label>
          <select
            value={medicine.dosage_form}
            onChange={(e) => onChange({ ...medicine, dosage_form: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
          >
            {DOSAGE_FORMS.map((df) => (
              <option key={df} value={df}>
                {df}
              </option>
            ))}
          </select>
        </div>

        {/* Strength */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Dosage Strength *
          </label>
          <input
            type="text"
            value={medicine.strength}
            onChange={(e) => onChange({ ...medicine, strength: e.target.value })}
            placeholder="e.g. 10 mg"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium"
          />
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Commercial Medicine Price (₹ / pack) *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-semibold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              min="1"
              step="0.5"
              value={medicine.medicine_price}
              onChange={(e) => onChange({ ...medicine, medicine_price: parseFloat(e.target.value) || 0 })}
              className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-semibold"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Standard market retail pack price
          </p>
        </div>
      </div>
    </div>
  )
}
