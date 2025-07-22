import alerts from '@/assets/js/alerts'
import axios from 'axios'

const instance = axios.create({
  baseURL: `https://${import.meta.env.VITE_BACKEND_URL}/api`,
  timeout: 10000,
})

instance.interceptors.request.use(
  async function (config) {
    if (window.location.pathname != '/' && window.location.pathname != '/register') {
      const expiresIn = localStorage.getItem('expiresIn')
      const currentTime = new Date().toISOString()
      const token = localStorage.getItem('token')

      if (!token || !expiresIn || new Date(expiresIn) < new Date(currentTime)) {
        localStorage.clear()
        await alerts.errorAlert('Session expired. Please log in again.')
        window.location.href = '/'
        return Promise.reject()
      }
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  async function (error) {
    await alerts.errorAlert('Request error. Please try again.')
    return Promise.reject(error)
  },
)

instance.interceptors.response.use(
  function (config) {
    return config
  },
  async function (error) {
    if (!error.response) {
      await alerts.errorAlert('Network error. Please check your connection.')
    } else if (error.response.status == 400) {
      await alerts.errorAlert(error.response.data.message || 'Bad request. Please try again.')
    } else if (error.response.status == 404) {
      await alerts.errorAlert(error.response.data.message || 'Resource not found.')
    } else if (error.response.status == 401) {
      localStorage.clear()
      await alerts.errorAlert('Session expired. Please log in again.')
      window.location.href = '/'
    } else if (error.response.status == 500) {
      await alerts.errorAlert('Internal server error. Please try again later.')
    }
    return Promise.reject(error)
  },
)

export default instance
