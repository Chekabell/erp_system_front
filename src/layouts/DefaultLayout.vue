<template>
  <v-app>
    <AppSidebar />
    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-4 pa-md-8">
        <transition name="fade" mode="out-in">
          <router-view v-slot="{ Component }">
            <component :is="Component" />
          </router-view>
        </transition>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">

  import AppSidebar from '@/components/layout/AppSidebar.vue'

</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
