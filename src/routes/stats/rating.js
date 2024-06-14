const { Router } = require('express')
const ratingController = require('../../controllers/stats/ratings')
const router = Router()

router.get('/post-rating', ratingController.getPostRating)
router.get('/user-rating', ratingController.getUserRating)

module.exports = router
