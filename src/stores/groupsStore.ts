import { createEntityStore } from './base'
import type { Group } from '@/types/api'
export const groupsStore = createEntityStore<Group>('/api/groups/')