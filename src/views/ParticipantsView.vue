<template>
  <v-card elevation="2" class="rounded-lg overflow-hidden">
    <!-- Верхняя панель: заголовок, поиск, кнопка создания -->
    <v-toolbar color="surface" density="compact" class="border-b">
      <v-toolbar-title class="text-h6 font-weight-medium ml-2">Участники обучения</v-toolbar-title>
      <v-spacer />
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Поиск по ФИО, коду или компании..."
        density="compact"
        variant="solo"
        hide-details
        class="ma-2"
        style="max-width: 320px;"
      />
      <v-btn prepend-icon="mdi-plus" color="primary" class="ml-2" disabled>
        Добавить участника
      </v-btn>
    </v-toolbar>

    <!-- Таблица участников -->
    <v-data-table
      :headers="headers"
      :items="participants"
      :search="search"
      class="elevation-0"
      hover
      items-per-page-text="Участников на странице"
      no-data-text="Участники не найдены. Загрузите XML или добавьте вручную."
    >
      <!-- Колонка: ФИО + Email -->
      <template v-slot:item.fullName="{ item }">
        <div class="d-flex align-center ga-3">
          <div>
            <div class="font-weight-medium">{{ item.fullName }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.email || 'Email не указан' }}</div>
          </div>
        </div>
      </template>

      <!-- Колонка: Компания -->
      <template v-slot:item.orgName="{ item }">
        <v-chip size="small" variant="tonal" color="primary" class="text-capitalize">
          <v-icon start size="small">mdi-office-building-marker</v-icon>
          {{ item.orgName }}
        </v-chip>
      </template>

      <!-- Колонка: Группы (placeholder) -->
      <template v-slot:item.groups="{ item }">
        <div v-if="item.groups?.length">
          <v-chip v-for="g in item.groups.slice(0, 2)" :key="g" size="x-small" variant="outlined" class="mr-1 mb-1">
            {{ g }}
          </v-chip>
          <v-chip v-if="item.groups.length > 2" size="x-small" variant="outlined">
            +{{ item.groups.length - 2 }}
          </v-chip>
        </div>
        <span v-else class="text-medium-emphasis text-caption">Не назначен</span>
      </template>

      <!-- Колонка: Действия -->
      <template v-slot:item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" @click="openEdit(item)" />
        <v-btn icon="mdi-eye" variant="text" color="secondary" size="small" @click="openDetail(item)" />
      </template>
    </v-data-table>

    <!-- Футер с информацией -->
    <v-divider />
    <v-card-text class="pa-4 d-flex justify-space-between align-center bg-surface-variant">
      <div class="text-caption text-medium-emphasis">
        📊 Отображено: {{ participants.length }} записей (демо-режим)
      </div>
      <div class="text-caption text-medium-emphasis">
        🔌 Ожидается подключение API Django `/api/participants/`
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  // 🔹 Типизация строго по XML 1203.xml + ТЗ п.2.2.1
  interface Participant {
    id: number
    code: string              // sCode
    lastName: string          // sLastName
    firstName: string         // sFirstName
    middleName: string        // sMiddleName
    fullName: string          // sFIO
    orgId: number             // idOrganization
    orgName: string           // idOrganizationHL
    email?: string            // ТЗ п.2.2.1 (в XML отсутствует, оставлено под будущее)
    groups?: string[]         // ТЗ п.2.2.1 (ссылочный массив)
  }

  // 🔍 Поиск
  const search = ref('')

  // 📦 Демо-данные (будут заменены на fetch из Django)
  const participants = ref<Participant[]>([
    {
      id: 1203,
      code: '0048',
      lastName: 'Иванов',
      firstName: 'Иван',
      middleName: 'Иванович',
      fullName: 'Иванов Иван Иванович',
      orgId: 162362,
      orgName: 'ООО "Ромашка"',
      email: 'i.ivanov@romashka.ru',
      groups: ['Курс 1С:Бухгалтерия', 'Лидерство']
    },
    {
      id: 1204,
      code: '0051',
      lastName: 'Петрова',
      firstName: 'Анна',
      middleName: 'Сергеевна',
      fullName: 'Петрова Анна Сергеевна',
      orgId: 162370,
      orgName: 'АО "ТехноСтрой"',
      email: 'a.petrova@techno.ru',
      groups: ['Excel Pro']
    },
    {
      id: 1205,
      code: '0063',
      lastName: 'Сидоров',
      firstName: 'Дмитрий',
      middleName: 'Алексеевич',
      fullName: 'Сидоров Дмитрий Алексеевич',
      orgId: 162362,
      orgName: 'ООО "Ромашка"',
      email: '',
      groups: []
    }
  ])

  // 📐 Заголовки таблицы
  const headers = [
    { title: 'Сотрудник', key: 'fullName', sortable: true, align: 'start' },
    { title: 'Код', key: 'code', sortable: true, width: 90, align: 'center' },
    { title: 'Компания', key: 'orgName', sortable: true },
    { title: 'Группы', key: 'groups', sortable: false, width: 180 },
    { title: '', key: 'actions', sortable: false, width: 100, align: 'end' }
  ]

  // 🎨 Утилиты UI
  const getInitials = (name: string): string => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
  }

  const getAvatarColor = (code: string): string => {
    const colors = ['primary', 'success', 'warning', 'error', 'info', 'purple', 'indigo', 'teal']
    const num = parseInt(code, 10) || 0
    return colors[num % colors.length]
  }

  // 🛠 Действия (заглушки под роутер/диалоги)
  const openEdit = (item: Participant) => {
    console.log('Редактировать:', item)
    // TO DO: router.push({ name: 'participant-edit', params: { id: item.id } })
  }

  const openDetail = (item: Participant) => {
    console.log('Просмотр карточки:', item)
    // TO DO: router.push({ name: 'participant-detail', params: { id: item.id } })
  }
</script>

<style scoped>
/* Плавная анимация строк при поиске */
.v-data-table__wrapper {
  transition: opacity 0.2s ease;
}
</style>