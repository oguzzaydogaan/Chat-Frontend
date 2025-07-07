import Swal from 'sweetalert2'

export default function addChat() {
  Swal.fire({
    title: 'Add a user to chat',
    input: 'text',
    showCancelButton: true,
    showConfirmButton: true,
  })
}
