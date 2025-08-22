<script setup lang="ts">
import { RouterView } from 'vue-router'
import IncomingCall from './components/IncomingCall.vue'
import Calling from './components/Calling.vue'
import InCall from './components/InCall.vue'
</script>

<template>
  <IncomingCall />
  <Calling />
  <InCall />
  <RouterView />
</template>
