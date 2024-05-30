const { validationResult } = require('express-validator')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

//Route to add a new stat to the 'stats' table
const create = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors) return res.status(400).json({ errors: errors.array() })

    const { user_id, id, clicks, keypresses, mouseMovements, scrolls, totalTime } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!id) return res.status(400).json({ error: 'ID is required' })

    const user = await prisma.user.findUnique({
      where: { user_id }
    })

    if (!user) return res.status(400).json({ error: 'User Not Found' })

    const article = await prisma.article.findUnique({
      where: { article_id: id }
    })

    if (article) {
      const existingArticleStats = await prisma.stat.findFirst({
        where: { article_id: id, user_id }
      })

      if (existingArticleStats) {
        await prisma.stat.update({
          where: {
            id: existingArticleStats.id
          },
          data: {
            clicks: existingArticleStats.clicks + clicks,
            keypresses: existingArticleStats.keypresses + keypresses,
            mouseMovements: existingArticleStats.mouseMovements + mouseMovements,
            scrolls: existingArticleStats.scrolls + scrolls,
            totalTime: existingArticleStats.totalTime + totalTime
          }
        })
        res.status(201).json({ id: existingArticleStats.id, message: 'Stats updated successfully' })
      } else {
        const stat = await prisma.stat.create({
          data: {
            user_id,
            topic_id: article.topic_id,
            article_id: id,
            clicks,
            keypresses,
            mouseMovements,
            scrolls,
            totalTime
          }
        })
        res.status(201).json({ id: stat.id, message: 'Stats added successfully' })
      }
    } else {
      const topic = await prisma.topic.findUnique({
        where: { topic_id: id }
      })

      if (!topic) {
        return res.status(404).json({ error: 'Id does not exist' })
      }

      const existingTopicStats = await prisma.stat.findFirst({
        where: { topic_id: id, article_id: null, user_id }
      })

      if (existingTopicStats) {
        await prisma.stat.update({
          where: {
            id: existingTopicStats.id
          },
          data: {
            clicks: existingTopicStats.clicks + clicks,
            keypresses: existingTopicStats.keypresses + keypresses,
            mouseMovements: existingTopicStats.mouseMovements + mouseMovements,
            scrolls: existingTopicStats.scrolls + scrolls,
            totalTime: existingTopicStats.totalTime + totalTime
          }
        })
        res.status(201).json({ id: existingTopicStats.id, message: 'Stats updated successfully' })
      } else {
        const stat = await prisma.stat.create({
          data: {
            user_id,
            topic_id: id,
            article_id: null,
            clicks,
            keypresses,
            mouseMovements,
            scrolls,
            totalTime
          }
        })
        res.status(201).json({ id: stat.id, message: 'Stats added successfully' })
      }
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
    let articleExists = await prisma.article.findUnique({
      where: { article_id: id }
    })

    if (articleExists) {
      const [usersComments, likesWithUsers] = await Promise.all([
        prisma.comment.findMany({
          where: { article_id: id },
          include: {
            user: {
              select: { location: true }
            }
          }
        }),
        prisma.like.findMany({
          where: { article_id: id },
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
    } else {
      let topicExists = await prisma.topic.findUnique({
        where: { topic_id: id }
      })

      if (!topicExists) {
        return res.status(404).json({ error: 'ID does not exist' })
      }

      const [usersComments, likesWithUsers] = await Promise.all([
        prisma.comment.findMany({
          where: { topic_id: id, article_id: null },
          include: {
            user: {
              select: { location: true }
            }
          }
        }),
        prisma.like.findMany({
          where: { topic_id: id, article_id: null },
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
    }

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

module.exports = {
  getArticleStats,
  create,
  getAllStats,
  getUsersLocations,
  getMetricsByCountry
}
