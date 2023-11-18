const express = require('express')
const router = express.Router()
const likesController = require('../controllers/likesController')

router.post('/poems/:poem_id/like', likesController.createOrRemove)
router.post('/poems/:poem_id/dislike', likesController.createOrRemove)

module.exports = router
