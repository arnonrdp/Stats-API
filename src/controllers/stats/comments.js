const { PrismaClient } = require('@prisma/client')
const RedisClient = require('../../redis')
const OpenAI = require('openai')

const prisma = new PrismaClient()
const openAiApi = process.env.OPEN_AI_API

const openai = new OpenAI({
  apiKey: openAiApi
})

const addComment = async (req, res) => {
  try {
    const { user_id, id, content } = req.body

    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!id) return res.status(400).json({ error: 'Id is required' })
    if (!content) return res.status(400).json({ error: 'content is required' })

    const user = await prisma.user.findUnique({
      where: { user_id }
    })
    if (!user) {
      console.error('User not found. ID:', user_id)
      return res.status(404).json({ error: 'User not found' })
    }

    const articleExists = await prisma.article.findUnique({
      where: { article_id: id }
    })

    if (articleExists) {
      const newComment = await prisma.comment.create({
        data: {
          article_id: id,
          topic_id: articleExists.topic_id,
          user_id,
          content
        }
      })
      res.status(200).json({ comment: newComment })
    } else {
      const topicExists = await prisma.topic.findUnique({
        where: { topic_id: id }
      })

      if (topicExists) {
        const newComment = await prisma.comment.create({
          data: {
            article_id: null,
            topic_id: id,
            user_id,
            content
          }
        })
        res.status(200).json({ comment: newComment })
      } else {
        const adExists = await prisma.advertisement.findUnique({
          where: { ad_id: id }
        })

        if (adExists) {
          const newComment = await prisma.comment.create({
            data: {
              article_id: null,
              topic_id: null,
              ad_id: id,
              user_id,
              content
            }
          })
          res.status(200).json({ comment: newComment })
        } else {
          console.error('Nothing found for this ID:', id)
          return res.status(404).json({ error: 'ID does not exist' })
        }
      }
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error adding comment' })
  }
}

const getAllArticleComments = async (req, res) => {
  if (!req.body) return res.status(400).send('Please use request-body')
  try {
    let comments
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'ID is required' })

    const articleExists = await prisma.article.findUnique({
      where: { article_id: id }
    })

    if (articleExists) {
      comments = await prisma.comment.findMany({
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

      if (topicExists) {
        comments = await prisma.comment.findMany({
          where: { topic_id: id, article_id: null },
          include: {
            user: {
              select: {
                location: true
              }
            }
          }
        })
      } else {
        const adExists = await prisma.advertisement.findUnique({
          where: { ad_id: id }
        })
        if (adExists) {
          comments = await prisma.comment.findMany({
            where: { ad_id: id, article_id: null, topic_id: null },
            include: {
              user: {
                select: {
                  location: true
                }
              }
            }
          })
        } else {
          return res.status(404).json({ error: 'ID does not exist' })
        }
      }
    }

    const groupedComments = comments.reduce((acc, curr) => {
      const user_location = curr.user.location
      if (!acc[user_location]) {
        acc[user_location] = 0
      }
      acc[user_location] += 1
      return acc
    }, {})

    return res.status(200).json({ comments: groupedComments })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error getting comments' })
  }
}

const getArticleCommentsByCountry = async (req, res) => {
  const { article_id } = req.query

  if (!article_id) return res.status(404).json({ error: 'Article ID is required' })
  const article = await prisma.article.findUnique({
    where: { article_id }
  })

  if (!article) return res.status(404).json({ error: 'Article Not Found' })

  try {
    const usersComments = await prisma.comment.findMany({
      where: {
        article_id: article_id
      },
      include: {
        user: {
          select: {
            location: true
          }
        }
      }
    })

    const commentsByCountry = usersComments.reduce((acc, comment) => {
      const location = comment.user?.location
      if (location) {
        acc[location] = (acc[location] || 0) + 1
      }
      return acc
    }, {})

    const formattedResult = Object.keys(commentsByCountry).map((country) => ({
      location: country,
      count: commentsByCountry[country]
    }))

    res.status(200).json({ response: formattedResult })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'An error occurred while fetching article comments by country.' })
  }
}

const analyze = async (req, res) => {
  const { id, comments } = req.body
  if (!id) {
    console.error('Please use request-body. Id not provided')
    return res.status(400).send('Please use request-body')
  }
  if (!comments) {
    console.error('Please use request-body. Comments should be provided')
    return res.status(400).send('Please use request-body')
  }

  try {
    const redisKey = `commentAnalysis:${id}`
    const cacheExpiry = 43200

    const redisPost = await RedisClient.json.get(redisKey)

    if (redisPost) {
      console.log('Comments analysis returned from Redis')
      return res.status(200).json({ response: redisPost })
    }
    const prompt = comments?.map((comment, index) => index + ': ' + comment).join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze comments attitude of article and return a single word answer: "Positive", "Negative", "Neutral" or "Unknown"'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 100,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    })

    if (response.choices[0].message.content) {
      await RedisClient.json.set(redisKey, '$', response.choices[0].message.content)
      await RedisClient.expire(redisKey, cacheExpiry)
      console.log('Sentiment analysis response:', response.choices[0])
      return res.status(200).json({ response: response.choices[0].message.content })
    }
  } catch (e) {
    console.error('Error getting comments analysis:', e)
    res.status(500).json({ error: 'Error getting comments analysis' })
  }
}

module.exports = {
  addComment,
  getAllArticleComments,
  getArticleCommentsByCountry,
  analyze
}
