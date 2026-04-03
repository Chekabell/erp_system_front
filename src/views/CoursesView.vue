<template>
  <v-container fluid class="pa-6">
    <!-- Верхняя панель: заголовок + поиск -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <v-card-title class="text-h5 font-weight-bold">Курсы обучения</v-card-title>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Поиск по названию или коду..."
          density="compact"
          variant="solo"
          hide-details
          style="max-width: 380px;"
          @update:model-value="onSearch"
        />
      </div>
    </v-card>

    <!-- Сетка карточек (4 в ряд на больших экранах) -->
    <v-row dense>
      <v-col
        v-for="course in filteredCourses"
        :key="course.id"
        cols="12" sm="6" md="4" lg="3"
      >
        <v-card
          hover
          elevation="2"
          class="rounded-lg pa-4 card-hover-transition cursor-pointer"
          @click="openModal(course)"
        >
          <v-card-item class="pb-2">
            <template v-slot:prepend>
              <v-avatar :color="getAccentColor(course.sCode)" size="44" class="text-white">
                <v-icon size="24">mdi-book-open-page-variant</v-icon>
              </v-avatar>
            </template>
            <v-card-title class="text-h6 font-weight-medium line-clamp-2 mb-1">
              {{ course.sCourseHL }}
            </v-card-title>
            <v-card-subtitle class="text-caption text-medium-emphasis">
              Код: <span class="font-weight-bold">{{ course.sCode }}</span>
            </v-card-subtitle>
          </v-card-item>

          <v-divider class="my-3"></v-divider>

          <v-card-text class="pt-0">
            <div class="d-flex justify-space-between align-center">
              <v-chip size="small" variant="tonal" color="blue">
                <v-icon start size="small">mdi-clock-outline</v-icon>
                {{ course.nDurationInDays }} дн.
              </v-chip>
              <div class="text-h6 font-weight-bold text-success">
                {{ formatPrice(course.nPricePerPerson) }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Пустое состояние -->
    <v-empty-state
      v-if="filteredCourses.length === 0"
      title="Курсы не найдены"
      text="Измените параметры поиска или добавьте новый курс вручную."
      icon="mdi-book-off"
      class="mt-8"
    />

    <!-- Модальное окно с полной информацией -->
    <v-dialog v-model="dialog" max-width="650" scrollable>
      <v-card v-if="selectedCourse" class="rounded-lg" prepend-icon="mdi-book-open-variant">
        <v-card-title class="text-h5 font-weight-bold pt-4">{{ selectedCourse.sCourseHL }}</v-card-title>
        <v-card-subtitle class="text-body-2 text-medium-emphasis px-4 pb-2">
          Код курса: <v-chip size="x-small" class="ml-1">{{ selectedCourse.sCode }}</v-chip>
          <span class="mx-2">|</span>
          ID: {{ selectedCourse.id }}
        </v-card-subtitle>

        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <div class="text-body-1 mb-5">
            <v-icon start class="mr-1 align-self-start">mdi-text-box-outline</v-icon>
            <strong class="d-block mb-2">Описание курса:</strong>
            <p class="text-medium-emphasis pl-7">{{ selectedCourse.sDescription || 'Описание не предоставлено.' }}</p>
          </div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-card variant="tonal" color="primary" class="pa-4 h-100">
                <div class="text-caption text-medium-emphasis">Длительность обучения</div>
                <div class="text-h5 font-weight-bold mt-1 d-flex align-center">
                  <v-icon start class="mr-2">mdi-calendar-range</v-icon>
                  {{ selectedCourse.nDurationInDays }} рабочих дней
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card variant="tonal" color="success" class="pa-4 h-100">
                <div class="text-caption text-medium-emphasis">Стоимость за участника</div>
                <div class="text-h5 font-weight-bold mt-1 d-flex align-center">
                  <v-icon start class="mr-2">mdi-currency-rub</v-icon>
                  {{ formatPrice(selectedCourse.nPricePerPerson) }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="medium-emphasis" @click="dialog = false">Закрыть</v-btn>
          <v-btn color="primary" prepend-icon="mdi-pencil" disabled>Редактировать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  // 🔹 Типизация строго по структуре 4217.xml
  interface Course {
    id: number
    sCode: string              // Код курса
    sCourseHL: string          // Название курса
    sDescription?: string      // Описание (опционально)
    nDurationInDays: number    // Длительность в днях
    nPricePerPerson: number    // Цена за человека
  }

  const search = ref('')
  const dialog = ref(false)
  const selectedCourse = ref<Course | null>(null)

  // 📦 Демо-данные (будут заменены на fetch из Django API `/api/courses/`)
  const courses = ref<Course[]>([
    {
      id: 4217,
      sCode: '0001',
      sCourseHL: 'Базовый курс бизнес-аналитика',
      sDescription: 'Курс для бизнес-аналитиков по ознакомлению с общесистемными возможностями Global ERP.',
      nDurationInDays: 3,
      nPricePerPerson: 10000
    },
    {
      id: 4218,
      sCode: '0015',
      sCourseHL: 'Продвинутый SQL для аналитиков',
      sDescription: 'Глубокое погружение в оконные функции, оптимизацию запросов и работу с большими данными.',
      nDurationInDays: 5,
      nPricePerPerson: 18500
    },
    {
      id: 4219,
      sCode: '0022',
      sCourseHL: 'Управление проектами (Agile/Scrum)',
      nDurationInDays: 4,
      nPricePerPerson: 12000
    }
  ])

  // 🔍 Поиск в реальном времени
  const onSearch = () => {
    // Фильтрация происходит автоматически через computed
  }

  const filteredCourses = computed(() => {
    const q = search.value.toLowerCase().trim()
    if (!q) return courses.value
    return courses.value.filter(c =>
      c.sCourseHL.toLowerCase().includes(q) || c.sCode.toLowerCase().includes(q)
    )
  })

  // 🎨 Утилиты UI
  const getAccentColor = (code: string): string => {
    const colors = ['primary', 'success', 'warning', 'info', 'purple', 'teal', 'indigo', 'deep-orange']
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price)
  }

  // 🛠 Действия
  const openModal = (course: Course) => {
    selectedCourse.value = course
    dialog.value = true
  }
</script>

<style scoped>
.card-hover-transition {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
}
.card-hover-transition:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
