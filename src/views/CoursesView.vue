<template>
  <v-container class="pa-6" fluid>
    <!-- Заголовок -->
    <v-row align="center">
      <v-col>
        <h1 class="text-h4 font-weight-semibold" style="font-size: 40px;">Учебные курсы</h1>
      </v-col>
    </v-row>

    <v-divider class="my-6" />

    <!-- Кнопки действий -->
    <v-row align="center" class="mb-6" gap="20">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        style="font-size: 22px;"
        @click="openAddDialog"
      >
        Добавить курс
      </v-btn>
      <v-btn
        color="secondary"
        prepend-icon="mdi-upload"
        style="font-size: 22px;"
        @click="xmlImportDialogVisible = true"
      >
        XML-импорт
      </v-btn>
    </v-row>

    <!-- Поиск и фильтр -->
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchQuery"
          clearable
          density="comfortable"
          label="Поиск по названию или описанию"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          @update:model-value="onSearchChange"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="minDuration"
          density="comfortable"
          label="Мин. длительность (дни)"
          type="number"
          variant="outlined"
          @update:model-value="onFilterChange"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-text-field
          v-model="maxPrice"
          density="comfortable"
          label="Макс. цена"
          type="number"
          variant="outlined"
          @update:model-value="onFilterChange"
        />
      </v-col>
    </v-row>

    <!-- Состояния загрузки и ошибок -->
    <div v-if="coursesStore.state.loading && !coursesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="coursesStore.state.error" class="mt-4" type="error" variant="tonal">
      {{ coursesStore.state.error }}
    </v-alert>

    <!-- Таблица курсов -->
    <v-card v-else class="rounded-lg overflow-hidden" elevation="2">
      <v-data-table
        class="elevation-0"
        disable-pagination
        :headers="headers"
        hide-default-footer
        hover
        item-key="id"
        :items="coursesStore.state.items"
        :items-per-page="coursesStore.state.pagination.per_page"
        no-data-text="Курсы не найдены"
      >
        <template #item.title="{ item }">
          <div class="font-weight-medium">{{ item.title }}</div>
        </template>
        <template #item.description="{ item }">
          <div class="text-caption">{{ item.description }}</div>
        </template>
        <template #item.duration_days="{ item }">
          <v-chip color="green-accent-4" size="small">{{ item.duration_days }} дн.</v-chip>
        </template>
        <template #item.base_price="{ item }">
          <div class="font-weight-medium">{{ Number(item.base_price).toLocaleString() }} ₽</div>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            color="primary"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditDialog(item)"
          />
          <v-btn
            color="error"
            icon="mdi-delete"
            size="small"
            variant="text"
            @click="confirmDelete(item)"
          />
          <v-btn
            color="success"
            icon="mdi-xml"
            size="small"
            variant="text"
            @click="exportCourseToXML(item)"
          />
        </template>
      </v-data-table>

      <!-- Пагинация и выбор размера страницы -->
      <v-divider />
      <div class="d-flex justify-space-between align-center pa-3 bg-surface-variant">
        <div class="d-flex align-center ga-2">
          <span class="text-caption text-medium-emphasis text-white ">Показывать по:</span>
          <v-select
            density="compact"
            hide-details
            :items="[5, 10, 20]"
            :model-value="coursesStore.state.pagination.per_page"
            style="width: 80px;"
            variant="outlined"
            @update:model-value="onPageSizeChange"
          />
          <span class="text-caption text-medium-emphasis text-white ">из {{ coursesStore.state.pagination.count }}</span>
        </div>

        <v-pagination
          v-if="totalPages > 1"
          :length="totalPages"
          :model-value="coursesStore.state.pagination.page"
          size="small"
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- Диалог добавления/редактирования -->
    <v-dialog v-model="dialogVisible" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 font-weight-bold pt-4">
          {{ editingCourse ? 'Редактировать курс' : 'Добавить курс' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="formData.title"
              label="Название"
              required
              :rules="[requiredRule]"
            />
            <v-textarea
              v-model="formData.description"
              label="Описание"
              rows="3"
              :rules="[requiredRule]"
            />
            <v-text-field
              v-model="formData.duration_days"
              label="Длительность (дни)"
              required
              :rules="[requiredRule, positiveNumberRule]"
              type="number"
            />
            <v-text-field
              v-model="formData.base_price"
              label="Цена (₽)"
              prefix="₽"
              required
              :rules="[requiredRule, positiveNumberRule]"
              type="number"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogVisible = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!formValid" @click="saveCourse">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог подтверждения удаления -->
    <v-dialog v-model="deleteDialogVisible" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить курс <strong>{{ courseToDelete?.title }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogVisible = false">Отмена</v-btn>
          <v-btn color="error" @click="deleteCourse">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Модальное окно для XML импорта -->
    <v-dialog v-model="xmlImportDialogVisible" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 font-weight-bold pt-4">
          Импорт курсов из XML
        </v-card-title>
        <v-card-text class="pa-4">
          <v-card
            class="drop-zone pa-4 text-center"
            :class="{ 'drop-zone-active': isDragging }"
            @dragleave.prevent="isDragging = false"
            @dragover.prevent="isDragging = true"
            @drop.prevent="handleDrop"
          >
            <v-icon color="grey-darken-1" size="48">mdi-file-xml-box</v-icon>
            <div class="text-body-1 mt-2">
              Перетащите XML-файл с курсами сюда или <strong>нажмите для выбора</strong>
            </div>
            <div class="text-caption text-grey mt-2">
              Формат: &lt;courses&gt;&lt;course&gt;&lt;title&gt;...&lt;/title&gt;&lt;description&gt;...&lt;/description&gt;&lt;duration_days&gt;...&lt;/duration_days&gt;&lt;base_price&gt;...&lt;/base_price&gt;&lt;/course&gt;...&lt;/courses&gt;
            </div>
            <input
              ref="fileInput"
              accept=".xml"
              style="display: none"
              type="file"
              @change="handleFileImport"
            >
            <v-btn
              class="mt-4"
              color="secondary"
              variant="tonal"
              @click="triggerFileInput"
            >
              Выбрать файл
            </v-btn>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="xmlImportDialogVisible = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Уведомления -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import type { CourseResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { useXml } from '@/composables/useXml'
  import { coursesApi, coursesStore } from '@/stores/coursesStore'

  const { upload: uploadXml, exportXml } = useXml()

  // Состояние
  const searchQuery = ref('')
  const minDuration = ref<number | null>(null)
  const maxPrice = ref<number | null>(null)
  const dialogVisible = ref(false)
  const deleteDialogVisible = ref(false)
  const xmlImportDialogVisible = ref(false)
  const editingCourse = ref<CourseResponse | null>(null)
  const courseToDelete = ref<CourseResponse | null>(null)
  const formValid = ref(false)
  const formRef = ref<any>(null)
  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  // Форма
  const formData = ref({
    title: '',
    description: '',
    duration_days: null as number | null,
    base_price: '',
  })

  // Уведомления
  const snackbar = ref({
    show: false,
    message: '',
    color: 'success',
  })

  // Заголовки таблицы
  const headers = [
    { title: 'Название', key: 'title', width: 250, align: 'start' },
    { title: 'Описание', key: 'description', sortable: false, align: 'start' },
    { title: 'Длительность', key: 'duration_days', width: 120, align: 'center' },
    { title: 'Цена', key: 'base_price', width: 150, align: 'end' },
    { title: 'Действия', key: 'actions', sortable: false, width: 120, align: 'end' },
  ]

  // Пагинация
  const totalPages = computed(() => Math.ceil(coursesStore.state.pagination.count / coursesStore.state.pagination.per_page) || 1)

  // Валидация
  const requiredRule = (v: any) => !!v || 'Поле обязательно'
  const positiveNumberRule = (v: any) => (v !== null && v !== '' && Number(v) > 0) || 'Значение должно быть больше 0'

  function showSnackbar (message: string, color = 'success') {
    snackbar.value = { show: true, message, color }
  }

  // Загрузка курсов с фильтрами
  async function loadCourses () {
    const params: Record<string, any> = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (minDuration.value !== null && minDuration.value > 0) params.min_duration = minDuration.value
    if (maxPrice.value !== null && maxPrice.value > 0) params.max_price = maxPrice.value
    await coursesStore.fetch(params, true)
  }

  // Дебаунс поиска
  let searchTimeout: ReturnType<typeof setTimeout>
  function onSearchChange () {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      coursesStore.state.pagination.page = 1
      loadCourses()
    }, 300)
  }

  function onFilterChange () {
    coursesStore.state.pagination.page = 1
    loadCourses()
  }

  // Пагинация
  function onPageChange (page: number) {
    coursesStore.goToPage(page)
    loadCourses()
  }

  async function onPageSizeChange (size: number) {
    coursesStore.changePageSize(size)
    await loadCourses()
  }

  // CRUD
  function openAddDialog () {
    editingCourse.value = null
    formData.value = { title: '', description: '', duration_days: null, base_price: '' }
    dialogVisible.value = true
  }

  function openEditDialog (course: CourseResponse) {
    editingCourse.value = course
    formData.value = {
      title: course.title,
      description: course.description,
      duration_days: course.duration_days,
      base_price: course.base_price,
    }
    dialogVisible.value = true
  }

  async function saveCourse () {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    try {
      const payload = {
        title: formData.value.title,
        description: formData.value.description,
        duration_days: Number(formData.value.duration_days),
        base_price: formData.value.base_price,
      }
      if (editingCourse.value) {
        await coursesApi.update(editingCourse.value.id, payload)
        showSnackbar('Курс обновлён')
      } else {
        await coursesApi.create(payload)
        showSnackbar('Курс добавлен')
      }
      dialogVisible.value = false
      await loadCourses()
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка сохранения'
      showSnackbar(message, 'error')
    }
  }

  function confirmDelete (course: CourseResponse) {
    courseToDelete.value = course
    deleteDialogVisible.value = true
  }

  async function deleteCourse () {
    if (!courseToDelete.value) return
    try {
      await coursesApi.remove(courseToDelete.value.id)
      showSnackbar('Курс удалён')
      deleteDialogVisible.value = false
      await loadCourses()
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка удаления'
      showSnackbar(message, 'error')
    }
  }

  // XML экспорт
  async function exportCourseToXML (course: CourseResponse) {
    try {
      await exportXml('course', course.id)
      showSnackbar('XML экспортирован')
    } catch {
      showSnackbar('Ошибка экспорта XML', 'error')
    }
  }

  // XML импорт
  const triggerFileInput = () => fileInput.value?.click()

  async function handleFileImport (event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files?.[0]) await processXmlFile(input.files[0])
    input.value = ''
  }

  async function handleDrop (event: DragEvent) {
    isDragging.value = false
    const file = event.dataTransfer?.files?.[0]
    if (file) await processXmlFile(file)
  }

  async function processXmlFile (file: File) {
    if (!file.name.endsWith('.xml')) {
      showSnackbar('Загрузите XML-файл', 'error')
      return
    }
    try {
      await uploadXml(file)
      showSnackbar('XML импортирован, обновление данных...')
      setTimeout(async () => {
        await loadCourses()
        xmlImportDialogVisible.value = false
        showSnackbar('Таблица обновлена')
      }, 1500)
    } catch (error: any) {
      const message = error.response?.data?.error || 'Ошибка импорта XML'
      showSnackbar(message, 'error')
    }
  }

  onMounted(async () => {
    await loadCourses()
  })
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #fafafa;
}

.drop-zone:hover {
  border-color: #1976d2;
  background-color: #f0f7ff;
}

.drop-zone-active {
  border-color: #1976d2;
  background-color: #e3f2fd;
}

.v-data-table__wrapper {
  transition: opacity 0.2s ease;
}
</style>
