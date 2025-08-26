import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocketStore } from './socket'
import { RequestEventType } from '@/assets/js/enums'

export const useCallStore = defineStore('call', () => {
  const socketStore = useSocketStore()
  let userId = null
  let userName = null
  const otherUser = ref({ id: null, name: null })
  let pc = null
  let localStream = null
  const microphones = ref([])
  let callData = null
  let iceQueue = []
  const remoteAudio = new Audio()
  const isIncomingCall = ref(false)
  const isInCall = ref(false)
  const isCalling = ref(false)
  const showCallUI = ref(true)
  const callHours = ref(0)
  const callMinutes = ref(0)
  const callSeconds = ref(0)
  const isMute = ref(false)

  async function getConnectedDevices(type) {
    let devices = await navigator.mediaDevices.enumerateDevices()
    devices = devices.filter((device) => device.kind === type)
    return devices.filter((d) => d.deviceId !== 'default' && d.deviceId !== 'communications')
  }

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
            },
          },
          Sender: { Id: userId, Name: userName },
          Recievers: [targetId],
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
    userId = Number(localStorage.getItem('userId'))
    userName = localStorage.getItem('name')
    otherUser.value = { id: targetId, name: targetName }
    pc = createPeerConnection(otherUser.value.id)

    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    }
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))

    microphones.value = await getConnectedDevices('audioinput')

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    const message = {
      Type: RequestEventType.Call_Offer,
      Payload: {
        Call: {
          Type: 'offer',
          Sdp: offer.sdp,
        },
      },
      Sender: { Id: userId, Name: userName },
      Recievers: [otherUser.value.id, userId],
    }
    socketStore.sendMessage(message)
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
    showCallUI.value = true
    isMute.value = false
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
      Type: RequestEventType.Call_End,
      Payload: { Call: { CallId: callData.CallId } },
      Sender: { Id: userId, Name: userName },
      Recievers: [otherUser.value.id],
    })
  }

  async function cancelCall() {
    await stopCall()
    socketStore.sendMessage({
      Type: RequestEventType.Call_Cancel,
      Payload: { Call: { CallId: callData.CallId } },
      Sender: { Id: userId, Name: userName },
      Recievers: [otherUser.value.id],
    })
  }

  async function onCallOffer(event) {
    userId = Number(localStorage.getItem('userId'))
    userName = localStorage.getItem('name')
    callData = event.detail.Payload.Call
    if (event.detail.Sender.Id != userId) {
      otherUser.value = { id: event.detail.Sender.Id, name: event.detail.Sender.Name }
      isIncomingCall.value = true
    }
  }

  async function sendAnswer(accept) {
    let timer = null
    if (accept) {
      pc = createPeerConnection(otherUser.value.id)

      if (!localStream) localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream))

      microphones.value = await getConnectedDevices('audioinput')

      await pc.setRemoteDescription({ type: 'offer', sdp: callData.Sdp })
      await flushIceQueue()

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      const message = {
        Type: RequestEventType.Call_Accept,
        Payload: {
          Call: {
            Type: 'answer',
            Sdp: answer.sdp,
            CallId: callData.CallId,
          },
        },
        Sender: { Id: userId, Name: userName },
        Recievers: [otherUser.value.id],
      }
      socketStore.sendMessage(message)

      isInCall.value = true
      timer = startTimer()
    } else {
      socketStore.sendMessage({
        Type: RequestEventType.Call_Reject,
        Payload: { Call: { CallId: callData.CallId } },
        Sender: { Id: userId, Name: userName },
        Recievers: [otherUser.value.id],
      })
    }

    isIncomingCall.value = false
  }

  async function onCallAccept(event) {
    callData = event.detail.Payload.Call
    isInCall.value = true
    isCalling.value = false
    await pc.setRemoteDescription({ type: 'answer', sdp: callData.Sdp })
    await flushIceQueue()
    let timer = startTimer()
  }

  async function startTimer() {
    callMinutes.value = 0
    callSeconds.value = 0
    while (isInCall.value) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      callSeconds.value += 1
      if (callSeconds.value == 60) {
        callMinutes.value += 1
        callSeconds.value = 0
      }
      if (callMinutes.value == 60) {
        callHours.value += 1
        callMinutes.value = 0
      }
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

  function changeShowCallUI() {
    showCallUI.value = !showCallUI.value
  }

  async function toggleMic() {
    let audioTrack = localStream.getTracks().find((track) => track.kind === 'audio')
    if (audioTrack.enabled) {
      audioTrack.enabled = false
      isMute.value = true
    } else {
      audioTrack.enabled = true
      isMute.value = false
    }
  }

  async function setMicrophone(deviceId) {
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
      video: false,
    })
    const newTrack = newStream.getAudioTracks()[0]

    if (!pc) return
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio')

    if (sender) {
      await sender.replaceTrack(newTrack)
    } else {
      pc.addTrack(newTrack, newStream)
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    debugger
    localStream = newStream
    if (isMute.value == true) {
      let audioTrack = localStream.getTracks().find((track) => track.kind === 'audio')
      audioTrack.enabled = false
    }
  }

  window.addEventListener('call-offer', onCallOffer)
  window.addEventListener('call-accept', onCallAccept)
  window.addEventListener('call-cancel', stopCall)
  window.addEventListener('call-reject', stopCall)
  window.addEventListener('call-end', stopCall)
  window.addEventListener('call-ice', onCallIce)

  return {
    startCall,
    stopCall,
    endCall,
    cancelCall,
    sendAnswer,
    changeShowCallUI,
    toggleMic,
    setMicrophone,
    microphones,
    isIncomingCall,
    isInCall,
    isCalling,
    showCallUI,
    otherUser,
    callHours,
    callMinutes,
    callSeconds,
    isMute,
  }
})
