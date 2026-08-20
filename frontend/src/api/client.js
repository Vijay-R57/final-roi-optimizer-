import axios from 'axios'

// Dedicated axios instance with standard timeout & headers (5 minutes timeout for ML pipeline)
const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
export const apiClient = axios.create({
  baseURL: apiBase,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Unified error interceptor preventing unhandled exceptions
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'An unexpected connection issue occurred.'
    let technicalDetails = error.message

    if (error.response) {
      technicalDetails = `Status ${error.response.status}: ${JSON.stringify(error.response.data)}`
      if (error.response.status === 404) {
        friendlyMessage = 'The requested optimization service endpoint could not be found.'
      } else if (error.response.status >= 500) {
        friendlyMessage = 'The backend optimization engine encountered an issue while processing.'
      } else if (error.response.data?.error) {
        friendlyMessage = error.response.data.error
      }
    } else if (error.code === 'ECONNABORTED') {
      friendlyMessage = 'Optimization request timed out. The ML pipeline may still be training.'
    } else if (error.request) {
      friendlyMessage = `Unable to reach the API server (${apiBase}). Please check backend status.`
    }

    const enhancedError = new Error(error.response?.data?.message || friendlyMessage)
    enhancedError.response = error.response
    enhancedError.technicalDetails = technicalDetails
    enhancedError.originalError = error
    enhancedError.statusCode = error.response?.status
    return Promise.reject(enhancedError)
  }
)
