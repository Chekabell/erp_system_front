import { createEntityStore } from './base'
import type { EmployeeResponse, EmployeeRequest } from '@/types/api'

export const employeesStore = createEntityStore<EmployeeResponse>('/api/employees/')

export const employeesApi = {
  create: (data: EmployeeRequest) => employeesStore.create(data),
  update: (id: number, data: Partial<EmployeeRequest>) => employeesStore.update(id, data),
  remove: (id: number) => employeesStore.remove(id)
}