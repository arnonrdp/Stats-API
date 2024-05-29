const { PrismaClient } = require('@prisma/client')
const RedisClient = require('../../redis')
const prisma = new PrismaClient()

const createArticle = async (req, res) => {
  try {
    const { user_id, title, content, topic_id, article_id } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!title) return res.status(400).json({ error: 'title is required' })
    if (!content) return res.status(400).json({ error: 'content is required' })
    if (!topic_id) return res.status(400).json({ error: 'topic_id is required' })
    if (!article_id) return res.status(400).json({ error: 'article_id is required' })

    const topic = await prisma.topic.findUnique({
      where: { topic_id }
    })

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    const user = await prisma.user.findUnique({
      where: { user_id }
    })

    if (!user) {
      return res.status(400).json({ error: 'User not found' })
    }

    const newArticleData = {
      user_id,
      title,
      content,
      topic_id,
      article_id
    }

    // REDIS
    const cachedArticles = await RedisClient.get('allArticles')
    if (cachedArticles) {
      const articles = JSON.parse(cachedArticles)
      // If cached articles exist search for current article_id
      const articleExists = articles.find((article) => article.article_id === article_id)
      console.log('Returned Cached Article, article_id:', article_id)

      if (articleExists) {
        // If found current article return
        return res.json({ ok: 'article exists in cache' })
      } else {
        // If article not found in cache add it
        articles.push(newArticleData)
        await RedisClient.set('allArticles', JSON.stringify(articles))
        console.log('Added new article to Redis, article_id:', article_id)
      }
    } else {
      // If no cache exists, create a new one
      await RedisClient.set('allArticles', JSON.stringify([newArticleData]))
      console.log('Added article to Redis cache')
    }
    // --------------------

    // DB
    const existingArticle = await prisma.article.findUnique({
      where: { article_id }
    })

    if (existingArticle) {
      res.json({ ok: 'article exists in db' })
    } else {
      const newArticle = await prisma.article.create({
        data: newArticleData
      })
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
    if (!article_id) return res.status(400).json({ error: 'article_id is required' })
    const article = await prisma.article.findUnique({
      where: { article_id }
    })

    if (!article) return res.status(400).json({ error: 'Article not found' })
    await prisma.article.delete({ where: { article_id } })
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
