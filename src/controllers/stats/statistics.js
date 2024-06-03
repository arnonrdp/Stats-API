const { validationResult } = require('express-validator')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

//Route to add a new stat to the 'stats' table
const create = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors) return res.status(400).json({ errors: errors.array() })

    const { user_id, id, clicks, keypresses, mouseMovements, scrolls, totalTime, type } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!id) return res.status(400).json({ error: 'ID is required' })
    if (!type) return res.status(400).json({ error: 'Type is required' })

    const user = await prisma.user.findUnique({
      where: { user_id }
    })

    if (!user) return res.status(400).json({ error: 'User Not Found' })

    let existingStats, statData, entity

    switch (type) {
      case 'article':
        entity = await prisma.article.findUnique({
          where: { article_id: id }
        })
        if (!entity) {
          console.error('Article entity not found')
          return res.status(400).json({ error: 'Article Not Found' })
        }
        existingStats = await prisma.stat.findFirst({
          where: { article_id: id, user_id }
        })

        statData = {
          user_id,
          topic_id: entity.topic_id,
          article_id: id,
          clicks,
          keypresses,
          mouseMovements,
          scrolls,
          totalTime
        }
        break
      case 'topic':
        entity = await prisma.topic.findUnique({
          where: { topic_id: id }
        })
        if (!entity) {
          console.error('Topic entity not found')
          return res.status(400).json({ error: 'Topic Not Found' })
        }
        existingStats = await prisma.stat.findFirst({
          where: { topic_id: id, article_id: null, user_id }
        })
        statData = {
          user_id,
          topic_id: id,
          article_id: null,
          clicks,
          keypresses,
          mouseMovements,
          scrolls,
          totalTime
        }
        break
      case 'advertisement':
        entity = await prisma.advertisement.findUnique({
          where: { ad_id: id }
        })
        if (!entity) {
          console.error('Advertisement entity not found')
          return res.status(400).json({ error: 'Advertisement Not Found' })
        }
        existingStats = await prisma.stat.findFirst({
          where: { ad_id: id, user_id }
        })

        statData = {
          user_id,
          ad_id: id,
          clicks,
          keypresses,
          mouseMovements,
          scrolls,
          totalTime
        }
        break
      default:
        return res.status(400).json({ error: 'Invalid type' })
    }
    if (existingStats) {
      await prisma.stat.update({
        where: { id: existingStats.id },
        data: {
          clicks: existingStats.clicks + clicks,
          keypresses: existingStats.keypresses + keypresses,
          mouseMovements: existingStats.mouseMovements + mouseMovements,
          scrolls: existingStats.scrolls + scrolls,
          totalTime: existingStats.totalTime + totalTime
        }
      })
      console.log('Stats updated successfully')
      res.status(200).json({ id: existingStats.id, status: 'Stats updated successfully' })
    } else {
      const stat = await prisma.stat.create({ data: statData })
      console.log('Stats added successfully. ID:', stat?.id)
      res.status(201).json({ id: stat.id, message: 'Stats added successfully' })
    }
  } catch (e) {
    console.error('Error adding stat:', e)
    res.status(500).json({ error: 'Error adding stat' })
  }
}

// Route to get all stats from the 'stats' table by article_id
const getArticleStats = async (req, res) => {
  if (!req.body) return res.status(400).send('Please use request-body')
  try {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'ID is required' })

    const article = await prisma.stat.findMany({
      where: {
        OR: [
          {
            article_id: id
          },
          {
            topic_id: id,
            article_id: null
          }
        ]
      }
    })

    if (!article) return res.status(400).json({ error: 'Article not found' })

    return res.status(200).json(article)
  } catch (e) {
    console.error('Error getting stats:', e)
    res.status(500).json({ error: 'Error getting stats' })
  }
}

// Route to filter stats for a specific prompt from the 'stats' table
const getAllStats = async (req, res) => {
  try {
    const result = await prisma.stat.findMany()
    res.status(200).json(result)
  } catch (error) {
    console.error('Error getting stats:', error)
    res.status(500).json({ error: 'Error getting stats' })
  }
}

// Get Total Users for each location
const getUsersLocations = async (req, res) => {
  try {
    const locationCounts = await prisma.user.groupBy({
      by: ['location'],
      _count: {
        location: true
      },
      where: {
        location: {
          not: null
        }
      }
    })

    const formattedResult = locationCounts.map((item) => ({
      location: item.location,
      users: item._count.location
    }))

    res.status(200).json({ locations: formattedResult })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'An error occurred while fetching user locations.' })
  }
}

const getMetricsByCountry = async (req, res) => {
  const { id } = req.body
  if (!id) return res.status(404).json({ error: 'ID is required' })

  try {
    let metrics
    let entityType

    const articleExists = await prisma.article.findUnique({
      where: { article_id: id }
    })

    if (articleExists) {
      entityType = 'article'
    } else {
      const topicExists = await prisma.topic.findUnique({
        where: { topic_id: id }
      })

      if (topicExists) {
        entityType = 'topic'
      } else {
        const adExists = await prisma.advertisement.findUnique({
          where: { ad_id: id }
        })

        if (!adExists) {
          return res.status(404).json({ error: 'ID does not exist' })
        }

        entityType = 'advertisement'
      }
    }

    let commentsFilter = {}
    let likesFilter = {}

    if (entityType === 'article') {
      commentsFilter = { article_id: id }
      likesFilter = { article_id: id }
    } else if (entityType === 'topic') {
      commentsFilter = { topic_id: id, article_id: null }
      likesFilter = { topic_id: id, article_id: null }
    } else if (entityType === 'advertisement') {
      commentsFilter = { ad_id: id }
      likesFilter = { ad_id: id }
    }

    const [usersComments, likesWithUsers] = await Promise.all([
      prisma.comment.findMany({
        where: commentsFilter,
        include: {
          user: {
            select: { location: true }
          }
        }
      }),
      prisma.like.findMany({
        where: likesFilter,
        include: {
          user: {
            select: { location: true }
          }
        }
      })
    ])

    const commentsByCountry = usersComments.reduce((acc, comment) => {
      const location = comment.user?.location
      if (location) {
        acc[location] = acc[location] || { comments: 0, interactions: { likes: 0, dislikes: 0 } }
        acc[location].comments += 1
      }
      return acc
    }, {})

    likesWithUsers.forEach((like) => {
      const location = like.user?.location
      if (location) {
        commentsByCountry[location] = commentsByCountry[location] || { comments: 0, interactions: { likes: 0, dislikes: 0 } }
        if (like.isLike) {
          commentsByCountry[location].interactions.likes += 1
        } else {
          commentsByCountry[location].interactions.dislikes += 1
        }
      }
    })

    metrics = commentsByCountry

    const formattedResult = Object.keys(metrics).map((country) => ({
      location: country,
      comments: metrics[country].comments,
      interactions: metrics[country].interactions
    }))

    res.status(200).json({ response: formattedResult })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'An error occurred while fetching metrics by country.' })
  }
}

module.exports = { getMetricsByCountry }

module.exports = {
  getArticleStats,
  create,
  getAllStats,
  getUsersLocations,
  getMetricsByCountry
}
