// src/stores/base.ts
import { reactive } from 'vue'
import api from '@/api/client'
import type { PaginatedResponse } from '@/types/api'

export interface PaginationMeta {
  count: number
  next: string | null
  previous: string | null
  page: number
  pageSize: number
}

export function createEntityStore<T>(endpoint: string) {
  const state = reactive({
    items: [] as T[],
    loading: false,
    error: null as string | null,
    pagination: {
      count: 0,
      next: null as string | null,
      previous: null as string | null,
      page: 1,
      pageSize: 10
    } as PaginationMeta,
    isFetched: false
  })

  const extractPage = (url: string | null): number | null => {
    if (!url) return null
    const match = url.match(/[?&]page=(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  const fetch = async (params: Record<string, any> = {}, force = false) => {
    if (state.isFetched && !force && !params.page && !params.search) return

    state.loading = true
    state.error = null

    try {
      const requestParams = {
        page: state.pagination.page,
        page_size: state.pagination.pageSize, // Важно: отправляем размер страницы
        ...params
      }
      Object.keys(requestParams).forEach(k => requestParams[k] == null && delete requestParams[k])

      const response = await api.get<PaginatedResponse<T>>(endpoint, { params: requestParams })

      state.items = response.data.results
      state.pagination.count = response.data.count
      state.pagination.next = response.data.next
      state.pagination.previous = response.data.previous
      state.pagination.page = requestParams.page || 1
      state.isFetched = true
    } catch (err: any) {
      state.error = err.response?.data?.detail || 'Ошибка загрузки данных'
    } finally {
      state.loading = false
    }
  }

  // ✅ Метод для изменения количества записей на странице
  const changePageSize = (size: number) => {
    state.pagination.pageSize = size
    state.pagination.page = 1 // Сброс на первую страницу
    state.isFetched = false   // Инвалидация кэша
    fetch()                   // Принудительная загрузка
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > Math.ceil(state.pagination.count / state.pagination.pageSize)) return
    state.pagination.page = page
    state.isFetched = false
    fetch()
  }

  const next = () => {
    const nextPage = extractPage(state.pagination.next)
    if (nextPage) goToPage(nextPage)
  }

  const prev = () => {
    const prevPage = extractPage(state.pagination.previous)
    if (prevPage) goToPage(prevPage)
  }

  const reset = () => {
    state.isFetched = false
    state.items = []
    state.pagination.page = 1
    state.pagination.count = 0
    state.pagination.next = null
    state.pagination.previous = null
  }

  return { state, fetch, goToPage, next, prev, reset, changePageSize }
}