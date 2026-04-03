<template>
  <v-navigation-drawer v-model="drawer" :rail="rail" permanent expand-on-hover class="bg-surface-light">
    <template v-slot:prepend>
      <v-list-item prepend-icon="mdi-graduation-cap" title="Global ERP Learning" subtitle="Хакатон v2" class="px-4"></v-list-item>
      <v-divider></v-divider>
    </template>

    <v-list density="compact" nav>
      <v-list-item
        v-for="item in menuItems"
        :key="item.route"
        :prepend-icon="item.icon"
        :title="item.title"
        :to="item.route"
        active-class="bg-primary-lighten-5"
        rounded="lg"
        class="my-1"
      />
    </v-list>

    <template v-slot:append>
      <v-divider></v-divider>
      <v-list-item prepend-icon="mdi-chevron-left" :title="rail ? '' : 'Свернуть'" @click="rail = !rail" class="ma-2" />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const drawer = ref(true)
  const rail = ref(false)

  interface MenuItem { title: string; route: string; icon: string }
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
