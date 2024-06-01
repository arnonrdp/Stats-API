const express = require('express')
const router = express.Router()
const articleController = require('../../controllers/posts/advertisement')

router.post('/advertisement', articleController.createAd)

module.exports = router
