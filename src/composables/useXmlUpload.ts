import { ref } from 'vue'
import api from '@/api/client'
import type { XmlUploadResponse, XmlUploadError } from '@/types/api'

export function useXmlUpload() {
  const uploading = ref(false)
  const error = ref<XmlUploadError | null>(null)
  const success = ref<XmlUploadResponse | null>(null)

  const uploadXml = async (file: File) => {
    uploading.value = true
    error.value = null
    success.value = null

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post<XmlUploadResponse>('/api/xml/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      success.value = response.data
      return response.data
    } catch (err: any) {
      if (err.response?.status === 400) {
        error.value = err.response.data
      } else {
        error.value = { error: 'Ошибка загрузки XML файла' }
      }
      console.error(err)
      throw err
    } finally {
      uploading.value = false
    }
  }

  const exportXml = async (modelType: string, objId: number) => {
    try {
      const response = await api.get(`/api/xml/export/${modelType}/${objId}/`, {
        responseType: 'blob'
      })

      // Создаем blob и скачиваем файл
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
    uploading,
    error,
    success,
    uploadXml,
    exportXml
  }
}