const { PrismaClient } = require('@prisma/client')
const RedisClient = require('../../redis')

const prisma = new PrismaClient()

const updateUser = async (req, res) => {
  try {
    const { user_id } = req.query
    const { name, bio, facebook, instagram, linkedin, twitter, ethAddress, image } = req.body
    if (!user_id) return res.status(400).json({ error: 'User ID is required' })

    const userExists = await prisma.user.findUnique({
      where: {
        id: Number(user_id)
      }
    })

    if (!userExists) return res.status(400).json({ error: 'User does not exist' })

    const updateUser = await prisma.user.update({
      where: {
        id: Number(user_id)
      },
      data: {
        name: name,
        bio: bio,
        facebook: facebook,
        instagram: instagram,
        linkedin: linkedin,
        twitter: twitter,
        ethAddress: ethAddress,
        image: image
      }
    })

    res.status(201).json({ id: user_id, message: 'User updated successfully', user: updateUser })
  } catch (e) {
    console.error('Error updating user:', e)
    res.status(500).json({ error: 'Error updating user' })
  }
}

const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.query
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    const user = await prisma.user.findUnique({
      where: { user_id }
    })

    if (!user) return res.status(400).json({ error: 'User not found' })
    await prisma.user.delete({ where: { user_id } })
    return res.status(200).json({ message: 'User and all user related data deleted successfully' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error deleting user' })
  }
}

const addUser = async (req, res) => {
  try {
    const { user_id, location } = req.body
    if (!user_id) return res.status(400).send('User ID is required')
    const userData = {
      user_id,
      location
    }

    const cachedUsers = await RedisClient.get('users')
    if (cachedUsers) {
      const users = JSON.parse(cachedUsers)
      // If cached articles exist search for current article_id
      const userExists = users.find((user) => user.user_id === user_id)
      console.log('Returned Cached User, user_id:', user_id)

      if (userExists) {
        // If found current user return
        return res.json({ user_id })
      } else {
        // If user not found in cache add it
        users.push(userData)
        await RedisClient.set('users', JSON.stringify(users))
        console.log('Added new user to Redis, user_id:', user_id)
      }
    } else {
      // If no cache exists, create a new one
      await RedisClient.set('users', JSON.stringify([userData]))
      console.log('Added users to Redis cache')
    }

    // DB
    const existingUser = await prisma.user.findUnique({
      where: { user_id }
    })

    if (existingUser) {
      res.json({ user_id })
    } else {
      const newUser = await prisma.user.create({
        data: userData
      })
      res.status(201).json({ id: newUser.user_id, message: 'User created successfully' })
    }
    // --------------------
  } catch (e) {
    console.error('Error creating user:', e)
    res.status(500).json({ error: 'Error creating user' })
  }
}

const getAllUsers = async (req, res) => {
  try {
    const cachedUsers = await RedisClient.get('users')
    if (cachedUsers?.length > 2) {
      console.log('Returned Cached Users List')
      return res.json({ response: 'OK', usersList: JSON.parse(cachedUsers) })
    }
    const usersList = await prisma.user.findMany()
    if (!usersList) return res.status(404).json({ error: 'User list is empty' })
    await RedisClient.set('users', JSON.stringify(usersList))
    console.log('Created users list in Redis')
    res.status(200).json({ response: 'OK', usersList: usersList })
  } catch (e) {
    console.error('Error getting users', e)
    return res.status(500).json({ error: 'Error getting users' })
  }
}

const getUserById = async (req, res) => {
  try {
    const { user_id } = req.query
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    const user = await prisma.user.findUnique({
      where: { user_id }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })
    // const { password, ...userData } = user
    res.status(200).json(user)
  } catch (e) {
    console.error('Error getting user:', e)
  }
}

const getUsersPosts = async (req, res) => {
  try {
    const { user_id } = req.query
    if (!user_id) return res.status(400).json({ error: 'User ID is required' })
    const user = await prisma.user.findUnique({ where: { user_id } })
    if (!user) return res.status(404).json({ error: 'User does not exist' })

    const { postType } = req.params
    if (postType !== 'topics' && postType !== 'articles') return res.status(400).json({ error: 'Post type is required' })

    if (postType === 'topics') {
      const usersTopics = await prisma.topic.findMany({
        where: { user_id }
      })

      res.status(200).json(usersTopics)
    } else {
      const userArticles = await prisma.article.findMany({
        where: { user_id }
      })
      res.status(200).json(userArticles)
    }
  } catch (e) {
    console.log(e)
    return res.status(400).json({ error: '' })
  }
}

// TO USE ONLY ON FIRST INTEGRATION, TO COMMENT AFTER USAGE FOR SECURITY
const clearDatabase = async (req, res) => {
  try {
    await prisma.user.deleteMany()
    await RedisClient.flushDb()
    res.status(200).json({ response: 'DB cleared' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error cleaning users table' })
  }
}

const addAllUsersToDB = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body required' })
    }
    // Expecting an array of users in the request body
    const newUsers = await req.body
    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      return res.status(400).json({ error: 'Request body should contain an array of users' })
    }

    // Retrieve users from Redis
    const cachedUsers = await RedisClient.get('users')

    if (cachedUsers) {
      // If cache exists, overwrite it with the new list
      await RedisClient.set('users', JSON.stringify(newUsers))
      console.log('Overwritten Redis cache with new users')
    } else {
      // If no cache exists, create a new one
      await RedisClient.set('users', JSON.stringify(newUsers))
      console.log('Added users to Redis cache')
    }

    // Collect users to be added to the database
    const userRecordsToCreate = []
    for (const user of newUsers) {
      const { user_id, location } = user
      const existingUser = await prisma.user.findUnique({ where: { user_id } })

      if (!existingUser) {
        userRecordsToCreate.push({ user_id, location })
      }
    }

    // Add users to the database if there are new users
    if (userRecordsToCreate.length > 0) {
      await prisma.$transaction(async (prisma) => {
        await prisma.user.createMany({
          data: userRecordsToCreate,
          skipDuplicates: true
        })
      })

      res.status(201).json({ message: `${userRecordsToCreate.length} users created successfully` })
    } else {
      res.send('All users already exist in the database')
    }
  } catch (e) {
    console.error('Error adding users to database:', e)
    res.status(500).json({ error: 'Error adding users to database' })
  }
}

module.exports = {
  addUser,
  updateUser,
  deleteUser,
  getUserById,
  getAllUsers,
  getUsersPosts,
  addAllUsersToDB,
  clearDatabase
}
