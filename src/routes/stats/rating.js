const { Router } = require('express')
const ratingController = require('../../controllers/stats/postRating')
const express = require('express')
const router = Router()

const app = express()
router.get('/post-rating', app.use(express.json()), ratingController.getPostRating)

module.exports = router
