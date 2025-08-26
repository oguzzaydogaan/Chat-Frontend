<script setup lang="ts">
import { RouterView } from 'vue-router'
import IncomingCall from './components/IncomingCall.vue'
import Calling from './components/Calling.vue'
import InCall from './components/InCall.vue'
import InCallMini from './components/InCallMini.vue'
import { useCallStore } from './stores/call'
const callStore = useCallStore()
</script>

<template>
  <IncomingCall v-if="callStore.isIncomingCall" />
  <Calling v-if="callStore.isCalling" />
  <InCall v-if="callStore.isInCall && callStore.showCallUI" />
  <InCallMini v-if="callStore.isInCall && !callStore.showCallUI" />
  <RouterView />
</template>
