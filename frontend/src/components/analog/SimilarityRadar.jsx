import React from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { CheckCircle2, Info } from 'lucide-react'

export const SimilarityRadar = ({ analog }) => {
  const radarData = [
    {
      subject: 'Profile Similarity',
      score: Math.round((analog.profile || 0.9371) * 100),
      fullMark: 100,
    },
    {
      subject: 'Prescribing Behavior',
      score: Math.round((analog.behavior || 0.9577) * 100),
      fullMark: 100,
    },
    {
      subject: 'Therapeutic Match',
      score: Math.round((analog.therapeutic_similarity || 0.96) * 100),
      fullMark: 100,
    },
    {
      subject: 'Utilization Pattern',
      score: Math.round((analog.utilization_pattern || 0.925) * 100),
      fullMark: 100,
    },
    {
      subject: 'Data Quality Depth',
      score: Math.round((analog.data_quality || 0.90) * 100),
      fullMark: 100,
    },
  ]

  const breakdownMetrics = [
    {
      label: 'Profile Similarity',
      value: Math.round((analog.profile || 0.9371) * 100),
      color: 'bg-blue-600',
      description: 'Cosine match on dosage form, therapeutic class, strength ratio, and standardized pack pricing.',
    },
    {
      label: 'Prescribing Behavior',
      value: Math.round((analog.behavior || 0.9577) * 100),
      color: 'bg-indigo-600',
      description: 'HCP prescribing velocity, volume dispersion, specialty distribution, and monthly script velocity.',
    },
    {
      label: 'Data Quality & History',
      value: Math.round((analog.data_quality || 0.90) * 100),
      color: 'bg-emerald-600',
      description: 'Statistical significance over 33+ months of transaction logs with 5,100+ active doctors.',
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Radar Chart */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-display">
              Multidimensional Similarity Radar
            </h4>
            <p className="text-xs text-slate-500">
              5-dimensional algorithmic match evaluation
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
            94% Avg Fit
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 9 }}
              />
              <Radar
                name="Similarity Score"
                dataKey="score"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.25}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Score']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-1">
          High convex polygon area indicates comprehensive behavioral fidelity.
        </p>
      </div>

      {/* Breakdown Progress Cards */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 font-display">
            Similarity Pillar Breakdown
          </h4>
          <p className="text-xs text-slate-500">
            Weighted composite components determining historical analog selection
          </p>
        </div>

        <div className="space-y-4">
          {breakdownMetrics.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  {item.label}
                </span>
                <span className="text-xs font-extrabold font-display text-blue-700">
                  {item.value}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${item.value}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
