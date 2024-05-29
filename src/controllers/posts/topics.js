const { PrismaClient } = require('@prisma/client')
const RedisClient = require('../../redis')

const prisma = new PrismaClient()

const createTopic = async (req, res) => {
  try {
    const { user_id, title, content, categories, topic_id } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!title) return res.status(400).json({ error: 'title is required' })
    if (!content) return res.status(400).json({ error: 'content is required' })
    if (!topic_id) return res.status(400).json({ error: 'topic_id is required' })

    const user = await prisma.user.findUnique({
      where: { user_id }
    })
    if (!user) return res.status(400).json({ message: 'User Not Found!' })

    const newTopicData = {
      user_id,
      title,
      content,
      topic_id,
      categories
    }
    // REDIS
    const cachedTopics = await RedisClient.get('allTopics')
    if (cachedTopics) {
      const topics = JSON.parse(cachedTopics)
      // If cached articles exist search for current topic_id
      const topicExists = topics.find((topic) => topic.topic_id === topic_id)
      console.log('Returned Cached topic, topic_ip:', topic_id)

      if (topicExists) {
        // If found current topic return
        return res.json(topicExists)
      } else {
        // If topic not found in cache add it
        topics.push(newTopicData)
        await RedisClient.set('allTopics', JSON.stringify(topics))
        console.log('Added new topic to Redis, topic_id:', topic_id)
      }
    } else {
      // If no cache exists, create a new one
      await RedisClient.set('allTopics', JSON.stringify([newTopicData]))
      console.log('Added topic to Redis cache')
    }
    // --------------------
    // DB
    const existingTopic = await prisma.topic.findUnique({
      where: { topic_id }
    })

    if (existingTopic) {
      res.json(existingTopic)
    } else {
      const newArticle = await prisma.topic.create({
        data: newTopicData
      })
      res.status(201).json({ id: newArticle.topic_id, message: 'Topic created successfully' })
    }
  } catch (e) {
    console.error('Error adding stat:', e)
    res.status(500).json({ error: 'Error creating topic' })
  }
}

const getAllTopics = async (req, res) => {
  try {
    const topics = await prisma.topic.findMany()
    if (!topics) return res.status(400).json({ error: 'Topics list empty' })
    res.status(200).json(topics)
  } catch (e) {
    console.error('Error getting topics list:', e)
    res.status(500).json({ error: 'Error getting topics list' })
  }
}

const getTopic = async (req, res) => {
  try {
    const { topic_id } = req.body
    if (!topic_id) {
      return res.status(400).json({ error: 'Topic ID is required' })
    }

    const topic = await prisma.topic.findUnique({
      where: { topic_id }
    })

    if (!topic) return res.status(400).json({ error: 'Topic not found' })
    res.status(200).json(topic)
  } catch (e) {
    console.error('Error getting topic:', e)
    res.status(500).json({ error: 'Error getting topic' })
  }
}

const getTopicArticles = async (req, res) => {
  try {
    const { topic_id } = req.query
    if (!topic_id) {
      return res.status(400).json({ error: 'Topic ID is required' })
    }

    const topic = await prisma.topic.findUnique({
      where: { topic_id }
    })

    if (!topic) return res.status(400).json({ error: 'Topic not found' })

    const topicArticles = await prisma.article.findMany({
      where: { topic_id }
    })
    res.status(200).json(topicArticles)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: 'Error getting topic articles' })
  }
}

module.exports = {
  createTopic,
  getAllTopics,
  getTopic,
  getTopicArticles
}
