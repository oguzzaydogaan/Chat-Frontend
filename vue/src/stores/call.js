import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocketStore } from './socket'
import { RequestEventType } from '@/assets/js/enums'

export const useCallStore = defineStore('call', () => {
  const router = useRouter()
  const userId = Number(localStorage.getItem('userId'))
  const userName = localStorage.getItem('name')
  const otherUser = ref({ id: null, name: null })
  const socketStore = useSocketStore()
  let pc = null
  let localStream = null
  let callData = null
  let iceQueue = []
  const remoteAudio = new Audio()
  const isIncomingCall = ref(false)
  const isInCall = ref(false)
  const isCalling = ref(false)

  async function flushIceQueue() {
    for (const c of iceQueue) await pc.addIceCandidate(c)
    iceQueue = []
  }

  function createPeerConnection(targetId) {
    if (pc) return pc

    pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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

  async function startCall(targetId, targetName) {
    otherUser.value = { id: String(targetId), name: targetName }
    pc = createPeerConnection(otherUser.value.id)

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
          TargetUserId: otherUser.value.id,
          Sdp: offer.sdp,
        },
      },
      Sender: { Id: userId, Name: userName },
    })
    isCalling.value = true
    router.push({
      name: 'call',
    })
  }

  async function stopCall() {
    if (pc) {
      pc.close()
      pc = null
    }
    isInCall.value = false
    isCalling.value = false
    isIncomingCall.value = false
    callData = null
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
          TargetUserId: otherUser.value.id,
        },
      },
      Sender: { Id: userId, Name: userName },
    })
    otherUser.value = { id: null, name: null }
    if (router.currentRoute.value.name === 'call') {
      router.push({ name: 'chats' })
    }
  }

  async function cancelCall() {
    await stopCall()
    socketStore.sendMessage({
      Type: RequestEventType.Call_Reject,
      Payload: {
        Call: {
          SourceUserId: String(userId),
          TargetUserId: otherUser.value.id,
        },
      },
      Sender: { Id: userId, Name: userName },
    })
    otherUser.value = { id: null, name: null }
    if (router.currentRoute.value.name === 'call') {
      router.push({ name: 'chats' })
    }
  }

  async function onCallOffer(event) {
    callData = event.detail.Payload.Call
    otherUser.value = { id: callData.SourceUserId, name: event.detail.Sender.Name }
    isIncomingCall.value = true
  }

  async function sendAnswer(accept) {
    if (accept) {
      pc = createPeerConnection(otherUser.value.id)

      if (!localStream) localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream))

      await pc.setRemoteDescription({ type: 'offer', sdp: callData.Sdp })
      await flushIceQueue()

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socketStore.sendMessage({
        Type: RequestEventType.Call_Accept,
        Payload: {
          Call: {
            Type: 'answer',
            SourceUserId: String(userId),
            TargetUserId: otherUser.value.id,
            Sdp: answer.sdp,
          },
        },
        Sender: { Id: userId, Name: userName },
      })

      isInCall.value = true
      router.push({ name: 'call' })
    } else {
      socketStore.sendMessage({
        Type: RequestEventType.Call_Reject,
        Payload: {
          Call: {
            SourceUserId: String(userId),
            TargetUserId: otherUser.value.id,
          },
        },
        Sender: { Id: userId, Name: userName },
      })
      callData = null
      otherUser.value = { id: null, name: null }
    }

    isIncomingCall.value = false
  }

  async function onCallAccept(event) {
    callData = event.detail.Payload.Call
    isInCall.value = true
    isCalling.value = false
    await pc.setRemoteDescription({ type: 'answer', sdp: callData.Sdp })
    await flushIceQueue()
  }

  async function onCallReject() {
    await stopCall()
    otherUser.value = { id: null, name: null }
    if (router.currentRoute.value.name === 'call') {
      router.push({ name: 'chats' })
    }
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

  window.addEventListener('call-offer', onCallOffer)
  window.addEventListener('call-accept', onCallAccept)
  window.addEventListener('call-reject', onCallReject)
  window.addEventListener('call-ice', onCallIce)

  return {
    startCall,
    stopCall,
    endCall,
    cancelCall,
    sendAnswer,
    isIncomingCall,
    isInCall,
    isCalling,
    otherUser,
  }
})
