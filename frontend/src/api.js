import axios from 'axios'

const USER_ID_KEY = 'diary_user_id'

let cachedUserId = null
let initPromise = null

async function ensureValidUserId() {
  if (cachedUserId) {
    return cachedUserId
  }
  
  const storedId = localStorage.getItem(USER_ID_KEY)
  
  if (storedId && storedId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    cachedUserId = storedId
    return storedId
  }
  
  if (initPromise) {
    return initPromise
  }
  
  initPromise = (async () => {
    try {
      const tempId = storedId || 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      const response = await axios.get('/api/v1/user/init', {
        headers: { 'X-User-ID': tempId }
      })
      
      const userId = response.data.user_id
      localStorage.setItem(USER_ID_KEY, userId)
      cachedUserId = userId
      return userId
    } finally {
      initPromise = null
    }
  })()
  
  return initPromise
}

const api = axios.create({
  baseURL: '/api/v1',
})

api.interceptors.request.use(async (config) => {
  const userId = await ensureValidUserId()
  config.headers['X-User-ID'] = userId
  return config
})

export const userApi = {
  init: () => ensureValidUserId()
}

export const diaryApi = {
  getByDate: (date) => api.get(`/diaries?date_param=${date}`),
  
  create: (content, date, timeEntries = null) => api.post('/diaries', { 
    content, 
    date,
    time_entries: timeEntries
  }),
  
  delete: (id) => api.delete(`/diaries/${id}`),
  
  aiEvaluate: (id) => api.post(`/diaries/${id}/ai-evaluate`)
}

export const calendarApi = {
  getMonthDates: (year, month) => api.get(`/calendar?year=${year}&month=${month}`)
}

export const portraitApi = {
  getLatest: () => api.get('/portraits/latest'),
  
  generate: () => api.post('/portraits/generate')
}

export const settingsApi = {
  getApiKeyStatus: () => api.get('/settings/api-key'),
  
  updateApiKey: (apiKey) => api.post('/settings/api-key', { api_key: apiKey }),
  
  deleteApiKey: () => api.delete('/settings/api-key')
}

export default api
