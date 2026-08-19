import { apiClient } from './client'

export const sampleDropApi = {
  // System health & dataset validation
  getHealth: () => apiClient.get('/health'),
  getDatasetValidation: () => apiClient.get('/dataset/validation'),
  
  // Master medicines catalog
  getMedicines: (therapeuticClass) => {
    const params = therapeuticClass ? { therapeutic_class: therapeuticClass } : {}
    return apiClient.get('/medicines', { params })
  },
  
  // Historical analog similarity search
  searchAnalog: (medicinePayload) => apiClient.post('/analog/search', medicinePayload),
  
  // Full Machine Learning & Optimization execution
  runOptimization: (campaignPayload) => apiClient.post('/predict', campaignPayload),
  
  // Top 100 HCP rankings & Full 12,000 Universe
  getTop100Hcps: () => apiClient.get('/hcps/top100'),
  getAllHcps: () => apiClient.get('/hcps/all'),
  
  // Sample allocations
  getAllocations: () => apiClient.get('/allocation'),
  
  // Territory zone distribution
  getZones: () => apiClient.get('/zones'),
  
  // Financial ROI & scenario matrix
  getRoi: () => apiClient.get('/roi'),
  getRoiSensitivity: () => apiClient.get('/roi/sensitivity'),
  
  // Model comparison & feature importance
  getModelPerformance: () => apiClient.get('/model/performance'),
}
