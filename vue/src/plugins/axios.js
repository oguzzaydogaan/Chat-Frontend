import alerts from '@/assets/js/alerts'
import axios from 'axios'
import db from './db'

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
        await db.resetDb()
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
      await alerts.errorAlert('Server status is closed.')
    } else if (error.response.status == 400) {
      await alerts.errorAlert(error.response.data || 'Bad request. Please try again.')
    } else if (error.response.status == 404) {
      await alerts.errorAlert(error.response.data || 'Resource not found.')
    } else if (error.response.status == 403) {
      await alerts.errorAlert(error.response.data || 'Forbidden.')
    } else if (error.response.status == 401) {
      localStorage.clear()
      await db.resetDb()
      await alerts.errorAlert('Session expired. Please log in again.')
      window.location.href = '/'
    } else if (error.response.status == 500) {
      await alerts.errorAlert('Something went wrong on the server. Please try again later.')
    }
    return Promise.reject(error)
  },
)

export default instance
