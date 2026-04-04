import type { SpecificationRequest, SpecificationResponse } from '@/types/api'
import { createEntityStore } from './base'

export const specificationsStore = createEntityStore<SpecificationResponse>('/api/specifications/')

export const specificationsApi = {
  create: (data: SpecificationRequest) => specificationsStore.create(data),
  update: (id: number, data: Partial<SpecificationRequest>) => specificationsStore.update(id, data),
  remove: (id: number) => specificationsStore.remove(id),
}
