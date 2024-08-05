const { PrismaClient } = require('@prisma/client')
const RedisClient = require('../../redis')
const prisma = new PrismaClient()
const userController = require('../../controllers/users')

const createArticle = async (req, res) => {
  try {
    const { user_id, title, content, topic_id, article_id } = req.body
    if (!user_id) {
      console.error('user_id is required')
      return res.status(400).json({ error: 'user_id is required' })
    }
    if (!title) {
      console.error('title is required')
      return res.status(400).json({ error: 'title is required' })
    }
    if (!content) {
      console.error('content is required')
      return res.status(400).json({ error: 'content is required' })
    }
    if (!topic_id) {
      console.error('topic_id is required')
      return res.status(400).json({ error: 'topic_id is required' })
    }
    if (!article_id) {
      console.error('article_id is required')
      return res.status(400).json({ error: 'article_id is required' })
    }

    const topic = await prisma.topic.findUnique({
      where: { topic_id }
    })

    if (!topic) {
      console.error('Topic not found')
      return res.status(404).json({ error: 'Topic not found' })
    }

    let user = await prisma.user.findUnique({
      where: { user_id }
    })

    if (!user) {
      const addUserReq = {
        body: { user_id }
      }
      const addUserRes = {
        status: () => ({
          json: (data) => data
        })
      }
      const addUserResult = await userController.addUser(addUserReq, addUserRes)
      if (addUserResult.error) {
        return res.status(500).json({ error: 'Error creating user: createArticle controller' })
      }
    }

    const newArticleData = {
      user_id,
      title,
      content,
      topic_id,
      article_id
    }
    const statData = {
      user_id,
      topic_id: newArticleData.topic_id,
      article_id: newArticleData.article_id,
      clicks: 0,
      keypresses: 0,
      mouseMovements: 0,
      scrolls: 0,
      totalTime: 0
    }

    // DB
    const existingArticle = await prisma.article.findUnique({
      where: { article_id }
    })

    if (existingArticle) {
      console.log('Returned existing article, article_id:', article_id)
      res.json({ ok: 'article exists in db' })
    } else {
      const newArticle = await prisma.article.create({
        data: newArticleData
      })
      const stat = await prisma.stat.create({ data: statData })
      console.log('Created new article and stats data', newArticle?.article_id, stat.id)
      res.status(201).json({ id: newArticle.article_id, message: 'Article created successfully' })
    }
    // --------------------
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: 'Error creating article' })
  }
}

const getAllArticles = async (req, res) => {
  try {
    const cachedArticles = await RedisClient.get('allArticles')
    if (cachedArticles) {
      console.log('Returned Cached Articles List')
      return res.json(JSON.parse(cachedArticles))
    }
    const articles = await prisma.article.findMany()
    await RedisClient.set('allArticles', JSON.stringify(articles))
    console.log('Created articles list in Redis')
    return res.status(200).json(articles)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error getting articles' })
  }
}

const deleteArticle = async (req, res) => {
  try {
    const { article_id } = req.query
    const redisKey = `post:${article_id}`
    if (!article_id) return res.status(400).json({ error: 'article_id is required' })
    const article = await prisma.article.findUnique({
      where: { article_id }
    })

    if (!article) return res.status(400).json({ error: 'Article not found' })
    await prisma.article.delete({ where: { article_id } })
    await RedisClient.json.DEL(redisKey)
    return res.status(200).json({ message: 'Article deleted successfully' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error deleting article' })
  }
}

const getArticle = async (req, res) => {
  try {
    const { article_id } = req.query
    if (!article_id) {
      return res.status(400).json({ error: 'article_id is required' })
    }

    const article = await prisma.article.findUnique({
      where: { article_id }
    })

    if (!article) return res.status(404).json({ error: 'Article not found' })
    res.status(200).json(article)
  } catch (e) {
    console.error('Error getting user:', e)
  }
}

module.exports = {
  createArticle,
  getAllArticles,
  deleteArticle,
  getArticle
}
