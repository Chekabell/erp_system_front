<template>
  <v-container fluid class="pa-6">
    <!-- 🔹 Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Курсы обучения</h1>
          <p class="text-body-2 text-medium-emphasis">Образовательные программы, доступные для записи участников</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 600px; flex: 1;">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Поиск по названию курса..."
            density="compact"
            variant="solo"
            hide-details
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="coursesStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="coursesStore.state.loading && !coursesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="coursesStore.state.error" type="error" variant="tonal" class="mt-4">
      {{ coursesStore.state.error }}
      <v-btn variant="text" color="error" @click="handleSearch" class="ml-2">Повторить</v-btn>
    </v-alert>

    <!-- 🔹 Grid -->
    <v-row v-else dense>
      <v-col v-for="course in coursesStore.state.items" :key="course.id" cols="12" sm="6" md="4" lg="3">
        <v-card
          hover
          elevation="2"
          class="rounded-lg pa-4 card-hover-transition cursor-pointer h-100"
          @click="openModal(course)"
        >
          <!-- Шапка карточки с кнопкой удаления -->
          <div class="d-flex justify-space-between align-start mb-2">
            <v-avatar :color="getAccentColor(course.id)" size="44" class="text-white">
              <v-icon size="24">mdi-book-open-page-variant</v-icon>
            </v-avatar>
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              color="error"
              size="small"
              class="mt-n2 mr-n2"
              @click.stop="openDeleteDialog(course)"
              title="Удалить курс"
            />
          </div>

          <v-card-title class="text-h6 font-weight-medium line-clamp-2 mb-1">{{ course.title }}</v-card-title>
          <v-card-subtitle class="text-caption text-medium-emphasis mb-3">Длительность: <span class="font-weight-bold">{{ course.duration_days }} дн.</span></v-card-subtitle>

          <v-divider class="my-2"></v-divider>

          <v-card-text class="pt-0">
            <div class="d-flex justify-space-between align-center">
              <v-chip size="small" variant="tonal" color="blue"><v-icon start size="small">mdi-clock-outline</v-icon>{{ course.duration_days }} дн.</v-chip>
              <div class="text-h6 font-weight-bold text-success">{{ formatPrice(course.base_price) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state v-if="!coursesStore.state.loading && coursesStore.state.items.length === 0" title="Курсы не найдены" icon="mdi-book-off" class="mt-8" />

    <!-- 🔹 Footer: Pagination -->
    <div class="d-flex justify-center mt-6" v-if="totalPages > 1">
      <v-pagination
        :model-value="coursesStore.state.pagination.page || 1"
        :length="totalPages"
        :total-visible="7"
        @update:model-value="handlePageChange"
      />
    </div>

    <!-- 🔹 Dialog: Просмотр курса -->
    <v-dialog v-model="dialog" max-width="650" scrollable>
      <v-card v-if="selectedCourse" class="rounded-lg">
        <v-card-title class="text-h5 font-weight-bold pt-4">{{ selectedCourse.title }}</v-card-title>
        <v-card-subtitle class="px-4 pb-2">ID: {{ selectedCourse.id }}</v-card-subtitle>
        <v-divider class="my-2"></v-divider>
        <v-card-text class="pa-4">
          <p class="text-medium-emphasis mb-4">{{ selectedCourse.description || 'Описание не предоставлено.' }}</p>
          <v-row dense>
            <v-col cols="6"><v-card variant="tonal" color="primary" class="pa-4 text-center"><div class="text-caption">Длительность</div><div class="text-h5 font-weight-bold">{{ selectedCourse.duration_days }} дн.</div></v-card></v-col>
            <v-col cols="6"><v-card variant="tonal" color="success" class="pa-4 text-center"><div class="text-caption">Стоимость</div><div class="text-h5 font-weight-bold">{{ formatPrice(selectedCourse.base_price) }}</div></v-card></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions><v-spacer></v-spacer><v-btn variant="text" @click="dialog = false">Закрыть</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Создание курса -->
    <v-dialog v-model="createDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новый курс обучения</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания курса</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.title"
              label="Название курса *"
              :rules="[v => !!v?.trim() || 'Название обязательно', v => (v?.length <= 255) || 'Максимум 255 символов']"
              density="compact"
              variant="outlined"
              class="mb-3"
              counter="255"
            />
            <v-textarea
              v-model="form.description"
              label="Описание курса"
              density="compact"
              variant="outlined"
              rows="3"
              class="mb-3"
              counter="500"
            />
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.duration_days"
                  label="Длительность (дни) *"
                  type="number"
                  min="1"
                  max="365"
                  :rules="[
                    v => !!v || 'Укажите длительность',
                    v => v >= 1 || 'Минимум 1 день',
                    v => v <= 365 || 'Максимум 365 дней'
                  ]"
                  density="compact"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="form.base_price"
                  label="Цена за чел. (руб) *"
                  type="number"
                  min="0"
                  step="100"
                  :rules="[
                    v => !!v || 'Укажите цену',
                    v => v >= 0 || 'Цена не может быть отрицательной'
                  ]"
                  density="compact"
                  variant="outlined"
                  prefix="₽"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="createDialog = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!formValid" :loading="createLoading" @click="submitCreate">Создать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Подтверждение удаления -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4 text-error">Удалить курс?</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Это действие необратимо</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <p class="text-body-1">
            Вы уверены, что хотите удалить курс
            <strong class="text-primary">"{{ courseToDelete?.title }}"</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Все учебные группы, привязанные к этому курсу, останутся в системе, но потеряют ссылку на курс.
          </p>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="submitDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { coursesStore } from '@/stores/coursesStore'
  import type { CourseResponse, CourseRequest } from '@/types/api'

  // 🔧 КОНСТАНТА: всегда 12 элементов на странице
  const PER_PAGE = 12

  // 🔍 Поиск и пагинация
  const search = ref('')

  const totalPages = computed(() => {
    const count = coursesStore.state.pagination?.count || 0
    return Math.ceil(count / PER_PAGE) || 1
  })

  // 🔑 Единая функция загрузки с фиксированным per_page
  const fetchCourses = (extraParams: Record<string, any> = {}) => {
    return coursesStore.fetch({
      per_page: PER_PAGE,
      ...extraParams
    })
  }

  const handleSearch = () => {
    coursesStore.reset()
    fetchCourses({ search: search.value || undefined, page: 1 })
  }

  // 🔑 Обработчик пагинации — явно передаём page + per_page
  const handlePageChange = (page: number) => {
    fetchCourses({ page })
  }

  // 📖 Просмотр курса
  const dialog = ref(false)
  const selectedCourse = ref<CourseResponse | null>(null)

  const openModal = (course: CourseResponse) => {
    selectedCourse.value = course
    dialog.value = true
  }

  // ➕ Создание курса
  const createDialog = ref(false)
  const formValid = ref(false)
  const createLoading = ref(false)
  const form = ref<CourseRequest>({
    title: '',
    description: '',
    duration_days: 1,
    base_price: '0'
  })

  const openCreateDialog = () => {
    form.value = { title: '', description: '', duration_days: 1, base_price: '0' }
    formValid.value = false
    createDialog.value = true
  }

  const submitCreate = async () => {
    if (!formValid.value) return
    createLoading.value = true
    try {
      const payload: CourseRequest = {
        ...form.value,
        base_price: parseFloat(String(form.value.base_price)).toFixed(2)
      }
      await coursesStore.create(payload)
      createDialog.value = false
      await fetchCourses() // ✅ Обновляем с per_page=12
    } catch (err) {
      console.error('Ошибка создания курса:', err)
    } finally {
      createLoading.value = false
    }
  }

  // 🗑 Удаление курса
  const deleteDialog = ref(false)
  const deleteLoading = ref(false)
  const courseToDelete = ref<CourseResponse | null>(null)

  const openDeleteDialog = (course: CourseResponse) => {
    courseToDelete.value = course
    deleteDialog.value = true
  }

  const submitDelete = async () => {
    if (!courseToDelete.value) return
    deleteLoading.value = true
    try {
      await coursesStore.remove(courseToDelete.value.id)
      deleteDialog.value = false
      await fetchCourses() // ✅ Обновляем с per_page=12
    } catch (err) {
      console.error('Ошибка удаления курса:', err)
    } finally {
      deleteLoading.value = false
    }
  }

  // 🛠 Утилиты
  const getAccentColor = (id: number): string => {
    const colors = ['primary','success','warning','info','purple','teal','indigo','deep-orange']
    return colors[id % colors.length]
  }

  const formatPrice = (p: string | number): string => {
    const num = typeof p === 'string' ? parseFloat(p) : p
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num || 0)
  }

  // 🚀 Initial load
  onMounted(() => {
    fetchCourses() // ✅ Первая загрузка с per_page=12
  })
</script>

<style scoped>
.card-hover-transition { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease; }
.card-hover-transition:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>