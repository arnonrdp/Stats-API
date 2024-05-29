const express = require('express')
const cors = require('cors')
const layer8 = require('layer8_middleware')
const basicAuth = require('express-basic-auth')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 8080
const swaggerPassword = process.env.SWAGGER_PASSWORD
const loggerMiddleware = (req, res, next) => {
  console.log(`${req.method} - ${req.url}`)
  next()
}

app.use(loggerMiddleware)
// Change origin to localhost:9200 to use in local environment
app.use(cors({ origin: 'https://celebrityfanalyzer.com/', credentials: true }))
app.use(layer8.tunnel)

const authenticateSwagger = (req, res, next) => {
  if (req.path.startsWith('/swagger')) {
    basicAuth({
      challenge: true,
      users: { admin: swaggerPassword }
    })(req, res, next)
  } else {
    next()
  }
}

app.use(authenticateSwagger)

const swaggerRoute = require('./routes/swagger/swaggerRoute')
const statsRoutes = require('./routes/stats/statistics')
const topicRoutes = require('./routes/posts/topics')
const userRoutes = require('./routes/users/userRoutes')
const articleRoutes = require('./routes/posts/articles')
const interactionsRoutes = require('./routes/stats/interactions')
const commentsRoutes = require('./routes/stats/comments')
const sharesRoutes = require('./routes/stats/shares')
const ratingRoutes = require('./routes/stats/rating')

app.use('/', (req, res) => {
  res.status(200).send('No content here. Move out')
})
app.use('/swagger', swaggerRoute)
app.use('/v1', statsRoutes)
app.use('/v1', topicRoutes)
app.use('/v1', userRoutes)
app.use('/v1', articleRoutes)
app.use('/v1', interactionsRoutes)
app.use('/v1', commentsRoutes)
app.use('/v1', sharesRoutes)
app.use('/v1', ratingRoutes)

app.listen(port, async () => {
  console.log(`Server is listening on http://localhost:${port}`)
})
