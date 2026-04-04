import type {
  GroupEmployeePatchRequest,
  GroupEmployeePatchResponse,
  GroupEmployeePostRequest,
  GroupEmployeePostResponse,
  GroupWithEmployeesResponse,
} from '@/types/api'
import { reactive } from 'vue'
import api from '@/api/client'

export function useGroupEmployees (groupId: number) {
  const state = reactive({
    data: null as GroupWithEmployeesResponse | null,
    loading: false,
    error: null as string | null,
  })

  const fetch = async () => {
    state.loading = true
    state.error = null
    try {
      const response = await api.get<GroupWithEmployeesResponse>(`/api/groups/${groupId}/employee/`)
      state.data = response.data
    } catch (error: any) {
      state.error = error.response?.data?.detail || 'Ошибка загрузки участников группы'
    } finally {
      state.loading = false
    }
  }

  const addEmployees = async (employeeIds: number[]) => {
    try {
      const response = await api.post<GroupEmployeePostResponse>(
        `/api/groups/${groupId}/employee/`,
        { employee_ids: employeeIds } as GroupEmployeePostRequest,
      )
      await fetch() // Перезагружаем список после добавления
      return response.data
    } catch (error: any) {
      state.error = error.response?.data?.errors?.join(', ') || 'Ошибка добавления участников'
      throw error
    }
  }

  const updateProgress = async (employeeId: number, progressPercent: number) => {
    try {
      const response = await api.patch<GroupEmployeePatchResponse>(
        `/api/groups/${groupId}/employee/${employeeId}/`,
        { progress_percent: progressPercent } as GroupEmployeePatchRequest,
      )
      // Обновляем локально, если элемент есть в списке
      if (state.data) {
        const emp = state.data.employees.find(e => e.id === employeeId)
        if (emp) {
          emp.progress_percent = progressPercent
        }
      }
      return response.data
    } catch (error: any) {
      state.error = error.response?.data?.detail || 'Ошибка обновления прогресса'
      throw error
    }
  }

  const removeEmployee = async (employeeId: number) => {
    try {
      await api.delete(`/api/groups/${groupId}/employee/${employeeId}/`)
      if (state.data) {
        state.data.employees = state.data.employees.filter(e => e.id !== employeeId)
      }
    } catch (error: any) {
      state.error = error.response?.data?.detail || 'Ошибка удаления участника'
      throw error
    }
  }

  fetch()

  return {
    state,
    fetch,
    addEmployees,
    updateProgress,
    removeEmployee,
  }
}
