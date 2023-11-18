const pool = require('../db')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const { secret } = require('../middlewares/jwtConfig')

// Route to create or remove a like for a poem
const createOrRemove = async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN') // Start a transaction

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const authorizationHeader = req.headers.authorization // Get the Authorization header from the request

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Bearer token not provided' })
    }

    const { poem_id } = req.params // Get poem_id from the route parameters

    const parts = req.path.split('/')
    const type = parts[parts.length - 1] // Get type (like or dislike) from the route path (/like or /dislike)
    const isLike = type === 'like'

    const token = authorizationHeader.split(' ')[1] // Extract the token (remove "Bearer " prefix)
    const decoded = jwt.verify(token, secret) // Verify and decode the JWT token
    const userId = decoded.id // Get the user ID from the decoded JWT token

    // Check if the user has already reacted to the poem
    const checkReactionQuery = `
      SELECT id, is_like FROM likes
      WHERE user_id = $1 AND poem_id = $2
    `

    const checkResult = await client.query(checkReactionQuery, [userId, poem_id])

    if (checkResult.rows.length > 0) {
      // User has already reacted to the poem, determine the boolean value of the current reaction
      const currentReaction = checkResult.rows[0]
      const currentType = currentReaction.is_like // true, false or null

      if (currentType === isLike) {
        // Remove the reaction from the database
        const updateQuery = `
          UPDATE likes
          SET is_like = NULL
          WHERE id = $1
        `

        await client.query(updateQuery, [currentReaction.id])

        await client.query('COMMIT') // Commit the transaction

        res.status(201).json({ message: `${type} removed successfully` })
      } else {
        // Set the reaction to the new value (true or false)
        const updateQuery = `
          UPDATE likes
          SET is_like = $1
          WHERE id = $2
        `

        await client.query(updateQuery, [isLike, currentReaction.id])

        await client.query('COMMIT') // Commit the transaction

        res.status(201).json({ message: `Reaction toggled to ${type} successfully` })
      }
    } else {
      // User has not reacted to the poem, create a new entry in likes table
      const insertQuery = `
        INSERT INTO likes (user_id, poem_id, is_like, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id;
      `

      const result = await client.query(insertQuery, [userId, poem_id, isLike])
      const { id } = result.rows[0]

      await client.query('COMMIT') // Commit the transaction

      res.status(201).json({ id, message: `${type} added successfully` })
    }
  } catch (error) {
    await client.query('ROLLBACK') // Rollback the transaction if an error occurred

    console.error('Error:', error)
    res.status(500).json({ error: 'Error' })
  } finally {
    client.release() // Release the connection to the database
  }
}

module.exports = {
  createOrRemove
}
