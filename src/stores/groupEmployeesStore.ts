import { reactive } from 'vue'
import api from '@/api/client'
import type {
  GroupWithEmployeesResponse,
  GroupEmployeePostRequest,
  GroupEmployeePostResponse,
  GroupEmployeePatchRequest,
  GroupEmployeePatchResponse
} from '@/types/api'

export function useGroupEmployees(groupId: number) {
  const state = reactive({
    data: null as GroupWithEmployeesResponse | null,
    loading: false,
    error: null as string | null
  })

  const fetch = async () => {
    state.loading = true
    state.error = null
    try {
      const response = await api.get<GroupWithEmployeesResponse>(`/api/groups/${groupId}/employee/`)
      state.data = response.data
    } catch (err: any) {
      state.error = err.response?.data?.detail || 'Ошибка загрузки участников группы'
    } finally {
      state.loading = false
    }
  }

  const addEmployees = async (employeeIds: number[]) => {
    try {
      const response = await api.post<GroupEmployeePostResponse>(
        `/api/groups/${groupId}/employee/`,
        { employee_ids: employeeIds } as GroupEmployeePostRequest
      )
      await fetch() // Перезагружаем список после добавления
      return response.data
    } catch (err: any) {
      state.error = err.response?.data?.errors?.join(', ') || 'Ошибка добавления участников'
      throw err
    }
  }

  const updateProgress = async (employeeId: number, progressPercent: number) => {
    try {
      const response = await api.patch<GroupEmployeePatchResponse>(
        `/api/groups/${groupId}/employee/${employeeId}/`,
        { progress_percent: progressPercent } as GroupEmployeePatchRequest
      )
      // Обновляем локально, если элемент есть в списке
      if (state.data) {
        const emp = state.data.employees.find(e => e.id === employeeId)
        if (emp) emp.progress_percent = progressPercent
      }
      return response.data
    } catch (err: any) {
      state.error = err.response?.data?.detail || 'Ошибка обновления прогресса'
      throw err
    }
  }

  const removeEmployee = async (employeeId: number) => {
    try {
      await api.delete(`/api/groups/${groupId}/employee/${employeeId}/`)
      if (state.data) {
        state.data.employees = state.data.employees.filter(e => e.id !== employeeId)
      }
    } catch (err: any) {
      state.error = err.response?.data?.detail || 'Ошибка удаления участника'
      throw err
    }
  }

  fetch()

  return {
    state,
    fetch,
    addEmployees,
    updateProgress,
    removeEmployee
  }
}