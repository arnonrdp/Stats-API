const express = require('express')
const router = express.Router()
const sharesController = require('../../controllers/stats/shares')

router.post('/share', sharesController.addShare)

module.exports = router
