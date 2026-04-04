import { createEntityStore } from './base'
import type { Course } from '@/types/api'
export const coursesStore = createEntityStore<Course>('/api/courses/')