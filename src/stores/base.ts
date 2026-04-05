import type { PaginatedResponse } from '@/types/api'
// src/stores/base.ts
import { reactive } from 'vue'
import api from '@/api/client'

export interface PaginationMeta {
  count: number
  next: string | null
  previous: string | null
  page: number
  per_page: number
}

export interface StoreState<T> {
  items: T[]
  loading: boolean
  error: string | null
  pagination: PaginationMeta
  isFetched: boolean
}

export function createEntityStore<T> (endpoint: string) {
  const state = reactive<StoreState<T>>({
    items: [],
    loading: false,
    error: null,
    pagination: {
      count: 0,
      next: null,
      previous: null,
      page: 1,
      per_page: 10,
    },
    isFetched: false,
  })

  const extractPage = (url: string | null): number | null => {
    if (!url) {
      return null
    }
    const match = url.match(/[?&]page=(\d+)/)
    return match ? Number.parseInt(match[1], 10) : null
  }

  const fetch = async (params: Record<string, any> = {}, force = false) => {
    if (state.isFetched && !force && !params.page && !params.search) {
      return
    }

    state.loading = true
    state.error = null

    try {
      const requestParams = {
        page: state.pagination.page,
        per_page: state.pagination.per_page,
        ...params,
      }

      for (const k of Object.keys(requestParams)) {
        if (requestParams[k] == null) {
          delete requestParams[k]
        }
      }

      const response = await api.get<PaginatedResponse<T>>(endpoint, { params: requestParams })

      state.items = response.data.results
      console.log(response.data)
      state.pagination.count = response.data.count
      state.pagination.next = response.data.next
      state.pagination.previous = response.data.previous
      state.isFetched = true
    } catch (error: any) {
      state.error = error.response?.data?.detail || 'Ошибка загрузки данных'
      console.error(`[Store ${endpoint}] Error:`, error)
    } finally {
      state.loading = false
    }
  }

  const changePageSize = (size: number) => {
    state.pagination.per_page = size
    state.pagination.page = 1
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > Math.ceil(state.pagination.count / state.pagination.per_page)) {
      return
    }
    state.pagination.page = page
    state.isFetched = false
    fetch()
  }

  const next = () => {
    const nextPage = extractPage(state.pagination.next)
    if (nextPage) {
      goToPage(nextPage)
    }
  }

  const prev = () => {
    const prevPage = extractPage(state.pagination.previous)
    if (prevPage) {
      goToPage(prevPage)
    }
  }

  const reset = () => {
    state.isFetched = false
    state.items = []
    state.pagination.page = 1
    state.pagination.count = 0
    state.pagination.next = null
    state.pagination.previous = null
  }

  // Методы для создания/обновления/удаления (универсальные)
  const create = async (data: any) => {
    try {
      const response = await api.post<T>(endpoint, data)
      state.items.unshift(response.data)
      state.pagination.count += 1
      return response.data
    } catch (error: any) {
      state.error = error.response?.data || 'Ошибка создания'
      throw error
    }
  }

  const update = async (id: number, data: Partial<T>) => {
    try {
      const response = await api.patch<T>(`${endpoint}${id}/`, data)
      const index = state.items.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        state.items[index] = response.data
      }
      return response.data
    } catch (error: any) {
      state.error = error.response?.data || 'Ошибка обновления'
      throw error
    }
  }

  const remove = async (id: number) => {
    try {
      await api.delete(`${endpoint}${id}/`)
      state.items = state.items.filter((item: any) => item.id !== id)
      state.pagination.count -= 1
    } catch (error: any) {
      state.error = error.response?.data || 'Ошибка удаления'
      throw error
    }
  }

  return {
    state,
    fetch,
    goToPage,
    next,
    prev,
    reset,
    changePageSize,
    create,
    update,
    remove,
  }
}
