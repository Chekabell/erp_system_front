import { ref } from 'vue'
import api from '@/api/client'
import type { Group } from '@/types/api'

export function useGroups() {
  const groups = ref<Group[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchGroups = async (params?: {
    course?: number
    specification?: number
    status?: 'planned' | 'in_progress' | 'completed'
    search?: string
    ordering?: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Group[]>('/api/groups/', { params })
      groups.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки групп'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const createGroup = async (data: {
    course_id: number
    specification_id: number
    start_date: string
    end_date: string
    status?: 'planned' | 'in_progress' | 'completed'
    total_cost?: string
  }) => {
    try {
      const response = await api.post<Group>('/api/groups/', data)
      groups.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Ошибка создания группы'
      console.error(err)
      throw err
    }
  }

  const updateGroup = async (id: number, data: Partial<Group>) => {
    try {
      const response = await api.patch<Group>(`/api/groups/${id}/`, data)
      const index = groups.value.findIndex(g => g.id === id)
      if (index !== -1) {
        groups.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Ошибка обновления группы'
      console.error(err)
      throw err
    }
  }

  const deleteGroup = async (id: number) => {
    try {
      await api.delete(`/api/groups/${id}/`)
      groups.value = groups.value.filter(g => g.id !== id)
    } catch (err) {
      error.value = 'Ошибка удаления группы'
      console.error(err)
      throw err
    }
  }

  fetchGroups()

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup
  }
}