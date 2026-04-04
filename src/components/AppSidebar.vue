<template>
  <v-navigation-drawer
    v-model="drawer"
    class="bg-primary"
    expand-on-hover
    permanent
    :rail="rail"
  >
    <template #prepend>
      <v-list-item class="px-4" prepend-icon="mdi-graduation-cap" subtitle="Хакатон v2" title="Global ERP Learning" />
      <v-divider />
    </template>

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in menuItems"
        :key="item.route"
        active-class="bg-primary-lighten-5"
        class="my-1"
        :prepend-icon="item.icon"
        rounded="lg"
        :title="item.title"
        @click="router.push(item.route)"
      />
    </v-list>

    <template #append>
      <v-divider />
      <v-list-item class="ma-2" prepend-icon="mdi-chevron-left" :title="rail ? '' : 'Свернуть'" @click="rail = !rail" />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import router from '@/router'

  const drawer = ref(true)
  const rail = ref(false)

  interface MenuItem { title: string, route: string, icon: string }
  const menuItems: MenuItem[] = [
    { title: 'Главная', route: '/', icon: 'mdi-view-dashboard' },
    { title: 'Курсы обучения', route: '/courses', icon: 'mdi-book-open-page-variant' },
    { title: 'Участники', route: '/participants', icon: 'mdi-account-group' },
    { title: 'Учебные группы', route: '/groups', icon: 'mdi-account-multiple-check' },
    { title: 'Спецификации', route: '/specifications', icon: 'mdi-file-document-edit' },
    { title: 'Компании', route: '/companies', icon: 'mdi-office-building-marker' },
    { title: 'Диаграмма Ганта', route: '/gantt', icon: 'mdi-calendar-month' },
    { title: 'XML Интеграция', route: '/integration', icon: 'mdi-cloud-sync-outline' },
  ]
</script>
