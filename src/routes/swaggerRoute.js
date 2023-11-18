const express = require('express')
const router = express.Router()
const swaggerController = require('../controllers/swaggerController')

router.get('/', swaggerController.serveSwagger)
router.get('/swagger.js', swaggerController.serveSwaggerJS)

module.exports = router
