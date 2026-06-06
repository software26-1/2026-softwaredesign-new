import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: { resolve: (v: string) => void; reject: (e: unknown) => void }[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

function redirectToLogin() {
  const user = localStorage.getItem('user')
  const role = user ? JSON.parse(user).role : null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  // 이미 로그인 페이지면 리다이렉트 안 함
  const target = role === 'ADMIN' ? '/admin-login' : '/login'
  if (!window.location.pathname.includes('login')) {
    window.location.replace(target)
  }
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      redirectToLogin()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return client(original)
      }).catch(err => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'}/auth/refresh`,
        { refreshToken }
      )
      const newToken = res.data.data.accessToken
      const newRefresh = res.data.data.refreshToken
      localStorage.setItem('accessToken', newToken)
      if (newRefresh) localStorage.setItem('refreshToken', newRefresh)
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return client(original)
    } catch (refreshError: any) {
      // 네트워크 에러(서버 재시작 중)면 로그아웃하지 않고 조용히 실패
      if (!refreshError.response) {
        processQueue(refreshError, null)
        isRefreshing = false
        return Promise.reject(refreshError)
      }
      processQueue(refreshError, null)
      redirectToLogin()
      return Promise.reject(new Error('Session expired'))
    } finally {
      isRefreshing = false
    }
  }
)

export default client
