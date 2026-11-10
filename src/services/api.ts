import axios from 'axios'

/** Cliente HTTP compartilhado para a API pública da CheapShark. */
export const api = axios.create({
  baseURL: 'https://www.cheapshark.com/api/1.0',
  timeout: 6000,
})
