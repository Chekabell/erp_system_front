import { ref } from 'vue'
import api from '@/api/client'
import type { Employee } from '@/types/api'

export function useEmployees() {
  const employees = ref<Employee[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchEmployees = async (params?: { search?: string; ordering?: string }) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Employee[]>('/api/employees/', { params })
      employees.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки сотрудников'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const createEmployee = async (data: {
    full_name: string
    company_id: number
    email: string
    assign_to_groups?: number[]
  }) => {
    try {
      const response = await api.post<Employee>('/api/employees/', data)
      employees.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Ошибка создания сотрудника'
      console.error(err)
      throw err
    }
  }

  const updateEmployee = async (id: number, data: {
    full_name?: string
    company_id?: number
    email?: string
    assign_to_groups?: number[]
  }) => {
    try {
      const response = await api.patch<Employee>(`/api/employees/${id}/`, data)
      const index = employees.value.findIndex(e => e.id === id)
      if (index !== -1) {
        employees.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Ошибка обновления сотрудника'
      console.error(err)
      throw err
    }
  }

  const deleteEmployee = async (id: number) => {
    try {
      await api.delete(`/api/employees/${id}/`)
      employees.value = employees.value.filter(e => e.id !== id)
    } catch (err) {
      error.value = 'Ошибка удаления сотрудника'
      console.error(err)
      throw err
    }
  }

  fetchEmployees()

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
  }
}