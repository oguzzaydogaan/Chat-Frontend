import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocketStore } from './socket'
import { RequestEventType } from '@/assets/js/enums'
import { Room, RoomEvent, createLocalTracks } from 'livekit-client'
import { KrispNoiseFilter } from '@livekit/krisp-noise-filter'

export const useCallStore = defineStore('call', () => {
  const socketStore = useSocketStore()
  let userId = null
  let userName = null
  const otherUsers = ref([])
  let room = null
  const participants = ref(new Map())
  let localAudioTrack = null
  let pubTrack = null
  const microphones = ref([])
  const speakers = ref([])
  let call = null
  const callName = ref('')
  const isIncomingCall = ref(false)
  const isInCall = ref(false)
  const isCalling = ref(false)
  const showCallUI = ref(true)
  const callHours = ref(0)
  const callMinutes = ref(0)
  const callSeconds = ref(0)
  const isMute = ref(false)

  async function getConnectedDevices(type) {
    let devices = await Room.getLocalDevices(type)
    return devices.filter((d) => d.deviceId !== 'default' && d.deviceId !== 'communications')
  }

  async function startCall(callees, id) {
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
          ChatId: id,
        },
      },
      Sender: { Id: userId, Name: userName },
      Receivers: otherUsers.value.map((u) => u.Id),
    }
    socketStore.sendMessage(message)
    isCalling.value = true
  }

  async function onSFUTokenReceived(event) {
    let tempId = null
    if (!room) {
      if (!call) {
        call = event.detail.Call
        tempId = call.Id
        callName.value =
          otherUsers.value.length > 1
            ? call.Chat.Name
            : call.Chat.Name.split(',')[0] == localStorage.getItem('name')
              ? call.Chat.Name.split(',')[1]
              : call.Chat.Name.split(',')[0]
      }
      room = new Room()
      await room.connect(import.meta.env.VITE_LIVEKIT_URL, event.detail.Token)

      if (isIncomingCall.value) {
        isIncomingCall.value = false
        isInCall.value = true
        let timer = startTimer()
      } else if (isCalling.value && room.remoteParticipants.size > 0) {
        isCalling.value = false
        isInCall.value = true
        startTimer()
      }

      room.on(RoomEvent.Connected, () => {
        const joined = new Audio('/sounds/joined.mp3')
        joined.play()
      })
      room.on(RoomEvent.Disconnected, () => {
        const dc = new Audio('/sounds/disconnect.mp3')
        dc.play()
      })

      room.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            const audioEl = new Audio()
            audioEl.autoplay = true
            audioEl.controls = false
            publication.track.attach(audioEl)
            participant._audioEl = audioEl
          }
        })
        participants.value.set(participant.identity, participant)
      })

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        if (isCalling.value) {
          isCalling.value = false
          isInCall.value = true
          let timer = startTimer()
        }
        participants.value.set(participant.identity, participant)
        const joined = new Audio('/sounds/joined.mp3')
        joined.play()
      })
      room.on(RoomEvent.ParticipantDisconnected, async (participant) => {
        if (participants.value.get(participant.identity)) {
          participants.value.delete(participant.identity)
        }
        if (otherUsers.value.length == 1) {
          await resetAll()
        }
        const dc = new Audio('/sounds/left.mp3')
        dc.play()
      })

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === 'audio') {
          const audioEl = new Audio()
          audioEl.autoplay = true
          audioEl.controls = false
          track.attach(audioEl)
          participant._audioEl = audioEl
        }
        participants.value.set(participant.identity, participant)
      })
      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (participant._audioEl) {
          track.detach(participant._audioEl)
          participant._audioEl.remove()
          delete participant._audioEl
          participants.value.set(participant.identity, participant)
        }
      })

      const tracks = await createLocalTracks({
        audio: true,
      })
      localAudioTrack = tracks[0]
      pubTrack = await room.localParticipant.publishTrack(localAudioTrack)
      pubTrack.track.setProcessor(KrispNoiseFilter())
      microphones.value = await getConnectedDevices('audioinput')
      speakers.value = await getConnectedDevices('audiooutput')
      await new Promise((resolve) => setTimeout(resolve, 20000))
      if (call && tempId == call.Id) {
        if (isCalling.value) {
          await cancelCall()
        }
      }
    }
  }

  async function resetAll() {
    if (room) {
      await room.disconnect()
      room = null
    }
    call = null
    isCalling.value = false
    isIncomingCall.value = false
    showCallUI.value = true
    isMute.value = false
    localAudioTrack = null
    pubTrack = null
    participants.value.clear()
    isInCall.value = false
  }
  async function endCall() {
    socketStore.sendMessage({
      Type: RequestEventType.Call_End,
      Payload: { Call: call },
      Sender: { Id: userId, Name: userName },
      Receivers: otherUsers.value.map((u) => u.Id),
    })
    await resetAll()
  }
  async function cancelCall() {
    socketStore.sendMessage({
      Type: RequestEventType.Call_Cancel,
      Payload: { Call: call },
      Sender: { Id: userId, Name: userName },
      Receivers: otherUsers.value.map((u) => u.Id),
    })
    await resetAll()
  }

  async function onCallOffer(event) {
    if (!call) {
      userId = Number(localStorage.getItem('userId'))
      userName = localStorage.getItem('name')
      call = event.detail.Payload.Call
      let tempId = call.Id
      callName.value =
        call.Callees.length > 1
          ? call.Chat.Name
          : call.Chat.Name.split(',')[0] == localStorage.getItem('name')
            ? call.Chat.Name.split(',')[1]
            : call.Chat.Name.split(',')[0]
      otherUsers.value = event.detail.Payload.Call.Callees.filter((u) => u.Id != userId)
      otherUsers.value.push(event.detail.Sender)
      isIncomingCall.value = true
      await new Promise((resolve) => setTimeout(resolve, 25000))
      if (call && tempId == call.Id) {
        if (isIncomingCall.value) {
          resetAll()
        }
      }
    } else {
      //busy
    }
  }
  async function sendAnswer(accept) {
    if (accept) {
      socketStore.sendMessage({
        Type: RequestEventType.Call_Accept,
        Payload: { Call: call },
        Sender: { Id: userId, Name: userName },
        Receivers: otherUsers.value.map((u) => u.Id),
      })
    } else {
      socketStore.sendMessage({
        Type: RequestEventType.Call_Reject,
        Payload: { Call: call },
        Sender: { Id: userId, Name: userName },
        Receivers: otherUsers.value.map((u) => u.Id),
      })
      await resetAll()
    }
  }

  async function onCallReject(event) {
    if (call) {
      if (event.detail.Payload.Call.Id == call.Id) {
        if (isCalling.value && otherUsers.value.length == 1) {
          await resetAll()
        }
      }
    }
  }
  async function onCallCancel(event) {
    if (call) {
      if (event.detail.Payload.Call.Id == call.Id) {
        await resetAll()
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
    if (isMute.value) {
      pubTrack.unmute()
      const unmute = new Audio('/sounds/unmute.mp3')
      unmute.play()
    } else {
      pubTrack.mute()
      const mute = new Audio('/sounds/mute.mp3')
      mute.play()
    }
    isMute.value = !isMute.value
  }
  async function setMicrophone(deviceId) {
    if (!room) return
    await room.switchActiveDevice('audioinput', deviceId)
  }
  async function setOutput(deviceId) {
    await room.switchActiveDevice('audiooutput', deviceId)
    const outputChanged = new Audio('/sounds/select-output.mp3')
    outputChanged.play()
  }

  window.addEventListener('call-offer', onCallOffer)
  window.addEventListener('call-sfutoken-received', onSFUTokenReceived)
  window.addEventListener('call-cancel', onCallCancel)
  window.addEventListener('call-reject', onCallReject)

  return {
    startCall,
    resetAll,
    endCall,
    cancelCall,
    sendAnswer,
    changeShowCallUI,
    toggleMic,
    setMicrophone,
    setOutput,
    participants,
    microphones,
    speakers,
    isIncomingCall,
    isInCall,
    isCalling,
    showCallUI,
    otherUsers,
    callName,
    callHours,
    callMinutes,
    callSeconds,
    isMute,
  }
})
