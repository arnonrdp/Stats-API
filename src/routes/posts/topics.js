const express = require('express')
const router = express.Router()
const topicController = require('../../controllers/posts/topics')

// router.use(express.json())
router.post('/topic', topicController.createTopic)
router.get('/topic', topicController.getTopic)
router.get('/topics', topicController.getAllTopics)
router.get('/topic/articles', topicController.getTopicArticles)

module.exports = router
