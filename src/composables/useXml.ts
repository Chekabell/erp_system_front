import type { XmlExportModelType, XmlUploadError, XmlUploadResponse } from '@/types/api'
import { reactive } from 'vue'
import api from '@/api/client'

export function useXml () {
  const state = reactive({
    uploading: false,
    error: null as XmlUploadError | null,
    success: null as XmlUploadResponse | null,
  })

  const upload = async (file: File) => {
    state.uploading = true
    state.error = null
    state.success = null

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post<XmlUploadResponse>('/api/xml/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      state.success = response.data
      console.log(response.data)
      return response.data
    } catch (error: any) {
      state.error = error.response?.status === 400 ? error.response.data : { error: 'Ошибка загрузки XML файла' }
      throw error
    } finally {
      state.uploading = false
    }
  }

  // ИСПРАВЛЕННЫЙ ЭКСПОРТ – правильный путь из Swagger
  const exportXml = async (modelType: XmlExportModelType, objId: number) => {
    try {
      const response = await api.get(`/api/xml/export/${modelType}/${objId}/`, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${modelType}_${objId}.xml`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Ошибка экспорта XML:', error)
      throw error
    }
  }

  return {
    state,
    upload,
    exportXml,
  }
}
