import Swal from 'sweetalert2'

export default async function wsSender(socketMessage) {
  if (socketMessage.Type == 'Delete-Message') {
    await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.socket.sendMessage(socketMessage)
      }
    })
  } else if (socketMessage.Type == 'Send-Message') {
    this.socket.sendMessage(socketMessage)
    this.newMessage = ''
  } else if (socketMessage.Type == 'New-Chat') {
    const { value: id } = await Swal.fire({
      title: 'Add a chat',
      input: 'text',
      showCancelButton: true,
      showConfirmButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!'
        }
      },
    })
    if (id) {
      let list = id.split(',').map(Number)
      socketMessage.Payload.UserIds = list
      this.addChat(socketMessage)
    }
  } else if (socketMessage.Type == 'New-UserToChat') {
    const { value: id } = await Swal.fire({
      title: 'Add a user',
      input: 'text',
      showCancelButton: true,
      showConfirmButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!'
        }
      },
    })
    if (id) {
      socketMessage.Payload.UserId = Number(id)
      this.addUserToChat(socketMessage)
    }
  }
}
