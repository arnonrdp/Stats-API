const express = require('express')
const layer8 = require('layer8_middleware')
const cors = require('cors')
const basicAuth = require('express-basic-auth')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 8080
const swaggerPassword = process.env.SWAGGER_PASSWORD
const clearUsersPassword = process.env.CLEAR_PASSWORD

app.use(cors())
// app.use(express.json())
const loggerMiddleware = (req, res, next) => {
  console.log(`${req.method} - ${req.url}`)
  console.log(`${req.path}`)
  next()
}

app.use(loggerMiddleware)

const authenticateRoutes = (req, res, next) => {
  if (req.path.startsWith('/swagger')) {
    basicAuth({
      challenge: true,
      users: { admin: swaggerPassword }
    })(req, res, next)
  } else if (req.path === '/v1/users/clear' && req.method === 'DELETE') {
    basicAuth({
      challenge: true,
      users: {
        admin: clearUsersPassword
      }
    })(req, res, next)
  } else {
    next()
  }
}

app.use(authenticateRoutes)

app.use(layer8.tunnel)
const swaggerRoute = require('./routes/swagger/swaggerRoute')
const statsRoutes = require('./routes/stats/statistics')
const topicRoutes = require('./routes/posts/topics')
const adsRoutes = require('./routes/posts/advertisements')
const userRoutes = require('./routes/users/userRoutes')
const articleRoutes = require('./routes/posts/articles')
const interactionsRoutes = require('./routes/stats/interactions')
const commentsRoutes = require('./routes/stats/comments')
const sharesRoutes = require('./routes/stats/shares')
const ratingRoutes = require('./routes/stats/rating')

app.use('/swagger', swaggerRoute)
app.use('/v1', statsRoutes)
app.use('/v1', topicRoutes)
app.use('/v1', userRoutes)
app.use('/v1', articleRoutes)
app.use('/v1', adsRoutes)
app.use('/v1', interactionsRoutes)
app.use('/v1', commentsRoutes)
app.use('/v1', sharesRoutes)
app.use('/v1', ratingRoutes)

app.get('/', (req, res) => {
  res.status(200).send('No content here. Move out')
})

app.listen(port, async () => {
  console.log(`Server is listening on PORT:${port}`)
})
