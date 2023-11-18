const express = require('express')
const cors = require('cors')
// const layer8 = require('layer8-middleware-wasm')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
// app.use(layer8)

const configRoutes = require('./routes/configRoutes')
const statsRoutes = require('./routes/statsRoutes')
const swaggerRoute = require('./routes/swaggerRoute')

app.use('/', swaggerRoute)
app.use('/v1', statsRoutes)
// app.use('/config', configRoutes) // Uncomment if you want to use the config routes

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`)
})
