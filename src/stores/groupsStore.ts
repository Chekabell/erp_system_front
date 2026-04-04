import { createEntityStore } from './base'
import type { GroupResponse, GroupRequest } from '@/types/api'

export const groupsStore = createEntityStore<GroupResponse>('/api/groups/')

export const groupsApi = {
  create: (data: GroupRequest) => groupsStore.create(data),
  update: (id: number, data: Partial<GroupRequest>) => groupsStore.update(id, data),
  remove: (id: number) => groupsStore.remove(id)
}