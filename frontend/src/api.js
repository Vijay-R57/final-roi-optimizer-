import axios from 'axios'
const BASE = '/api'
export const api = {
  health:       ()    => axios.get(`${BASE}/health`),
  validation:   ()    => axios.get(`${BASE}/dataset/validation`),
  medicines:    (tc)  => axios.get(`${BASE}/medicines${tc ? `?therapeutic_class=${tc}` : ''}`),
  analogSearch: (d)   => axios.post(`${BASE}/analog/search`, d),
  predict:      (d)   => axios.post(`${BASE}/predict`, d),
  top100:       ()    => axios.get(`${BASE}/hcps/top100`),
  allocation:   ()    => axios.get(`${BASE}/allocation`),
  zones:        ()    => axios.get(`${BASE}/zones`),
  roi:          ()    => axios.get(`${BASE}/roi`),
  roiSensitivity: ()  => axios.get(`${BASE}/roi/sensitivity`),
  modelPerf:    ()    => axios.get(`${BASE}/model/performance`),
}
