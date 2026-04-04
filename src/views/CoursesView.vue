<template>
  <v-container fluid class="pa-6">
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <h1 class="text-h4 font-weight-bold">Курсы обучения</h1>
        <div class="d-flex ga-3" style="max-width: 500px; flex: 1;">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Поиск по названию..." density="compact" variant="solo" hide-details @keyup.enter="handleSearch" />
          <v-btn color="primary" :loading="coursesStore.state.loading" @click="handleSearch">Найти</v-btn>
        </div>
      </div>
    </v-card>

    <div v-if="coursesStore.state.loading && !coursesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>
    <v-alert v-else-if="coursesStore.state.error" type="error" variant="tonal" class="mt-4">{{ coursesStore.state.error }}</v-alert>

    <v-row v-else dense>
      <v-col v-for="course in coursesStore.state.items" :key="course.id" cols="12" sm="6" md="4" lg="3">
        <v-card hover elevation="2" class="rounded-lg pa-4 card-hover-transition cursor-pointer" @click="openModal(course)">
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-avatar :color="getAccentColor(course.id)" size="44" class="text-white">
                <v-icon size="24">mdi-book-open-page-variant</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-medium line-clamp-2 mb-1">{{ course.title }}</v-card-title>
            <v-card-subtitle class="text-caption text-medium-emphasis">Длительность: <span class="font-weight-bold">{{ course.duration_days }} дн.</span></v-card-subtitle>
          </v-card-item>
          <v-divider class="my-3"></v-divider>
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

    <div class="d-flex justify-center mt-6" v-if="coursesStore.state.pagination.count > coursesStore.state.pagination.pageSize">
      <v-pagination :model-value="coursesStore.state.pagination.page" :length="Math.ceil(coursesStore.state.pagination.count / coursesStore.state.pagination.pageSize)" @update:model-value="coursesStore.goToPage" />
    </div>

    <!-- Modal (оставлен без изменений, только данные берутся из стора) -->
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
  </v-container>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { coursesStore } from '@/stores/coursesStore'
  import type { Course } from '@/types/api'

  const search = ref('')
  const dialog = ref(false)
  const selectedCourse = ref<Course | null>(null)

  const handleSearch = () => {
    coursesStore.reset()
    coursesStore.fetch({ search: search.value || undefined })
  }
  const openModal = (course: Course) => { selectedCourse.value = course; dialog.value = true }
  const getAccentColor = (id: number) => ['primary','success','warning','info','purple','teal','indigo','deep-orange'][id % 8]
  const formatPrice = (p: string) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(parseFloat(p) || 0)

  onMounted(() => coursesStore.fetch())
</script>

<style scoped>
.card-hover-transition { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease; }
.card-hover-transition:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>