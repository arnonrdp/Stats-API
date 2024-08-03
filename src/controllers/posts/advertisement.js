const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const createAd = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json({ error: 'Please use request body' })
      return
    }

    const { user_id, title, content, budget, duration, ad_id } = req.body
    if (!user_id || !title || !content || !ad_id) {
      console.error('Missing required fields')
      return res.status(400).json({ error: 'user_id, title, content, and ad_id are required' })
    }

    const user = await prisma.user.findUnique({
      where: { user_id }
    })
    if (!user) {
      return res.status(400).json({ message: 'User Not Found!' })
    }

    const newAdData = {
      user_id,
      title,
      content,
      ad_id,
      budget: Number(budget),
      duration
    }

    const statData = {
      user_id,
      ad_id: newAdData.ad_id,
      clicks: 0,
      keypresses: 0,
      mouseMovements: 0,
      scrolls: 0,
      totalTime: 0
    }

    // Check if ad exists in the database
    const existingAd = await prisma.advertisement.findUnique({
      where: { ad_id }
    })

    if (existingAd) {
      res.json(existingAd)
    } else {
      // Add new ad to the database
      const newAd = await prisma.advertisement.create({
        data: newAdData
      })
      const stat = await prisma.stat.create({ data: statData })
      console.log(`New ad added to DB. Ad_id: ${newAd.ad_id}, stats id: ${stat.id}`)
      res.status(201).json({ id: newAd.ad_id, message: 'Advertisement added successfully' })
    }
  } catch (e) {
    console.error('Error adding ad:', e)
    res.status(500).json({ error: 'Error creating ad' })
  }
}

module.exports = { createAd }
