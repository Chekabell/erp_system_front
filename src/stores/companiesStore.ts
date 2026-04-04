import { createEntityStore } from './base'
import type { Company } from '@/types/api'
export const companiesStore = createEntityStore<Company>('/api/companies/')