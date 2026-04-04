import { ref } from 'vue'
import api from '@/api/client'
import type { Course } from '@/types/api'

export function useCourses() {
  const courses = ref<Course[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCourses = async (params?: { search?: string }) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Course[]>('/api/courses/', { params })
      courses.value = response.data
    } catch (err) {
      error.value = 'Ошибка загрузки курсов'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const createCourse = async (data: {
    title: string
    description?: string | null
    duration_days: number
    base_price: string
  }) => {
    try {
      const response = await api.post<Course>('/api/courses/', data)
      courses.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = 'Ошибка создания курса'
      console.error(err)
      throw err
    }
  }

  const updateCourse = async (id: number, data: Partial<Course>) => {
    try {
      const response = await api.patch<Course>(`/api/courses/${id}/`, data)
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = 'Ошибка обновления курса'
      console.error(err)
      throw err
    }
  }

  const deleteCourse = async (id: number) => {
    try {
      await api.delete(`/api/courses/${id}/`)
      courses.value = courses.value.filter(c => c.id !== id)
    } catch (err) {
      error.value = 'Ошибка удаления курса'
      console.error(err)
      throw err
    }
  }

  fetchCourses()

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse
  }
}