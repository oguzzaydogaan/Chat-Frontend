import Swal from 'sweetalert2'
async function errorAlert(message) {
  await Swal.fire({
    icon: 'error',
    text: message,
    timer: 2000,
    showConfirmButton: false,
  })
}
async function successAlert(message) {
  await Swal.fire({
    icon: 'success',
    text: message,
    timer: 2000,
    showConfirmButton: false,
  })
}
async function errorToast(message) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
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
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    },
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
