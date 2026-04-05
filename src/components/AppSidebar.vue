<template>
  <v-navigation-drawer
    v-model="drawer"
    class="bg-primary"
    expand-on-hover
    permanent
    :rail="rail"
    :rail-width="75"
  >
    <template #prepend>
      <v-list-item class="px-4" prepend-icon="mdi-fruit-watermelon" subtitle="Хакатон v1" title="АРБУЗ ERP" />
      <v-divider />
    </template>

    <v-list class="bg-primary " density="compact" nav>
      <v-list-item
        v-for="item in menuItems"
        :key="item.route"
        active-class="bg-primary-lighten-5"
        class="bg-primary"
        :prepend-icon="item.icon"
        rounded="lg"
        :title="item.title"
        @click="router.push(item.route)"
      />
    </v-list>

    <template #append>
      <v-divider />
      <v-list-item class="bg-primary" :prepend-icon="rail ?'mdi-chevron-right' :'mdi-chevron-left' " :title="rail ? 'Развернуть' : 'Свернуть'" @click="rail = !rail" />
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
    { title: 'Статистика', route: '/', icon: 'mdi-view-dashboard' },
    { title: 'Учебные группы', route: '/groups', icon: 'mdi-account-multiple-check' },
    { title: 'Сотрудники', route: '/participants', icon: 'mdi-account-group' },
    { title: 'Курсы обучения', route: '/courses', icon: 'mdi-book-open-page-variant' },
    { title: 'Спецификации', route: '/specifications', icon: 'mdi-file-document-edit' },
    { title: 'Компании', route: '/companies', icon: 'mdi-office-building-marker' },
  ]
</script>

<style scoped>
:deep(.v-list-item-title){
  font-size: 18px;
  height: 20px;
  display: contents;
}

:deep(.v-list-item__content){
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
  height: auto;
}

:deep(.v-list-item__prepend){
  align-self: center;
  display: flex;
  grid-area: prepend;
  flex-direction: column;
  font-size: 18px;
}

:deep(.v-navigation-drawer__prepend){
  height: 80px;
  display: inline-grid;
  align-items: end;
}

:deep(.v-list-item){
  margin: 5px;
}

:deep(.v-list){
    gap: 10px;
    display: grid;
}

</style>
