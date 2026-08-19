import React, { useState } from 'react'
import MedicineInput from './components/MedicineInput'
import AnalogCard from './components/AnalogCard'
import ModelPerformance from './components/ModelPerformance'
import HCPRanking from './components/HCPRanking'
import SampleAllocation from './components/SampleAllocation'
import ZoneDistribution from './components/ZoneDistribution'
import ROIAnalysis from './components/ROIAnalysis'
import Dashboard from './components/Dashboard'
import { api } from './api'

const TABS = ['Dashboard','Medicine Input','Analog','Model','HCP Ranking',
              'Allocation','Zones','ROI']

export default function App() {
  const [tab, setTab]       = useState('Medicine Input')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const runPipeline = async (formData) => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.predict(formData)
      setResult(data)
      setTab('Dashboard')
    } catch(e) {
      setError(e.response?.data?.error || e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-4 shadow">
        <h1 className="text-2xl font-bold tracking-wide">Sample Drop Optimization</h1>
        <p className="text-blue-200 text-sm mt-0.5">
          AI-powered HCP targeting for pharmaceutical sample distribution
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${tab===t ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"/>
            Running ML pipeline... (this takes 2-3 minutes)
          </div>
        )}

        {tab==='Dashboard'       && <Dashboard result={result}/>}
        {tab==='Medicine Input'  && <MedicineInput onRun={runPipeline} loading={loading}/>}
        {tab==='Analog'          && <AnalogCard result={result}/>}
        {tab==='Model'           && <ModelPerformance result={result}/>}
        {tab==='HCP Ranking'     && <HCPRanking result={result}/>}
        {tab==='Allocation'      && <SampleAllocation result={result}/>}
        {tab==='Zones'           && <ZoneDistribution result={result}/>}
        {tab==='ROI'             && <ROIAnalysis result={result}/>}
      </div>
    </div>
  )
}
