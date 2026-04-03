<template>
  <v-container fluid class="pa-6">
    <!-- Верхняя панель -->
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Спецификации обучения</h1>
          <p class="text-body-2 text-medium-emphasis">Юридические документы, агрегирующие учебные группы и итоговую стоимость</p>
        </div>
        <div class="d-flex ga-3">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Поиск по номеру, компании..."
            density="compact"
            variant="solo"
            hide-details
            style="max-width: 300px;"
          />
          <v-btn prepend-icon="mdi-plus" color="primary" disabled>Создать спецификацию</v-btn>
        </div>
      </div>
    </v-card>

    <!-- Таблица спецификаций -->
    <v-card elevation="2" class="rounded-lg overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="specifications"
        :search="search"
        class="elevation-0"
        hover
        items-per-page-text="Спецификаций на странице"
        no-data-text="Спецификации не найдены"
      >
        <!-- Колонка: Номер + Дата -->
        <template v-slot:item.docInfo="{ item }">
          <div>
            <div class="font-weight-bold text-primary">№ {{ item.docNumber }}</div>
            <div class="text-caption text-medium-emphasis">{{ formatDate(item.docDate) }}</div>
          </div>
        </template>

        <!-- Колонка: Компания -->
        <template v-slot:item.company="{ item }">
          <v-chip size="small" variant="tonal" color="secondary" class="text-capitalize">
            <v-icon start size="small">mdi-office-building-marker</v-icon>
            {{ item.companyName }}
          </v-chip>
        </template>

        <!-- ✅ ИСПРАВЛЕНИЕ: Колонка "Групп" теперь выводит количество, а не сырой массив -->
        <template v-slot:item.groups="{ item }">
          <v-chip size="small" variant="outlined" class="font-weight-bold">
            {{ item.groups.length }}
          </v-chip>
        </template>

        <!-- Колонка: Суммы -->
        <template v-slot:item.subtotal="{ item }">
          <div class="text-right font-weight-medium">{{ formatCurrency(item.subtotal) }}</div>
        </template>
        <template v-slot:item.vat="{ item }">
          <div class="text-right text-medium-emphasis">{{ formatCurrency(item.vat) }}</div>
        </template>
        <template v-slot:item.total="{ item }">
          <div class="text-right font-weight-bold text-success">{{ formatCurrency(item.total) }}</div>
        </template>

        <!-- Колонка: Действия -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-eye" variant="text" color="primary" size="small" @click="openDetail(item)" />
          <v-btn icon="mdi-printer" variant="text" color="secondary" size="small" disabled />
        </template>
      </v-data-table>
    </v-card>

    <!-- Модальное окно с детализацией и расчетами -->
    <v-dialog v-model="dialog" max-width="900" scrollable>
      <v-card v-if="selectedSpec" class="rounded-lg">
        <v-card-title class="text-h5 font-weight-bold pt-4 d-flex align-center ga-2">
          <v-icon color="primary">mdi-file-document-check</v-icon>
          Спецификация № {{ selectedSpec.docNumber }}
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2">
          Дата: {{ formatDate(selectedSpec.docDate) }} | Заказчик: {{ selectedSpec.companyName }}
        </v-card-subtitle>

        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-5">
          <!-- Таблица привязанных групп -->
          <h3 class="text-h6 font-weight-medium mb-3 d-flex align-center">
            <v-icon start color="info">mdi-account-group</v-icon>
            Учебные группы в спецификации ({{ selectedSpec.groups.length }})
          </h3>
          <v-table density="compact" class="elevation-0 border-thin rounded-lg mb-6">
            <thead>
              <tr class="bg-surface-variant">
                <th class="text-uppercase text-caption">Курс</th>
                <th class="text-uppercase text-caption">Период</th>
                <th class="text-uppercase text-caption text-center">Участников</th>
                <th class="text-uppercase text-caption text-right">Цена за чел.</th>
                <th class="text-uppercase text-caption text-right">Стоимость группы</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="grp in selectedSpec.groups" :key="grp.groupId">
                <td class="font-weight-medium">{{ grp.courseName }}</td>
                <td class="text-medium-emphasis">{{ grp.period }}</td>
                <td class="text-center">{{ grp.participants }}</td>
                <td class="text-right">{{ formatCurrency(grp.costPerPerson) }}</td>
                <td class="text-right font-weight-medium">{{ formatCurrency(grp.totalCost) }}</td>
              </tr>
            </tbody>
          </v-table>

          <!-- Финансовый блок (п.2.2.5 ТЗ) -->
          <v-alert type="info" variant="tonal" class="mb-4">
            <template v-slot:title>📐 Логика расчета стоимости (п.3.2 ТЗ)</template>
            <div class="text-body-2 text-medium-emphasis mt-1">
              Расчет выполняется в реальном времени при изменении состава групп.
              Формула: <code class="text-primary font-weight-bold">Σ(Стоимость группы) → Сумма без НДС</code>
            </div>
          </v-alert>

          <v-row dense>
            <v-col cols="12" md="4">
              <v-sheet variant="outlined" class="pa-4 rounded-lg text-center">
                <div class="text-caption text-medium-emphasis">Сумма по спецификации (без НДС)</div>
                <div class="text-h5 font-weight-bold mt-2">{{ formatCurrency(selectedSpec.subtotal) }}</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="4">
              <v-sheet variant="outlined" class="pa-4 rounded-lg text-center">
                <div class="text-caption text-medium-emphasis">Сумма НДС (22%)</div>
                <div class="text-h5 font-weight-bold mt-2 text-warning">{{ formatCurrency(selectedSpec.vat) }}</div>
                <div class="text-caption text-medium-emphasis mt-1">= Сумма без НДС × 0.22</div>
              </v-sheet>
            </v-col>
            <v-col cols="12" md="4">
              <v-sheet variant="tonal" color="success" class="pa-4 rounded-lg text-center">
                <div class="text-caption text-white">Итого с НДС</div>
                <div class="text-h4 font-weight-bold mt-2 text-white">{{ formatCurrency(selectedSpec.total) }}</div>
                <div class="text-caption text-white text-opacity-70 mt-1">= Сумма без НДС + НДС</div>
              </v-sheet>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Закрыть</v-btn>
          <v-btn color="primary" prepend-icon="mdi-file-export" disabled>Экспорт в PDF</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  // 🔹 Типизация строго по п.2.2.5 ТЗ
  interface SpecGroupItem {
    groupId: number
    courseName: string
    period: string
    participants: number
    costPerPerson: number
    totalCost: number // Вычисляемое: participants * costPerPerson
  }

  interface Specification {
    id: number
    docNumber: string          // Номер спецификации
    docDate: string            // Дата спецификации
    companyId: number
    companyName: string        // Ссылка на Компанию
    groups: SpecGroupItem[]    // Ссылочные Учебные группы
    subtotal: number           // Сумма по спецификации, руб, без НДС
    vat: number                // Сумма НДС (22%)
    total: number              // Итого с НДС, руб
  }

  const search = ref('')
  const dialog = ref(false)
  const selectedSpec = ref<Specification | null>(null)

  // 📦 Демо-данные (будут заменены на Django API `/api/specifications/`)
  const specifications = ref<Specification[]>([
    {
      id: 1,
      docNumber: 'СП-2025-001',
      docDate: '2025-11-15',
      companyId: 1,
      companyName: 'ООО "Ромашка"',
      subtotal: 188500,
      vat: 41470,
      total: 229970,
      groups: [
        { groupId: 101, courseName: 'Базовый курс бизнес-аналитика', period: '15.11 – 17.11.2025', participants: 6, costPerPerson: 10000, totalCost: 60000 },
        { groupId: 102, courseName: 'Продвинутый SQL для аналитиков', period: '20.11 – 24.11.2025', participants: 5, costPerPerson: 18500, totalCost: 92500 },
        { groupId: 103, courseName: 'Управление проектами (Agile/Scrum)', period: '01.12 – 04.12.2025', participants: 3, costPerPerson: 12000, totalCost: 36000 }
      ]
    },
    {
      id: 2,
      docNumber: 'СП-2025-002',
      docDate: '2025-11-20',
      companyId: 2,
      companyName: 'АО "ТехноСтрой"',
      subtotal: 120000,
      vat: 26400,
      total: 146400,
      groups: [
        { groupId: 104, courseName: 'Базовый курс бизнес-аналитика', period: '02.12 – 04.12.2025', participants: 12, costPerPerson: 10000, totalCost: 120000 }
      ]
    }
  ])

  // 📐 Заголовки таблицы
  const headers = [
    { title: 'Реквизиты', key: 'docInfo', sortable: true, width: 180 },
    { title: 'Компания-заказчик', key: 'company', sortable: true },
    { title: 'Групп', key: 'groups', sortable: false, width: 80, align: 'center' },
    { title: 'Без НДС', key: 'subtotal', sortable: true, align: 'end' },
    { title: 'НДС (22%)', key: 'vat', sortable: true, align: 'end' },
    { title: 'Итого', key: 'total', sortable: true, align: 'end' },
    { title: '', key: 'actions', sortable: false, width: 100, align: 'end' }
  ]

  // 🛠 Утилиты
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  }

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // 🔍 Поиск
  const filteredSpecs = computed(() => {
    const q = search.value.toLowerCase().trim()
    if (!q) return specifications.value
    return specifications.value.filter(s =>
      s.docNumber.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q)
    )
  })

  // 🛠 Действия
  const openDetail = (spec: Specification) => {
    selectedSpec.value = spec
    dialog.value = true
  }
</script>

<style scoped>
.v-data-table__wrapper { transition: opacity 0.2s ease; }
</style>