import axios from 'axios'

// Базовый URL бэкенда (возьми из .env или укажи напрямую для теста)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://labzavr.ru'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)

    return Promise.reject(error)
  },
)

export default api
