import { ref } from 'vue'
import api from '@/api/client'
import type { GroupEmployee } from '@/types/api'

export function useGroupEmployees(groupId: number) {
  const employees = ref<GroupEmployee[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchEmployees = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<GroupEmployee[]>(`/api/groups/${groupId}/employee/`)
      employees.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки участников группы'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const addEmployee = async (employeeId: number, progressPercent: number = 0) => {
    try {
      const response = await api.post<GroupEmployee>(`/api/groups/${groupId}/employee/`, {
        employee_id: employeeId,
        progress_percent: progressPercent
      })
      employees.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Ошибка добавления участника'
      console.error(err)
      throw err
    }
  }

  const updateProgress = async (employeeId: number, progressPercent: number) => {
    try {
      const response = await api.patch<GroupEmployee>(
        `/api/groups/${groupId}/employee/${employeeId}/`,
        { progress_percent: progressPercent }
      )
      const index = employees.value.findIndex(e => e.id === employeeId)
      if (index !== -1) {
        employees.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Ошибка обновления прогресса'
      console.error(err)
      throw err
    }
  }

  const removeEmployee = async (employeeId: number) => {
    try {
      await api.delete(`/api/groups/${groupId}/employee/${employeeId}/`)
      employees.value = employees.value.filter(e => e.id !== employeeId)
    } catch (err) {
      error.value = 'Ошибка удаления участника'
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
    addEmployee,
    updateProgress,
    removeEmployee
  }
}