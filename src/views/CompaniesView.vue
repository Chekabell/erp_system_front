<template>
  <v-container class="pa-6" fluid>
    <v-card class="mb-6 pa-4 rounded-lg" elevation="2">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Компании-заказчики</h1>
          <p class="text-body-2 text-medium-emphasis">Аналитика обучения и спецификаций в разрезе организаций</p>
        </div>
        <div class="d-flex ga-3" style="max-width: 600px; flex: 1;">
          <v-text-field
            v-model="search"
            density="compact"
            hide-details
            label="Поиск по названию или коду..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            @keyup.enter="handleSearch"
          />
          <v-btn color="primary" :loading="companiesStore.state.loading" @click="handleSearch">Найти</v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Создать</v-btn>
        </div>
      </div>
    </v-card>

    <!-- 🔹 Loading / Error -->
    <div v-if="companiesStore.state.loading && !companiesStore.state.isFetched" class="d-flex justify-center mt-8">
      <v-progress-circular color="primary" indeterminate size="64" />
    </div>
    <v-alert v-else-if="companiesStore.state.error" class="mt-4" type="error" variant="tonal">{{ companiesStore.state.error }}</v-alert>

    <!-- 🔹 Grid -->
    <v-row v-else dense>
      <v-col
        v-for="company in companiesStore.state.items"
        :key="company.id"
        cols="12"
        lg="4"
        sm="6"
        xl="3"
      >
        <!-- Добавил cursor-pointer явно -->
        <v-card class="rounded-lg overflow-hidden company-card cursor-pointer" elevation="2" hover @click="openAnalytics(company)">
          <div class="pa-4 bg-surface-variant">
            <div class="d-flex align-center ga-3">
              <div class="overflow-hidden">
                <div class="text-h6 font-weight-medium text-truncate">{{ company.name }}</div>
                <div class="text-caption text-medium-emphasis">Код: {{ company.code }}</div>
              </div>
            </div>
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              color="error"
              size="small"
              class="mt-n1 mr-n2"
              @click.stop="openDeleteDialog(company)"
              title="Удалить компанию"
            />
          </div>
          <!-- ... (Содержимое карточки) ... -->
          <div class="pa-4">
            <div class="d-flex justify-space-between mb-3">
              <div class="text-center flex-1">
                <div class="text-h5 font-weight-bold text-primary">--</div>
                <div class="text-caption text-medium-emphasis">Сотрудников</div>
              </div>
              <v-divider vertical />
              <div class="text-center flex-1">
                <div class="text-h5 font-weight-bold text-success">{{ company.specifications?.length || 0 }}</div>
                <div class="text-caption text-medium-emphasis">Спецификаций</div>
              </div>
            </div>
            <v-progress-linear :model-value="0" color="info" height="8" rounded class="mb-2"></v-progress-linear>
            <div class="d-flex justify-space-between align-center">
              <span class="text-caption text-medium-emphasis">Прогресс обучения</span>
              <span class="text-caption font-weight-bold">0%</span>
            </div>
          </div>
          <v-divider />
          <div class="pa-3 d-flex justify-end">
            <v-btn append-icon="mdi-arrow-right" color="primary" size="small" variant="text">Аналитика</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-empty-state v-if="!companiesStore.state.loading && companiesStore.state.items.length === 0" class="mt-8" icon="mdi-office-building-remove" title="Компании не найдены" />

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
      <v-pagination :length="totalPages" :model-value="companiesStore.state.pagination.page" @update:model-value="companiesStore.goToPage" />
    </div>

    <!-- 🔹 Dialog: Аналитика компании -->
    <v-dialog v-model="dialog" max-width="850" scrollable>
      <v-card v-if="selectedCompany" class="rounded-lg" prepend-icon="mdi-chart-box-outline">
        <template #title>
          <span class="text-h5 font-weight-bold">Аналитика: {{ selectedCompany.name }}</span>
        </template>
        <template #subtitle>
          Код: <v-chip size="x-small">{{ selectedCompany.code }}</v-chip> | ID: {{ selectedCompany.id }}
        </template>

        <v-divider class="my-2" />

        <v-card-text class="pa-5">
          <v-alert class="mb-4" type="info" variant="tonal">
            <template #title>📊 Данные аналитики</template>
            <v-table class="elevation-0 border-thin rounded-lg" density="comfortable">
              <thead>
                <tr>
                  <th class="text-uppercase text-caption">Спецификация</th>
                  <th class="text-uppercase text-caption text-right">Дата</th>
                  <th class="text-uppercase text-caption text-right">Номер</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="spec in selectedCompany.specifications" :key="spec.id">
                  <td class="font-weight-medium">Спецификация #{{ spec.id }}</td>
                  <td class="text-right">{{ formatDate(spec.date) }}</td>
                  <td class="text-right">{{ spec.number }}</td>
                </tr>
                <tr v-if="!selectedCompany.specifications?.length">
                  <td class="text-center text-medium-emphasis py-4" colspan="3">Нет привязанных спецификаций</td>
                </tr>
              </tbody>
            </v-table>
          </v-alert>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 🔹 Dialog: Создание компании -->
    <v-dialog v-model="createDialog" max-width="480">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold pt-4">Новая компания</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Заполните обязательные поля для создания записи</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <v-form v-model="formValid" @submit.prevent="submitCreate">
            <v-text-field
              v-model="form.name"
              label="Полное наименование *"
              :rules="[v => !!v?.trim() || 'Название обязательно']"
              density="compact"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="form.code"
              label="Код компании (2-4 символа) *"
              :rules="[
                v => !!v?.trim() || 'Код обязателен',
                v => (v?.length >= 2 && v?.length <= 4) || 'Длина кода от 2 до 4 символов'
              ]"
              density="compact"
              variant="outlined"
              counter="4"
            />
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
        <v-card-title class="text-h6 font-weight-bold pt-4 text-error">Удалить компанию?</v-card-title>
        <v-card-subtitle class="px-4 pb-2">Это действие необратимо</v-card-subtitle>
        <v-divider class="my-2"></v-divider>

        <v-card-text class="pa-4">
          <p class="text-body-1">
            Вы уверены, что хотите удалить компанию
            <strong class="text-primary">"{{ companyToDelete?.name }}"</strong>?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Все привязанные спецификации и ссылки будут потеряны.
          </p>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { Company } from '@/types/api'
  import { computed, onMounted, ref } from 'vue'
  import { companiesStore } from '@/stores/companiesStore'

  // 🔍 Поиск
  const search = ref('')
  const totalPages = computed(() => Math.ceil(companiesStore.state.pagination.count / companiesStore.state.pagination.pageSize) || 1)

  function handleSearch () {
    companiesStore.reset()
    companiesStore.fetch({ search: search.value || undefined })
  }

  function openAnalytics (company: Company) {
    selectedCompany.value = company
    dialog.value = true
  }

  function getAvatarColor (code: string): string {
    const colors = ['primary', 'success', 'warning', 'error', 'info', 'purple', 'teal', 'indigo']
    let hash = 0
    for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  function formatDate (dateStr: string): string {
    if (!dateStr) return '--'
    const [year, month, day] = dateStr.split('-')
    return `${day}.${month}.${year}`
  }

  onMounted(() => companiesStore.fetch())
</script>

<style scoped>
.company-card { transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease; }
.company-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(0,0,0,0.15) !important; }
.flex-1 { flex: 1; }
</style>