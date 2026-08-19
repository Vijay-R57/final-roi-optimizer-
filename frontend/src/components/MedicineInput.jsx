import React, { useState } from 'react'

const DEFAULTS = {
  generic_name:'Atorvastatin', brand_name:'Newstat',
  therapeutic_class:'Lipid Lowering', dosage_form:'Tablet',
  strength:'10 mg', total_samples:10000, medicine_price:120,
  sample_cost:0.0587, sample_lift:0.10, units_per_rx:2, variable_cost:45,
}

export default function MedicineInput({ onRun, loading }) {
  const [form, setForm] = useState(DEFAULTS)
  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const Field = ({label,k,type='text'}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[k]}
        onChange={e=>set(k,type==='number'?parseFloat(e.target.value)||0:e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Medicine Input</h2>
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Target Medicine</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Field label="Generic Name"       k="generic_name"/>
          <Field label="Brand Name"         k="brand_name"/>
          <Field label="Therapeutic Class"  k="therapeutic_class"/>
          <Field label="Dosage Form"        k="dosage_form"/>
          <Field label="Strength"           k="strength"/>
          <Field label="Medicine Price (Rs.)" k="medicine_price" type="number"/>
        </div>
        <h3 className="font-semibold text-gray-700 mb-4">Campaign Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Field label="Total Samples"           k="total_samples"  type="number"/>
          <Field label="Sample Cost (Rs.)"        k="sample_cost"    type="number"/>
          <Field label="Expected Sample Lift (%)" k="sample_lift"    type="number"/>
          <Field label="Units per Prescription"  k="units_per_rx"   type="number"/>
          <Field label="Variable Cost/Unit (Rs.)"k="variable_cost"  type="number"/>
        </div>
        <button
          onClick={()=>onRun(form)}
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400
                     text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          {loading ? 'Running Pipeline...' : 'Run Sample Drop Optimization'}
        </button>
      </div>
    </div>
  )
}
