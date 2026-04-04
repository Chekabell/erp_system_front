import { reactive } from 'vue'
import api from '@/api/client'
import type { GanttResponse } from '@/types/api'

export function useGantt() {
  const state = reactive({
    data: null as GanttResponse | null,
    loading: false,
    error: null as string | null
  })

  const fetch = async () => {
    state.loading = true
    state.error = null
    try {
      const response = await api.get<GanttResponse>('/api/gantt-data/')
      state.data = response.data
    } catch (err: any) {
      state.error = err.response?.data?.detail || 'Ошибка загрузки данных Ганта'
    } finally {
      state.loading = false
    }
  }

  fetch()

  return {
    state,
    fetch
  }
}