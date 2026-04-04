import { ref } from 'vue'
import api from '@/api/client'
import type { GanttItem } from '@/types/api'

export function useGantt() {
  const items = ref<GanttItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchGanttData = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<GanttItem[]>('/api/gantt-data/')
      items.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки данных для диаграммы Ганта'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  fetchGanttData()

  return {
    items,
    loading,
    error,
    fetchGanttData
  }
}