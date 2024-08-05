const { Router } = require('express')
const ratingController = require('../../controllers/stats/ratings')
const router = Router()

router.get('/post-rating', ratingController.getPostRating)
router.get('/user-rating', ratingController.getUserRating)
router.get('/trace', ratingController.trace)

module.exports = router
