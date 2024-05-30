const express = require('express')
const router = express.Router()

//Comments
const commentsController = require('../../controllers/stats/comments')
router.post('/comment', commentsController.addComment)
router.get('/comments', commentsController.getAllArticleComments)
router.get('/comments/article/', commentsController.getArticleCommentsByCountry)

module.exports = router
