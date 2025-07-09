export default function checkAuthorization() {
  const expiresIn = localStorage.getItem('expiresIn')
  const currentTime = new Date().toISOString()
  if (!localStorage.getItem('token') || !expiresIn || new Date(expiresIn) < new Date(currentTime)) {
    localStorage.clear()
    window.location.href = '/'
  }
}
