<template>
  <v-container class="pa-6" fluid>
    <!-- Header -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Курсы обучения</h1>
          <p class="text-body-2 text-medium-emphasis">Образовательные программы, доступные для записи участников</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 600px; flex: 1;">
          <v-text-field
            v-model="search"
            density="compact"
            hide-details
            label="Поиск по названию курса..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="coursesStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="coursesStore.state.loading && !coursesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="coursesStore.state.error" class="mt-4" type="error" variant="tonal">{{ coursesStore.state.error }}</v-alert>

    <!-- 🔹 Grid -->
    <v-row v-else dense>
      <v-col
        v-for="course in coursesStore.state.items"
        :key="course.id"
        cols="12"
        lg="3"
        md="4"
        sm="6"
      >
        <v-card
          class="rounded-lg pa-4 card-hover-transition cursor-pointer h-100"
          elevation="2"
          hover
          @click="openModal(course)"
        >
          <v-card-item class="pb-2">
            <template #prepend>
              <v-avatar class="text-white" :color="getAccentColor(course.id)" size="44">
                <v-icon size="24">mdi-book-open-page-variant</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-medium line-clamp-2 mb-1">{{ course.title }}</v-card-title>
            <v-card-subtitle class="text-caption text-medium-emphasis">Длительность: <span class="font-weight-bold">{{ course.duration_days }} дн.</span></v-card-subtitle>
          </v-card-item>
          <v-divider class="my-3" />
          <v-card-text class="pt-0">
            <div class="d-flex justify-space-between align-center">
              <v-chip color="blue" size="small" variant="tonal"><v-icon size="small" start>mdi-clock-outline</v-icon>{{ course.duration_days }} дн.</v-chip>
              <div class="text-h6 font-weight-bold text-success">{{ formatPrice(course.base_price) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state v-if="!coursesStore.state.loading && coursesStore.state.items.length === 0" class="mt-8" icon="mdi-book-off" title="Курсы не найдены" />

    <!-- Footer: Page Size & Pagination -->
    <div v-if="totalPages > 1" class="d-flex justify-space-between align-center mt-6 pa-3 bg-surface-variant rounded-lg">
      <v-pagination
        :length="totalPages"
        :model-value="coursesStore.state.pagination.page || 1"
        :total-visible="7"
        @update:model-value="handlePageChange"
      />
    </div>

    <!-- 🔹 Dialog: Просмотр курса -->
    <v-dialog v-model="dialog" max-width="650" scrollable>
      <v-card v-if="selectedCourse" class="rounded-lg">
        <v-card-title class="text-h5 font-weight-bold pt-4">{{ selectedCourse.title }}</v-card-title>
        <v-card-subtitle class="px-4 pb-2">ID: {{ selectedCourse.id }}</v-card-subtitle>
        <v-divider class="my-2" />
        <v-card-text class="pa-4">
          <p class="text-medium-emphasis mb-4">{{ selectedCourse.description || 'Описание не предоставлено.' }}</p>
          <v-row dense>
            <v-col cols="6"><v-card class="pa-4 text-center" color="primary" variant="tonal"><div class="text-caption">Длительность</div><div class="text-h5 font-weight-bold">{{ selectedCourse.duration_days }} дн.</div></v-card></v-col>
            <v-col cols="6"><v-card class="pa-4 text-center" color="success" variant="tonal"><div class="text-caption">Стоимость</div><div class="text-h5 font-weight-bold">{{ formatPrice(selectedCourse.base_price) }}</div></v-card></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="dialog = false">Закрыть</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { CourseResponse } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { coursesStore } from '@/stores/coursesStore'

  // 🔍 Поиск и пагинация
  const search = ref('')

  const totalPages = computed(() => {
    const count = coursesStore.state.pagination?.count || 0
    return Math.ceil(count / PER_PAGE) || 1
  })

  // 🔑 Явно передаем per_page при смене страницы
  function handlePageChange (page: number) {
    coursesStore.fetch({ page, per_page: PER_PAGE })
  }

  function handleSearch () {
    coursesStore.reset()
    // Важно: при поиске тоже сохраняем per_page, иначе сбросится на 10
    coursesStore.fetch({ search: search.value || undefined, per_page: PER_PAGE })
  }

  function openModal (course: CourseResponse) {
    selectedCourse.value = course
    dialog.value = true
  }

  function getAccentColor (id: number) {
    return ['primary', 'success', 'warning', 'info', 'purple', 'teal', 'indigo', 'deep-orange'][id % 8]
  }

  function formatPrice (p: string) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number.parseFloat(p) || 0)
  }

  onMounted(() => {
    fetchCourses() // ✅ Первая загрузка с per_page=12
  })
</script>

<style scoped>
.card-hover-transition { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease; }
.card-hover-transition:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
