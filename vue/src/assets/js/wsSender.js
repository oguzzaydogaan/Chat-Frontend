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
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer
            toast.onmouseleave = Swal.resumeTimer
          },
        })
        Toast.fire({
          icon: 'success',
          title: 'Message deleted successfully',
        })
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
      let list = []
      list = id.split(',').map(Number)
      socketMessage.Payload.UserIds = list
      this.addChat(socketMessage)
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer
          toast.onmouseleave = Swal.resumeTimer
        },
      })
      Toast.fire({
        icon: 'success',
        title: 'Chat created successfully',
      })
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
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer
          toast.onmouseleave = Swal.resumeTimer
        },
      })
      Toast.fire({
        icon: 'success',
        title: 'User added successfully',
      })
    }
  }
}
