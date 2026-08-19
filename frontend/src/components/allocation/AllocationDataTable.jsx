import React, { useState, useMemo } from 'react'
import { Search, Package, ArrowUpDown, ChevronRight, Download, Users, SlidersHorizontal, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { getTierBadge, formatNumber, formatCurrency } from '../../utils/formatters'
import { useCampaign } from '../../context/CampaignContext'

export const AllocationDataTable = ({ onSelectHcp }) => {
  const { campaignData } = useCampaign()
  const top100Hcps = campaignData.hcps || []
  const allHcps = campaignData.allHcps && campaignData.allHcps.length > 0 ? campaignData.allHcps : top100Hcps

  // Scope: 'TOP100' or 'ALL12K'
  const [scope, setScope] = useState('TOP100')
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('ALL')
  const [zoneFilter, setZoneFilter] = useState('ALL')
  const [allocationStatusFilter, setAllocationStatusFilter] = useState('ALL')
  const [sortField, setSortField] = useState('rank')
  const [sortAsc, setSortAsc] = useState(true)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const activeDataset = scope === 'TOP100' ? top100Hcps : allHcps

  const zones = useMemo(() => {
    const list = new Set(allHcps.map((h) => h.zone).filter(Boolean))
    return ['ALL', ...Array.from(list)]
  }, [allHcps])

  const filteredHcps = useMemo(() => {
    let list = activeDataset.filter((h) => {
      const matchSearch =
        h.hcp_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.hcp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.locality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.specialty?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchZone = zoneFilter === 'ALL' || h.zone === zoneFilter
      const tierInfo = getTierBadge(h.potential_category || h.potential_score)
      const matchTier = tierFilter === 'ALL' || tierInfo.label.includes(tierFilter)

      const samples = Number(h.samples || h.Samples || 0)
      const matchAllocated =
        allocationStatusFilter === 'ALL' ||
        (allocationStatusFilter === 'ALLOCATED' && samples > 0) ||
        (allocationStatusFilter === 'UNALLOCATED' && samples === 0)

      return matchSearch && matchZone && matchTier && matchAllocated
    })

    return list.sort((a, b) => {
      let valA = a[sortField] !== undefined ? a[sortField] : 0
      let valB = b[sortField] !== undefined ? b[sortField] : 0
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortAsc ? valA - valB : valB - valA
    })
  }, [activeDataset, searchTerm, tierFilter, zoneFilter, allocationStatusFilter, sortField, sortAsc])

  // Pagination calculations
  const totalItems = filteredHcps.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const paginatedHcps = filteredHcps.slice(startIndex, startIndex + pageSize)

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(field === 'rank' || field === 'hcp_id')
    }
  }

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Rank',
      'HCP_ID',
      'Physician_Name',
      'Specialty',
      'Locality',
      'Zone',
      'Potential_Tier',
      'Potential_Score',
      'Expected_3M_Demand',
      'Allocated_Samples',
      'Expected_Incremental_Rx',
      'Expected_Revenue',
    ]

    const rows = filteredHcps.map((h) => {
      const incrRx = (h.expected_3m_demand || 3.0) * 0.10
      const rev = incrRx * 2 * 120
      return [
        h.rank,
        h.hcp_id,
        `"${h.hcp_name || ''}"`,
        `"${h.specialty || ''}"`,
        `"${h.locality || ''}"`,
        `"${h.zone || ''}"`,
        h.potential_category || 'Medium',
        (h.potential_score || 0).toFixed(1),
        (h.expected_3m_demand || 0).toFixed(2),
        h.samples || h.Samples || 0,
        incrRx.toFixed(2),
        rev.toFixed(2),
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `hcp_allocations_${scope.toLowerCase()}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
      {/* Header with Scope Switcher & Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-base font-bold text-slate-900 font-display">
            Physician Sample Distribution Roster
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            View allocations, predictions, and territory drops across campaign target HCPs or the full prescriber universe
          </p>
        </div>

        {/* Scope Selector Tabs & CSV Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setScope('TOP100')
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                scope === 'TOP100'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Target HCPs (Top 100)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScope('ALL12K')
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                scope === 'ALL12K'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Prescribers (12,000 Universe)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search physician, ID, locality..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>

        {/* Allocation Status Filter */}
        <select
          value={allocationStatusFilter}
          onChange={(e) => {
            setAllocationStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
        >
          <option value="ALL">All Allocation Statuses</option>
          <option value="ALLOCATED">Allocated (&gt;0 samples)</option>
          <option value="UNALLOCATED">Unallocated Baseline (0 samples)</option>
        </select>

        {/* Tier Filter */}
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
        >
          <option value="ALL">All Potential Tiers</option>
          <option value="HIGH">High Potential Tier</option>
          <option value="MEDIUM">Medium Potential Tier</option>
          <option value="LOW">Low Potential Tier</option>
        </select>

        {/* Zone Filter */}
        <select
          value={zoneFilter}
          onChange={(e) => {
            setZoneFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
        >
          <option value="ALL">All Territories</option>
          {zones.filter((z) => z !== 'ALL').map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4 whitespace-nowrap min-w-[75px] cursor-pointer" onClick={() => toggleSort('rank')}>
                <div className="flex items-center gap-1">
                  <span>Rank</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap min-w-[170px]">Physician (HCP)</th>
              <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Territory</th>
              <th className="py-3 px-4 whitespace-nowrap text-center min-w-[125px]">Potential Tier</th>
              <th className="py-3 px-4 whitespace-nowrap text-right min-w-[100px] cursor-pointer" onClick={() => toggleSort('potential_score')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap text-right min-w-[140px] cursor-pointer" onClick={() => toggleSort('samples')}>
                <div className="flex items-center justify-end gap-1 font-bold text-blue-900">
                  <span>Allocated Samples</span>
                  <ArrowUpDown className="w-3 h-3 text-blue-600 shrink-0" />
                </div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap text-right min-w-[140px] cursor-pointer" onClick={() => toggleSort('expected_3m_demand')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Incr. Rx (10% Lift)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap text-right min-w-[130px]">Expected Revenue</th>
              <th className="py-3 px-4 whitespace-nowrap text-center w-10">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {paginatedHcps.map((h, i) => {
              const tier = getTierBadge(h.potential_category || h.potential_score)
              const incrRx = (h.expected_3m_demand || 3.0) * 0.10
              const revenue = incrRx * 2 * 120
              const sampleUnits = Number(h.samples || h.Samples || 0)

              return (
                <tr
                  key={h.hcp_id || i}
                  onClick={() => onSelectHcp(h)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    #{h.rank}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors whitespace-nowrap">
                        {h.hcp_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{h.specialty} • {h.hcp_id}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <div>{h.locality}</div>
                    <div className="text-[10px] text-slate-400">{h.zone}</div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${tier.color}`}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatNumber(h.potential_score, 1)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {sampleUnits > 0 ? (
                      <span className="inline-flex items-center justify-end px-3 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold font-display text-xs border border-blue-200 whitespace-nowrap">
                        {sampleUnits} units
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-end px-2.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium border border-slate-200 whitespace-nowrap">
                        0 units
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600 whitespace-nowrap">
                    +{formatNumber(incrRx, 2)} Rx
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-display whitespace-nowrap">
                    {formatCurrency(revenue, 1)}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400 group-hover:text-blue-600">
                    <ChevronRight className="w-4 h-4 mx-auto transition-transform group-hover:translate-x-0.5" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-slate-900">{Math.min(startIndex + pageSize, totalItems)}</strong> of{' '}
            <strong className="text-slate-900">{formatNumber(totalItems)}</strong> prescribers
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs">
            Page {safeCurrentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
