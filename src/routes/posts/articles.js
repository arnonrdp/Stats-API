const express = require('express')
const router = express.Router()
const articleController = require('../../controllers/posts/article')

// router.use(express.json())
router.post('/article', articleController.createArticle)
router.get('/article', articleController.getArticle)
router.get('/articles', articleController.getAllArticles)
router.delete('/article', articleController.deleteArticle)

module.exports = router
