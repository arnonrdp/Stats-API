const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const addComment = async (req, res) => {
  try {
    const { user_id, id, content } = req.body

    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!id) return res.status(400).json({ error: 'Id is required' })
    if (!content) return res.status(400).json({ error: 'content is required' })

    const user = await prisma.user.findUnique({
      where: { user_id }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

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

module.exports = {
  addComment,
  getAllArticleComments,
  getArticleCommentsByCountry
}
