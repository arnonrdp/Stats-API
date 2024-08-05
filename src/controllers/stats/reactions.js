const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const addReaction = async (req, res) => {
  try {
    const { user_id, article_id, isLike, topic_id, ad_id } = req.body
    if (!user_id) return res.status(400).send('User ID is required')
    if (!article_id && !topic_id && !ad_id) return res.status(400).send('An Id is required')
    const user = await prisma.user.findUnique({
      where: { user_id }
    })

    if (!user) {
      console.error('User not found. ID:', user_id)
      return res.status(404).json({ error: 'User not found' })
    }

    if (article_id) {
      const article = await prisma.article.findUnique({
        where: { article_id }
      })

      if (!article) {
        console.error('Article not found. ID:', article_id)
        return res.status(404).json({ error: 'Article not found' })
      }

      const existingInteraction = await prisma.like.findFirst({
        where: { article_id, user_id },
        select: { id: true }
      })

      if (existingInteraction) {
        if (isLike === null) {
          await prisma.like.delete({
            where: { id: existingInteraction.id }
          })
          console.log('Interaction removed')
          return res.status(201).json({ article_id, message: 'Interaction removed successfully' })
        }

        await prisma.like.update({
          where: { id: existingInteraction.id },
          data: {
            isLike: isLike
          }
        })
        console.log('Interaction updated')
        return res.status(201).json({ article_id, message: 'Interaction updated successfully' })
      } else {
        if (isLike === null) {
          console.error('Interaction should be a boolean')
          return res.status(400).json({ message: 'Interaction should be a boolean' })
        }
        await prisma.like.create({
          data: {
            user_id,
            article_id,
            topic_id: article.topic_id,
            isLike
          }
        })
      }
      console.log('Interaction added')
      return res.status(201).json({ article_id, message: 'Interaction added successfully' })
    }

    if (topic_id) {
      const topic = await prisma.topic.findUnique({
        where: { topic_id }
      })

      if (!topic) {
        console.error('Topic not found. ID:', topic_id)
        return res.status(404).json({ error: 'Topic not found' })
      }

      const existingInteraction = await prisma.like.findFirst({
        where: { topic_id, user_id, article_id },
        select: { id: true }
      })

      if (existingInteraction) {
        if (isLike === null) {
          await prisma.like.delete({
            where: { id: existingInteraction.id }
          })
          console.log('Interaction removed')
          return res.status(201).json({ topic_id, message: 'Interaction removed successfully' })
        }

        await prisma.like.update({
          where: { id: existingInteraction.id },
          data: {
            isLike: isLike
          }
        })
        console.log('Interaction updated')
        return res.status(201).json({ topic_id, message: 'Interaction updated successfully' })
      } else {
        if (isLike === null) return res.status(400).json({ message: 'Like should be a boolean' })
        await prisma.like.create({
          data: {
            user_id,
            topic_id,
            isLike
          }
        })
      }
      console.log('Interaction added')
      return res.status(201).json({ topic_id, message: 'Interaction added successfully' })
    }
    if (ad_id) {
      const ad = await prisma.advertisement.findUnique({
        where: { ad_id }
      })

      if (!ad) {
        console.error('Advertisement not found. ID:', ad_id)
        return res.status(404).json({ error: 'Advertisement not found' })
      }

      const existingInteraction = await prisma.like.findFirst({
        where: { ad_id, user_id },
        select: { id: true }
      })

      if (existingInteraction) {
        if (isLike === null) {
          await prisma.like.delete({
            where: { id: existingInteraction.id }
          })
          console.log('Interaction removed')
          return res.status(201).json({ ad_id, message: 'Interaction removed successfully' })
        }

        await prisma.like.update({
          where: { id: existingInteraction.id },
          data: {
            isLike: isLike
          }
        })
        console.log('Interaction updated')
        return res.status(201).json({ ad_id, message: 'Interaction updated successfully' })
      } else {
        if (isLike === null) return res.status(400).json({ message: 'Like should be a boolean' })
        await prisma.like.create({
          data: {
            user_id,
            ad_id,
            isLike
          }
        })
      }
      console.log('Interaction added')
      return res.status(201).json({ ad_id, message: 'Interaction added successfully' })
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error adding interaction' })
  }
}

// Article reactions by type - likes or dislikes
const getTotalReactionsByType = async (req, res) => {
  const { article_id, type } = req.query
  if (!article_id) res.status(400).json({ error: 'article_id is required' })
  if (type !== 'likes' && type !== 'dislikes') return res.status(400).send('Type is required (likes or dislikes)')
  try {
    const articleExists = await prisma.article.findUnique({
      where: { article_id }
    })
    if (!articleExists) return res.status(404).json({ error: 'Article does not exist' })

    const countLikes = await prisma.like.count({
      where: {
        article_id,
        isLike: type === 'likes' ? true : type === 'dislikes' ? false : null
      }
    })
    res.status(200).json({ total: countLikes })
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: 'Error getting total likes' })
  }
}

const getAllReactions = async (req, res) => {
  if (!req.body) return res.status(400).send('Please use request-body')
  const { id } = req.body
  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  try {
    let interactions
    const articleExists = await prisma.article.findUnique({
      where: { article_id: id }
    })

    if (articleExists) {
      interactions = await prisma.like.findMany({
        where: { article_id: id },
        include: {
          user: {
            select: {
              location: true
            }
          }
        }
      })
    } else {
      const topicExists = await prisma.topic.findUnique({
        where: { topic_id: id }
      })

      if (!topicExists) {
        return res.status(404).json({ error: 'Id does not exist' })
      }

      interactions = await prisma.like.findMany({
        where: { topic_id: id, article_id: null },
        include: {
          user: {
            select: {
              location: true
            }
          }
        }
      })
    }

    const groupedInteractions = interactions.reduce((acc, curr) => {
      const { user, isLike } = curr
      const user_location = user.location
      if (!acc[user_location]) {
        acc[user_location] = { likes: 0, dislikes: 0 }
      }
      if (isLike) {
        acc[user_location].likes += 1
      } else {
        acc[user_location].dislikes += 1
      }
      return acc
    }, {})

    res.status(200).json({ interactions: groupedInteractions })
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: 'Error getting interactions' })
  }
}

// Get Total Likes/Dislikes for each location
const getArticleReactionsByCountry = async (req, res) => {
  const { article_id, type } = req.query

  if (!article_id) return res.status(404).json({ error: 'Article ID is required' })
  if (type !== 'likes' && type !== 'dislikes') return res.status(400).json({ error: 'Type is required (likes or dislikes)' })

  const article = await prisma.article.findUnique({
    where: { article_id }
  })

  if (!article) return res.status(404).json({ error: 'Article Not Found' })

  try {
    const likesWithUsers = await prisma.like.findMany({
      where: {
        article_id: article_id,
        isLike: type === 'likes' ? true : type === 'dislikes' ? false : null
      },
      include: {
        user: {
          select: {
            location: true
          }
        }
      }
    })

    const likesCountByCountry = likesWithUsers.reduce((acc, like) => {
      const location = like.user?.location
      if (location) {
        acc[location] = (acc[location] || 0) + 1
      }
      return acc
    }, {})

    const formattedResult = Object.keys(likesCountByCountry).map((country) => ({
      location: country,
      count: likesCountByCountry[country]
    }))

    res.status(200).json({ response: formattedResult })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'An error occurred while fetching article likes by country.' })
  }
}

module.exports = {
  addReaction,
  getTotalReactionsByType,
  getAllReactions,
  getArticleReactionsByCountry
}
