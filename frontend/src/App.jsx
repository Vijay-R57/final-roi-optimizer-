import React from 'react'
import { CampaignProvider, useCampaign } from './context/CampaignContext'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ErrorBanner } from './components/layout/ErrorBanner'

import { DashboardPage } from './pages/DashboardPage'
import { MedicineInputPage } from './pages/MedicineInputPage'
import { ProcessingPage } from './pages/ProcessingPage'
import { AnalogAnalysisPage } from './pages/AnalogAnalysisPage'
import { HcpIntelligencePage } from './pages/HcpIntelligencePage'
import { AllocationPage } from './pages/AllocationPage'
import { GeographicAllocationPage } from './pages/GeographicAllocationPage'
import { RoiSimulatorPage } from './pages/RoiSimulatorPage'
import { StepNavigationHeader } from './components/layout/StepNavigationHeader'

function MainContent() {
  const { currentTab } = useCampaign()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Global Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Global Error Banner (User-friendly with retry & technical detail accordion) */}
          <ErrorBanner />

          {/* Results Step Navigation Header */}
          <StepNavigationHeader />

          {/* Views */}
          {currentTab === 'Dashboard' && <DashboardPage />}
          {currentTab === 'Medicine Input' && <MedicineInputPage />}
          {currentTab === 'Optimization Processing' && <ProcessingPage />}
          {currentTab === 'Analog Analysis' && <AnalogAnalysisPage />}
          {currentTab === 'HCP Intelligence' && <HcpIntelligencePage />}
          {currentTab === 'Allocation' && <AllocationPage />}
          {currentTab === 'Geographic Zones' && <GeographicAllocationPage />}
          {currentTab === 'ROI Simulator' && <RoiSimulatorPage />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <CampaignProvider>
      <MainContent />
    </CampaignProvider>
  )
}
