const { PrismaClient } = require('@prisma/client')
const RedisClient = require('../../redis')
const path = require('path')
const { IP2Location } = require('ip2location-nodejs')
let ip2location = new IP2Location()

const file = path.join(__dirname, 'IP2LOCATION-LITE-DB1.BIN')
ip2location.open(file)

const prisma = new PrismaClient()

const calculateRating = (postStats, maxStats) => {
  const { clicks, keypresses, mouseMovements, scrolls, totalTime } = postStats

  const maxClicks = maxStats.clicks || 1
  const maxKeypresses = maxStats.keypresses || 1
  const maxMouseMovements = maxStats.mouseMovements || 1
  const maxScrolls = maxStats.scrolls || 1
  const maxTotalTime = maxStats.totalTime || 1

  let sumOfRatios = 0
  let countOfNonZeroStats = 0

  if (clicks > 0) {
    sumOfRatios += clicks / maxClicks
    countOfNonZeroStats++
  }
  if (keypresses > 0) {
    sumOfRatios += keypresses / maxKeypresses
    countOfNonZeroStats++
  }
  if (mouseMovements > 0) {
    sumOfRatios += mouseMovements / maxMouseMovements
    countOfNonZeroStats++
  }
  if (scrolls > 0) {
    sumOfRatios += scrolls / maxScrolls
    countOfNonZeroStats++
  }
  if (totalTime > 0) {
    sumOfRatios += totalTime / maxTotalTime
    countOfNonZeroStats++
  }

  if (countOfNonZeroStats === 0) {
    return 0
  }

  const rating = (sumOfRatios / countOfNonZeroStats) * 100
  return Math.min(rating, 100)
}

const getPostRating = async (req, res) => {
  if (!req.body) return res.status(400).send('Please use request-body')
  const { id } = req.body

  if (!id) return res.status(400).json({ error: 'ID is required' })

  const redisKey = `postRating:${id}`
  const cacheExpiry = 600

  try {
    const cachedRating = await RedisClient.json.get(redisKey)
    if (cachedRating) {
      console.log('Post rating returned from Redis')
      return res.status(200).json(cachedRating)
    }

    let stats
    let entityType

    const articleExists = await prisma.article.findUnique({
      where: { article_id: id }
    })

    if (articleExists) {
      entityType = 'article'
      stats = await prisma.stat.findMany({
        where: { article_id: id }
      })
    } else {
      const topicExists = await prisma.topic.findUnique({
        where: { topic_id: id }
      })

      if (topicExists) {
        entityType = 'topic'
        stats = await prisma.stat.findMany({
          where: { topic_id: id, article_id: null }
        })
      } else {
        const adExists = await prisma.advertisement.findUnique({
          where: { ad_id: id }
        })
        if (!adExists) {
          return res.status(404).json({ error: 'ID does not exist' })
        }

        entityType = 'advertisement'
        stats = await prisma.stat.findMany({
          where: { ad_id: id }
        })
      }
    }

    if (stats.length === 0) {
      return res.status(200).json({ response: 'No stats available for the given ID or stats list is empty' })
    }

    const allStats = await prisma.stat.findMany()
    const maxStats = {
      clicks: Math.max(...allStats.map((stat) => stat.clicks)),
      keypresses: Math.max(...allStats.map((stat) => stat.keypresses)),
      mouseMovements: Math.max(...allStats.map((stat) => stat.mouseMovements)),
      scrolls: Math.max(...allStats.map((stat) => stat.scrolls)),
      totalTime: Math.max(...allStats.map((stat) => stat.totalTime))
    }

    const specificStats = stats.reduce(
      (acc, stat) => {
        acc.clicks += stat.clicks
        acc.keypresses += stat.keypresses
        acc.mouseMovements += stat.mouseMovements
        acc.scrolls += stat.scrolls
        acc.totalTime += stat.totalTime
        return acc
      },
      { clicks: 0, keypresses: 0, mouseMovements: 0, scrolls: 0, totalTime: 0 }
    )

    const postRating = Math.min(calculateRating(specificStats, maxStats), 100)

    let ratings = []
    if (entityType === 'article') {
      const articles = await prisma.article.findMany({
        include: {
          stats: true
        }
      })

      ratings = articles.map((article) => {
        const articleStats = article.stats.reduce(
          (acc, stat) => {
            acc.clicks += stat.clicks
            acc.keypresses += stat.keypresses
            acc.mouseMovements += stat.mouseMovements
            acc.scrolls += stat.scrolls
            acc.totalTime += stat.totalTime
            return acc
          },
          { clicks: 0, keypresses: 0, mouseMovements: 0, scrolls: 0, totalTime: 0 }
        )

        const rating = Math.min(calculateRating(articleStats, maxStats), 100)
        return {
          article_id: article.article_id,
          rating
        }
      })
    } else if (entityType === 'topic') {
      const topics = await prisma.topic.findMany({
        include: {
          Stat: true
        }
      })

      ratings = topics.map((topic) => {
        const topicStats = topic.Stat.reduce(
          (acc, stat) => {
            acc.clicks += stat.clicks
            acc.keypresses += stat.keypresses
            acc.mouseMovements += stat.mouseMovements
            acc.scrolls += stat.scrolls
            acc.totalTime += stat.totalTime
            return acc
          },
          { clicks: 0, keypresses: 0, mouseMovements: 0, scrolls: 0, totalTime: 0 }
        )

        const rating = Math.min(calculateRating(topicStats, maxStats), 100)
        return {
          topic_id: topic.topic_id,
          rating
        }
      })
    } else if (entityType === 'advertisement') {
      const advertisements = await prisma.advertisement.findMany({
        include: {
          Stat: true
        }
      })

      ratings = advertisements.map((advertisement) => {
        const adStats = advertisement.Stat.reduce(
          (acc, stat) => {
            acc.clicks += stat.clicks
            acc.keypresses += stat.keypresses
            acc.mouseMovements += stat.mouseMovements
            acc.scrolls += stat.scrolls
            acc.totalTime += stat.totalTime
            return acc
          },
          { clicks: 0, keypresses: 0, mouseMovements: 0, scrolls: 0, totalTime: 0 }
        )

        const rating = Math.min(calculateRating(adStats, maxStats), 100)
        return {
          ad_id: advertisement.ad_id,
          rating
        }
      })
    }

    const ratingData = { postRating, ratings }

    await RedisClient.json.set(redisKey, '$', ratingData)
    await RedisClient.expire(redisKey, cacheExpiry)
    console.log('Post rating added to Redis')

    res.status(200).json(ratingData)
  } catch (error) {
    console.error('Error calculating post rating:', error)
    res.status(500).json({ error: 'Error calculating post rating' })
  }
}

const getUserRating = async (req, res) => {
  if (!req.body) return res.status(400).send('Please use request-body')
  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'User ID is required' })

  const redisKey = `userRating:${user_id}`
  const cacheExpiry = 600

  try {
    const cachedRating = await RedisClient.json.get(redisKey)

    if (cachedRating) {
      console.log('User rating returned from Redis')
      return res.status(200).json(cachedRating)
    }

    const user = await prisma.user.findUnique({
      where: { user_id },
      include: {
        articles: { include: { stats: true } },
        Topic: { include: { Stat: true } },
        Advertisement: { include: { Stat: true } }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const allStats = await prisma.stat.findMany()
    const maxStats = {
      clicks: Math.max(...allStats.map((stat) => stat.clicks)),
      keypresses: Math.max(...allStats.map((stat) => stat.keypresses)),
      mouseMovements: Math.max(...allStats.map((stat) => stat.mouseMovements)),
      scrolls: Math.max(...allStats.map((stat) => stat.scrolls)),
      totalTime: Math.max(...allStats.map((stat) => stat.totalTime))
    }

    let totalRating = 0
    let totalPosts = 0

    const calculatePostRatings = (posts, type) => {
      return posts.map((post) => {
        const postStats = post[type].reduce(
          (acc, stat) => {
            acc.clicks += stat.clicks
            acc.keypresses += stat.keypresses
            acc.mouseMovements += stat.mouseMovements
            acc.scrolls += stat.scrolls
            acc.totalTime += stat.totalTime
            return acc
          },
          { clicks: 0, keypresses: 0, mouseMovements: 0, scrolls: 0, totalTime: 0 }
        )

        const rating = calculateRating(postStats, maxStats)
        totalRating += rating
        totalPosts++

        return {
          topic_id: post.topic_id || null,
          article_id: post.article_id || null,
          ad_id: post.ad_id || null,
          rating
        }
      })
    }

    const articleRatings = calculatePostRatings(user.articles, 'stats')
    const topicRatings = calculatePostRatings(user.Topic, 'Stat')
    const advertisementRatings = calculatePostRatings(user.Advertisement, 'Stat')

    const userRating = totalPosts > 0 ? totalRating / totalPosts : 0

    const ratingData = {
      userRating,
      articleRatings,
      topicRatings,
      advertisementRatings
    }

    await RedisClient.json.set(redisKey, '$', ratingData)
    await RedisClient.expire(redisKey, cacheExpiry)
    console.log('User rating added to Redis')

    res.status(200).json(ratingData)
  } catch (error) {
    console.error('Error calculating user rating:', error)
    res.status(500).json({ error: 'Error calculating user rating' })
  }
}

const trace = (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress

  try {
    const location = ip2location.getCountryShort(ipAddress)
    res.status(200).json({
      ip: ipAddress,
      country: location
    })
  } catch (error) {
    console.error('Error getting IP location:', error)
    res.status(500).json({ error: 'Error getting IP location' })
  }
}

module.exports = { getPostRating, getUserRating, trace }
