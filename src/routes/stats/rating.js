const { Router } = require('express')
const ratingController = require('../../controllers/stats/postRating')
const router = Router()

router.get('/post-rating', ratingController.getPostRating)

module.exports = router
