import Swal from 'sweetalert2'
async function errorAlert(message) {
  await Swal.fire({
    icon: 'error',
    text: message,
    timer: 2000,
    showConfirmButton: false,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFF',
  })
}
async function successAlert(message) {
  await Swal.fire({
    icon: 'success',
    text: message,
    timer: 2000,
    showConfirmButton: false,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFF',
  })
}
async function errorToast(message) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFF',
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  })
  await Toast.fire({
    icon: 'error',
    text: message,
  })
}
async function successToast(message, position = null, time = null) {
  const Toast = Swal.mixin({
    toast: true,
    position: position || 'top-end',
    showConfirmButton: false,
    timer: time || 2000,
    background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFF',
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  })
  await Toast.fire({
    icon: 'success',
    text: message,
  })
}
export { errorAlert, successAlert, errorToast, successToast }
export default {
  errorAlert,
  successAlert,
  errorToast,
  successToast,
}
