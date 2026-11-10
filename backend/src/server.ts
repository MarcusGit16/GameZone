import 'dotenv/config'
import app from './app.js'

const port = Number(process.env.PORT ?? 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT deve ser um número de porta válido.')
}

app.listen(port, () => {
  console.log(`Backend GameZone disponível na porta ${port}.`)
})
