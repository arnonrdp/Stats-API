const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const addShare = async (req, res) => {
  if (!req.body) return res.status(400).send('Please use request-body')
  try {
    const { user_id, id, social_media } = req.body
    if (!user_id) return res.status(400).send('User ID is required')
    if (!id) return res.status(400).send('ID is required')

    const user = await prisma.user.findUnique({
      where: { user_id }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const article = await prisma.article.findUnique({
      where: { article_id: id }
    })
    if (article) {
      await prisma.share.create({
        data: {
          user_id,
          article_id: id,
          topic_id: article.topic_id,
          social_media
        }
      })

      res.status(201).json({ id, message: 'Share added successfully' })
    } else {
      const topicExists = await prisma.topic.findUnique({
        where: { topic_id: id }
      })

      if (!topicExists) {
        return res.status(404).json({ error: 'Id does not exist' })
      }
      await prisma.share.create({
        data: {
          user_id,
          article_id: null,
          topic_id: id,
          social_media
        }
      })
      res.status(201).json({ id, message: 'Share added successfully' })
    }
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: 'Error adding interaction' })
  }
}

module.exports = {
  addShare
}
