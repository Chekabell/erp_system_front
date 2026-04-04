import { createEntityStore } from './base'
import type { CompanyResponse, CompanyRequest } from '@/types/api'

export const companiesStore = createEntityStore<CompanyResponse>('/api/companies/')

// Типизированные обертки для CRUD (опционально, для удобства)
export const companiesApi = {
  create: (data: CompanyRequest) => companiesStore.create(data),
  update: (id: number, data: Partial<CompanyRequest>) => companiesStore.update(id, data),
  remove: (id: number) => companiesStore.remove(id)
}