const pool = require('../db')
const { validationResult } = require('express-validator')

// Route to add a new stat to the 'stats' table
const create = async (req, res) => {
  const client = await pool.connect() // Connect to the database

  try {
    await client.query('BEGIN') // Start a transaction

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { user_id, post_id, clicks, keypresses, mousemovements, scrolls, totaltime } = req.body // Get the title and content from the request body

    const insertQuery = `
      INSERT INTO stats (created_at, user_id, post_id, clicks, keypresses, mousemovements, scrolls, totaltime)
      VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `

    const result = await client.query(insertQuery, [user_id, post_id, clicks, keypresses, mousemovements, scrolls, totaltime])
    const { id } = result.rows[0]

    await client.query('COMMIT') // Commit the transaction

    res.status(201).json({ id, message: 'Stats added successfully' })
  } catch (error) {
    await client.query('ROLLBACK') // Rollback the transaction if an error occurred

    console.error('Error adding stat:', error)
    res.status(500).json({ error: 'Error adding stat' })
  } finally {
    client.release() // Release the connection to the database
  }
}

module.exports = {
  create
}
