import { createEntityStore } from './base'
import type { Specification } from '@/types/api'
export const specificationsStore = createEntityStore<Specification>('/api/specifications/')