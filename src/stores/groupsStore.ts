import type { GroupRequest, GroupResponse } from '@/types/api'
import { createEntityStore } from './base'

export const groupsStore = createEntityStore<GroupResponse>('/api/groups/')

export const groupsApi = {
  create: (data: GroupRequest) => groupsStore.create(data),
  update: (id: number, data: Partial<GroupRequest>) => groupsStore.update(id, data),
  remove: (id: number) => groupsStore.remove(id),
}
