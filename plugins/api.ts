export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$fetch = async (url, options = {}) => {
    const token = localStorage.getItem('token')

    return $fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
  }
})
