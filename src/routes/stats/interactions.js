const express = require('express')
const router = express.Router()
const reactionsController = require('../../controllers/stats/reactions')

// Likes and Dislikes
router.post('/reaction', reactionsController.addReaction)
router.get('/reactions', reactionsController.getAllReactions)
router.get('/reactions/by-type', reactionsController.getTotalReactionsByType)
router.get('/reactions/article/', reactionsController.getArticleReactionsByCountry) // Likes or dislikes

module.exports = router
