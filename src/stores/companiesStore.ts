import type { CompanyRequest, CompanyResponse } from '@/types/api'
import { createEntityStore } from './base'

export const companiesStore = createEntityStore<CompanyResponse>('/api/companies/')

export const companiesApi = {
  create: (data: CompanyRequest) => companiesStore.create(data),
  update: (id: number, data: Partial<CompanyRequest>) => companiesStore.update(id, data),
  remove: (id: number) => companiesStore.remove(id),
}
