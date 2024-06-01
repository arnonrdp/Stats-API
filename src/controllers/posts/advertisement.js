const { PrismaClient } = require('@prisma/client')
const RedisClient = require('../../redis')
const prisma = new PrismaClient()

const createAd = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).json({ error: 'Please use request body' })
    }
    const { user_id, title, content, budget, duration, ad_id } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!title) return res.status(400).json({ error: 'title is required' })
    if (!content) return res.status(400).json({ error: 'content is required' })
    if (!ad_id) return res.status(400).json({ error: 'ad_id is required' })

    const user = await prisma.user.findUnique({
      where: { user_id }
    })
    if (!user) return res.status(400).json({ message: 'User Not Found!' })

    const newAdData = {
      user_id,
      title,
      content,
      ad_id,
      budget,
      duration
    }
    // REDIS
    const cachedAds = await RedisClient.get('ads')
    if (cachedAds) {
      const advertisements = JSON.parse(cachedAds)
      // If cached articles exist search for current ad_id
      const adExists = advertisements.find((ad) => ad.ad_id === ad_id)
      console.log('Returned Cached ad, ad_id:', ad_id)

      if (adExists) {
        // If found current ad return
        return res.json(adExists)
      } else {
        // If ad not found in cache add it
        advertisements.push(newAdData)
        await RedisClient.set('ads', JSON.stringify(advertisements))
        console.log('Added new AD to Redis, ad_id:', ad_id)
      }
    } else {
      // If no cache exists, create a new one
      await RedisClient.set('ads', JSON.stringify([newAdData]))
      console.log('Added ad to Redis cache')
    }
    // --------------------
    // DB
    const existingAd = await prisma.advertisement.findUnique({
      where: { ad_id }
    })

    if (existingAd) {
      res.json(existingAd)
    } else {
      const newAd = await prisma.advertisement.create({
        data: newAdData
      })
      res.status(201).json({ id: newAd.ad_id, message: 'Advertisement added successfully' })
    }
  } catch (e) {
    console.error('Error adding ad:', e)
    res.status(500).json({ error: 'Error creating ad' })
  }
}

module.exports = { createAd }
