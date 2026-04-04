import { createEntityStore } from './base'
import type { Employee } from '@/types/api'
export const employeesStore = createEntityStore<Employee>('/api/employees/')