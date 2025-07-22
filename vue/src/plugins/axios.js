import axios from 'axios'

const instance = axios.create({
  baseURL: `https://${import.meta.env.VITE_BACKEND_URL}/api`,
  timeout: 10000,
})

instance.interceptors.request.use(
  function (config) {
    if (window.location.pathname != '/' && window.location.pathname != '/register') {
      const expiresIn = localStorage.getItem('expiresIn')
      const currentTime = new Date().toISOString()
      const token = localStorage.getItem('token')

      if (!token || !expiresIn || new Date(expiresIn) < new Date(currentTime)) {
        localStorage.clear()
        alert('Oturum sonlandırıldı.')
        window.location.href = '/'
        return Promise.reject()
      }
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  function (error) {
    alert('An error occurred while processing your request.')
    return Promise.reject(error)
  },
)

instance.interceptors.response.use(
  function (config) {
    return config
  },
  function (error) {
    if (!error.response) {
      alert('Server down. Please try again later.')
    }
    if (error.response.status == 401) {
      localStorage.clear()
      alert('Oturum sonlandırıldı.')
      window.location.href = '/'
    }
    if (error.response.status == 500) {
      alert('An error occured. Please try again later.')
    }
    return Promise.reject(error)
  },
)

export default instance
