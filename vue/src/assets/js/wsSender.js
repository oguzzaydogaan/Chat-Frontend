import Swal from 'sweetalert2'
import axios from '@/plugins/axios'

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
    const users = await axios.get('/users')
    const { value: selectedUsers } = await Swal.fire({
      title: 'Select users to create a chat with',
      html: `
      <div class="flex flex-col">
        ${users.data.map((user) => `<div><input type="checkbox" id="cb-${user.id}" value="${user.id}" class="mr-2"/><label class="text-gray-500" for="cb-${user.id}">${user.name}</label></div>`).join('')}
      </div>
    `,
      confirmButtonText: 'OK',
      preConfirm: () => {
        const selected = Array.from(
          document.querySelectorAll('input[type="checkbox"]:checked'),
        ).map((checkbox) => Number(checkbox.value))
        return selected
      },
    })
    if (selectedUsers.length > 1) {
      socketMessage.Payload.UserIds = selectedUsers
      this.addChat(socketMessage)
    } else {
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
        icon: 'error',
        title: 'You must select at least two users to create a chat',
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
    }
  }
}
