import { createEntityStore } from './base'
import type { CourseResponse, CourseRequest } from '@/types/api'

export const coursesStore = createEntityStore<CourseResponse>('/api/courses/')

export const coursesApi = {
  create: (data: CourseRequest) => coursesStore.create(data),
  update: (id: number, data: Partial<CourseRequest>) => coursesStore.update(id, data),
  remove: (id: number) => coursesStore.remove(id)
}