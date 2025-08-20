<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { RequestEventType } from '@/assets/js/enums'
import { useSocketStore } from '@/stores/socket'
import axios from '@/plugins/axios'
import Combobox from '@/components/Combobox.vue'

const userId = Number(localStorage.getItem('userId'))
const userName = localStorage.getItem('name')
const socketStore = useSocketStore()
const comboboxOptions = ref([])
const comboboxSelected = ref()

let pc = null
let localStream = null
let callData = null
let iceQueue = []
const remoteAudio = new Audio()
const isIncomingCall = ref(false)
const isInCall = ref(false)
const isCalling = ref(false)

async function getComboboxOptions() {
  const allUsers = await axios.get('/users/verifieds')
  comboboxOptions.value = allUsers.data
    .filter((u) => u.id != userId)
    .map((u) => ({ id: u.id, name: u.name }))
  comboboxSelected.value = null
}

async function flushIceQueue() {
  for (const c of iceQueue) await pc.addIceCandidate(c)
  iceQueue = []
}

function createPeerConnection(targetId) {
  if (pc) return pc

  pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // { urls: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' }
    ],
  })

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socketStore.sendMessage({
        Type: RequestEventType.Call_Ice,
        Payload: {
          Call: {
            Type: 'candidate',
            Candidate: event.candidate.candidate,
            SdpMid: event.candidate.sdpMid,
            SdpMLineIndex: event.candidate.sdpMLineIndex,
            SourceUserId: String(userId),
            TargetUserId: targetId,
          },
        },
        Sender: { Id: userId, Name: userName },
      })
    }
  }

  pc.ontrack = (event) => {
    remoteAudio.srcObject = event.streams[0]
    remoteAudio.play()
  }

  return pc
}

async function startCall() {
  const targetId = comboboxSelected.value.id
  pc = createPeerConnection(String(targetId))

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  }
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  socketStore.sendMessage({
    Type: RequestEventType.Call_Offer,
    Payload: {
      Call: {
        Type: 'offer',
        SourceUserId: String(userId),
        TargetUserId: String(targetId),
        Sdp: offer.sdp,
      },
    },
    Sender: { Id: userId, Name: userName },
  })
  isCalling.value = true
}

async function stopCall() {
  if (pc) {
    pc.close()
    pc = null
  }
  isInCall.value = false
  isCalling.value = false
  isIncomingCall.value = false
  iceQueue = []
  remoteAudio.pause()
  remoteAudio.srcObject = null
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop())
    localStream = null
  }
}

async function endCall() {
  await stopCall()
  socketStore.sendMessage({
    Type: RequestEventType.Call_Reject,
    Payload: {
      Call: {
        SourceUserId: String(userId),
        TargetUserId: String(callData.Payload.Call.SourceUserId),
      },
    },
    Sender: { Id: userId, Name: userName },
  })
  callData = null
}

async function cancelCall() {
  await stopCall()
  socketStore.sendMessage({
    Type: RequestEventType.Call_Reject,
    Payload: {
      Call: {
        SourceUserId: String(userId),
        TargetUserId: String(comboboxSelected.value.id),
      },
    },
    Sender: { Id: userId, Name: userName },
  })
}

async function onCallOffer(event) {
  callData = event.detail
  isIncomingCall.value = true
}

async function sendAnswer(accept) {
  if (accept) {
    const targetId = callData.Payload.Call.SourceUserId
    pc = createPeerConnection(targetId)

    if (!localStream) localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream))

    await pc.setRemoteDescription({ type: 'offer', sdp: callData.Payload.Call.Sdp })
    await flushIceQueue()

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socketStore.sendMessage({
      Type: RequestEventType.Call_Accept,
      Payload: {
        Call: {
          Type: 'answer',
          SourceUserId: String(userId),
          TargetUserId: targetId,
          Sdp: answer.sdp,
        },
      },
      Sender: { Id: userId, Name: userName },
    })

    isInCall.value = true
  } else {
    // Reject
    socketStore.sendMessage({
      Type: RequestEventType.Call_Reject,
      Payload: {
        Call: {
          SourceUserId: String(userId),
          TargetUserId: callData.Payload.Call.SourceUserId,
        },
      },
      Sender: { Id: userId, Name: userName },
    })
    callData = null
  }

  isIncomingCall.value = false
}

async function onCallAccept(event) {
  callData = event.detail
  isInCall.value = true
  isCalling.value = false
  await pc.setRemoteDescription({ type: 'answer', sdp: callData.Payload.Call.Sdp })
  await flushIceQueue()
}

async function onCallReject() {
  await stopCall()
  callData = null
}

async function onCallIce(event) {
  const data = event.detail.Payload.Call
  const candidate = {
    candidate: data.Candidate,
    sdpMid: data.SdpMid,
    sdpMLineIndex: data.SdpMLineIndex,
  }

  if (pc && pc.remoteDescription) {
    await pc.addIceCandidate(candidate)
  } else {
    iceQueue.push(candidate)
  }
}

onMounted(async () => {
  socketStore.connect()
  await getComboboxOptions()
  window.addEventListener('call-offer', onCallOffer)
  window.addEventListener('call-accept', onCallAccept)
  window.addEventListener('call-reject', onCallReject)
  window.addEventListener('call-ice', onCallIce)
})

onUnmounted(() => {
  window.removeEventListener('call-offer', onCallOffer)
  window.removeEventListener('call-accept', onCallAccept)
  window.removeEventListener('call-reject', onCallReject)
  window.removeEventListener('call-ice', onCallIce)
})
</script>

<template>
  <main class="min-h-dvh dark:bg-gray-900 dark:text-white">
    <div v-if="!isIncomingCall" class="flex flex-col justify-center items-center p-4 gap-2">
      <Combobox
        v-if="!isInCall && !isCalling"
        v-model="comboboxSelected"
        :is-multiple="false"
        :data="comboboxOptions"
      />

      <p v-if="isInCall" class="text-black dark:text-white">
        Call started with {{ callData.Sender.Name }}
      </p>
      <button
        v-if="!isCalling"
        @click="isInCall ? endCall() : startCall()"
        class="p-2 rounded-md disabled:opacity-50 text-white"
        :class="isInCall ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'"
        :disabled="!comboboxSelected && !isInCall"
      >
        {{ isInCall ? 'End Call' : 'Start Call' }}
      </button>

      <p v-if="isCalling">Calling {{ comboboxSelected.name }}</p>
      <button
        v-if="isCalling"
        @click="cancelCall()"
        class="p-2 rounded-md disabled:opacity-50 text-white bg-red-500 hover:bg-red-600"
      >
        Cancel Call
      </button>
    </div>
    <div v-else class="flex flex-col items-center justify-center gap-2 p-4">
      <p class="text-black dark:text-white">Incoming call from {{ callData.Sender.Name }}</p>
      <div class="flex gap-4 justify-center items-center">
        <button
          @click="sendAnswer(false)"
          class="p-2 rounded-md bg-red-500 hover:bg-red-600 text-white"
        >
          Reject
        </button>
        <button
          @click="sendAnswer(true)"
          class="p-2 rounded-md bg-green-500 hover:bg-green-600 text-white"
        >
          Accept
        </button>
      </div>
    </div>
  </main>
</template>
