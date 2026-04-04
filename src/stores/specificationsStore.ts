import { createEntityStore } from './base'
import type { SpecificationResponse, SpecificationRequest } from '@/types/api'

export const specificationsStore = createEntityStore<SpecificationResponse>('/api/specifications/')

export const specificationsApi = {
  create: (data: SpecificationRequest) => specificationsStore.create(data),
  update: (id: number, data: Partial<SpecificationRequest>) => specificationsStore.update(id, data),
  remove: (id: number) => specificationsStore.remove(id)
}