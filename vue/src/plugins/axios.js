import axios from 'axios'

const instance = axios.create({
  baseURL: 'https://localhost:7193/api',
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
    alert('Beklenmeyen hata')
    return Promise.reject(error)
  },
)

instance.interceptors.response.use(
  function (config) {
    return config
  },
  function (error) {
    if (!error.response) {
      alert('Sunucu açık değil.')
    }
    if (error.response.status == 401) {
      localStorage.clear()
      alert('Oturum sonlandırıldı.')
      window.location.href = '/'
    }
    return Promise.reject(error)
  },
)

export default instance
