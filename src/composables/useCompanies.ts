import { ref } from 'vue'
import api from '@/api/client'
import type { Company, CompanyRequest } from '@/types/api'

export function useCompanies() {
  const companies = ref<Company[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCompanies = async (params?: { search?: string; ordering?: string }) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Company[]>('/api/companies/', { params })
      companies.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки компаний'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const createCompany = async (data: { code: string; name: string }) => {
    try {
      const response = await api.post<Company>('/api/companies/', data)
      companies.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Ошибка создания компании'
      console.error(err)
      throw err
    }
  }

  const updateCompany = async (id: number, data: { code?: string; name?: string }) => {
    try {
      const response = await api.patch<Company>(`/api/companies/${id}/`, data)
      const index = companies.value.findIndex(c => c.id === id)
      if (index !== -1) {
        companies.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Ошибка обновления компании'
      console.error(err)
      throw err
    }
  }

  const deleteCompany = async (id: number) => {
    try {
      await api.delete(`/api/companies/${id}/`)
      companies.value = companies.value.filter(c => c.id !== id)
    } catch (err) {
      error.value = 'Ошибка удаления компании'
      console.error(err)
      throw err
    }
  }

  // Загружаем данные при инициализации
  fetchCompanies()

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany
  }
}