import axios from 'axios'

/** Cliente HTTP do backend GameZone; separado da integração com a CheapShark. */
export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
})
