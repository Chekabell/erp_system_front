import { reactive } from 'vue'
import api from '@/api/client'
import type { XmlUploadRequest, XmlUploadResponse, XmlUploadError, XmlExportModelType } from '@/types/api'

export function useXml() {
  const state = reactive({
    uploading: false,
    error: null as XmlUploadError | null,
    success: null as XmlUploadResponse | null
  })

  const upload = async (file: File) => {
    state.uploading = true
    state.error = null
    state.success = null

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post<XmlUploadResponse>('/api/xml/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      state.success = response.data
      return response.data
    } catch (err: any) {
      if (err.response?.status === 400) {
        state.error = err.response.data
      } else {
        state.error = { error: 'Ошибка загрузки XML файла' }
      }
      throw err
    } finally {
      state.uploading = false
    }
  }

  const exportXml = async (modelType: XmlExportModelType, objId: number) => {
    try {
      const response = await api.get(`/api/xml/${modelType}/${objId}/`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${modelType}_${objId}.xml`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Ошибка экспорта XML:', err)
      throw err
    }
  }

  return {
    state,
    upload,
    exportXml
  }
}