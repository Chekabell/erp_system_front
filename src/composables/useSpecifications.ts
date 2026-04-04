import { ref } from 'vue'
import api from '@/api/client'
import type { Specification } from '@/types/api'

export function useSpecifications() {
  const specifications = ref<Specification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSpecifications = async (params?: {
    company?: number
    date?: string
    search?: string
    ordering?: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Specification[]>('/api/specifications/', { params })
      specifications.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки спецификаций'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const createSpecification = async (data: {
    date: string
    number: string
    company_id: number
  }) => {
    try {
      const response = await api.post<Specification>('/api/specifications/', data)
      specifications.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Ошибка создания спецификации'
      console.error(err)
      throw err
    }
  }

  const updateSpecification = async (id: number, data: Partial<Specification>) => {
    try {
      const response = await api.patch<Specification>(`/api/specifications/${id}/`, data)
      const index = specifications.value.findIndex(s => s.id === id)
      if (index !== -1) {
        specifications.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Ошибка обновления спецификации'
      console.error(err)
      throw err
    }
  }

  const deleteSpecification = async (id: number) => {
    try {
      await api.delete(`/api/specifications/${id}/`)
      specifications.value = specifications.value.filter(s => s.id !== id)
    } catch (err) {
      error.value = 'Ошибка удаления спецификации'
      console.error(err)
      throw err
    }
  }

  fetchSpecifications()

  return {
    specifications,
    loading,
    error,
    fetchSpecifications,
    createSpecification,
    updateSpecification,
    deleteSpecification
  }
}