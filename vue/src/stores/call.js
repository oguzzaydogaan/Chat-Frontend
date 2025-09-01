import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocketStore } from './socket'
import { RequestEventType } from '@/assets/js/enums'
import * as livekit from 'livekit-client'

export const useCallStore = defineStore('call', () => {
  const socketStore = useSocketStore()
  let userId = null
  let userName = null
  const otherUsers = ref([])
  let room = null
  let localAudioTrack = null
  let pubTrack = null
  const microphones = ref([])
  const speakers = ref([])
  let call = null
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

  async function startCall(callees) {
    userId = Number(localStorage.getItem('userId'))
    userName = localStorage.getItem('name')
    otherUsers.value = callees

    const message = {
      Type: RequestEventType.Call_Offer,
      Payload: {
        CreateCall: {
          CallerId: userId,
          CalleesIds: callees.map((u) => u.Id),
          CallTime: new Date(),
        },
      },
      Sender: { Id: userId, Name: userName },
      Recievers: otherUsers.value.map((u) => u.Id),
    }
    socketStore.sendMessage(message)
    isCalling.value = true
  }

  async function stopCall() {
    if (room) {
      await room.disconnect()
      room = null
    }

    isInCall.value = false
    isCalling.value = false
    isIncomingCall.value = false
    showCallUI.value = true
    isMute.value = false
    remoteAudio.pause()
    remoteAudio.srcObject = null
    localAudioTrack = null
  }

  async function endCall() {
    await stopCall()
  }

  async function cancelCall() {
    await stopCall()
    socketStore.sendMessage({
      Type: RequestEventType.Call_Cancel,
      Payload: { Call: { Id: call.Id } },
      Sender: { Id: userId, Name: userName },
      Recievers: otherUsers.value.map((u) => u.Id),
    })
  }

  async function onCallOffer(event) {
    userId = Number(localStorage.getItem('userId'))
    userName = localStorage.getItem('name')
    call = event.detail.Payload.Call
    if (event.detail.Sender.Id != userId) {
      otherUsers.value = event.detail.Payload.Call.Callees.filter((u) => u.Id != userId)
      otherUsers.value.push(event.detail.Sender)
      isIncomingCall.value = true
    } else {
      if (!room) {
        room = new livekit.Room()
        await room.connect('ws://localhost:7880', call.SFUToken)

        room.on(livekit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'audio') {
            track.attach(remoteAudio)
            remoteAudio.play()
          }
        })

        const tracks = await livekit.createLocalTracks({ audio: true, video: false })
        localAudioTrack = tracks[0]
        pubTrack = await room.localParticipant.publishTrack(localAudioTrack)

        microphones.value = await getConnectedDevices('audioinput')
        speakers.value = await getConnectedDevices('audiooutput')
      }
    }
  }

  async function sendAnswer(accept) {
    let timer = null
    if (accept) {
      const message = {
        Type: RequestEventType.Call_Accept,
        Payload: {
          Call: call,
        },
        Sender: { Id: userId, Name: userName },
        Recievers: otherUsers.value.map((u) => u.Id),
      }
      socketStore.sendMessage(message)
    } else {
      socketStore.sendMessage({
        Type: RequestEventType.Call_Reject,
        Payload: { Call: { CallId: call.Id } },
        Sender: { Id: userId, Name: userName },
        Recievers: otherUsers.value.map((u) => u.Id),
      })
    }

    isIncomingCall.value = false
  }

  async function onCallAccept(event) {
    if (event.detail.Payload.Call.Id == call.Id) {
      if (event.detail.Sender.Id == userId) {
        isInCall.value = true
        let timer = startTimer()
        call = event.detail.Payload.Call
        room = new livekit.Room()
        await room.connect('ws://localhost:7880', call.SFUToken)

        room.on(livekit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'audio') {
            track.attach(remoteAudio)
            remoteAudio.play()
          }
        })

        const tracks = await livekit.createLocalTracks({ audio: true, video: false })
        localAudioTrack = tracks[0]
        pubTrack = await room.localParticipant.publishTrack(localAudioTrack)

        microphones.value = await getConnectedDevices('audioinput')
        speakers.value = await getConnectedDevices('audiooutput')
      } else if (isInCall.value == true) {
      } else if (event.detail.Payload.Call.Caller.Id == userId) {
        inCallUsers.value.push(event.detail.Payload.Call.Caller)
        isInCall.value = true
        isCalling.value = false
        let timer = startTimer()
      }
    }
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

  function changeShowCallUI() {
    showCallUI.value = !showCallUI.value
  }

  async function toggleMic() {
    if (!room || !localAudioTrack) return
    console.log(pubTrack)
    if (isMute.value) {
      pubTrack.unmute()
    } else {
      pubTrack.mute()
    }
    isMute.value = !isMute.value
  }

  async function setMicrophone(deviceId) {
    if (!room) return
    await room.switchActiveDevice('audioinput', deviceId)
  }

  async function setOutput(deviceId) {
    remoteAudio.setSinkId(deviceId)
  }

  window.addEventListener('call-offer', onCallOffer)
  window.addEventListener('call-accept', onCallAccept)
  window.addEventListener('call-cancel', async () => await stopCall())

  return {
    startCall,
    stopCall,
    endCall,
    cancelCall,
    sendAnswer,
    changeShowCallUI,
    toggleMic,
    setMicrophone,
    setOutput,
    microphones,
    speakers,
    isIncomingCall,
    isInCall,
    isCalling,
    showCallUI,
    otherUsers,
    callHours,
    callMinutes,
    callSeconds,
    isMute,
  }
})
