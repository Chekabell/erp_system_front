import axios from 'axios'

// Базовый URL бэкенда (возьми из .env или укажи напрямую для теста)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Важно для cookieAuth: отправлять куки с запросами
  withCredentials: true,
})

// Интерсептор для обработки ошибок (опционально, но полезно)
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    // Здесь можно добавить редирект на логин, если 401
    return Promise.reject(error)
  },
)

export default api
