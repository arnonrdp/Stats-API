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

    const { user_id, post_id, clicks, keypresses, mousemovements, scrolls, totaltime } = req.body // Get the data from the request body

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

// Route to get all stats from the 'stats' table
const read = async (req, res) => {
  const client = await pool.connect() // Connect to the database

  try {
    const { post_id } = req.query // Get the post_id from the request query

    let selectQuery = `
      SELECT *
      FROM stats
    `

    if (post_id) {
      selectQuery += `WHERE post_id = '${post_id}'`
    }

    const result = await client.query(selectQuery)

    if (result.rows.length > 0) {
      res.status(200).json(result.rows)
    } else {
      res.status(404).json({ error: 'No stats found' })
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    res.status(500).json({ error: 'Error getting stats' })
  } finally {
    client.release() // Release the connection to the database
  }
}

module.exports = {
  create,
  read
}
