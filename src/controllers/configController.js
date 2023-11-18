const pool = require('../db')
require('dotenv').config()

// Route to create the 'stats' table
const createTable = async (req, res) => {
  try {
    const client = await pool.connect()

    const createStatsTableQuery = `
      CREATE TABLE IF NOT EXISTS stats (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW(),
        user_id VARCHAR(255) NOT NULL,
        post_id VARCHAR(255) NOT NULL,
        clicks INT DEFAULT 0,
        keypresses INT DEFAULT 0,
        mouseMovements INT DEFAULT 0,
        scrolls INT DEFAULT 0,
        totalTime INT DEFAULT 0
      );
    `

    await client.query(createStatsTableQuery)
    client.release()

    res.send('"stats" table created successfully')
  } catch (error) {
    console.error('Error creating table:', error)
    res.status(500).send('Error creating table')
  }
}

const listTables = async (req, res) => {
  try {
    const client = await pool.connect()

    // Query SQL to list all tables from the database
    const listTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public';
    `

    const result = await client.query(listTablesQuery)
    const tables = result.rows.map((row) => row.table_name)
    client.release()

    res.json(tables)
  } catch (error) {
    console.error('Error listing tables:', error)
    res.status(500).json({ error: 'Error listing tables' })
  }
}

const dropTable = async (req, res) => {
  try {
    const client = await pool.connect()

    // Query SQL to drop the 'stats' table
    const dropTableQuery = 'DROP TABLE IF EXISTS stats;'

    await client.query(dropTableQuery)
    client.release()

    res.send('"stats" table dropped successfully')
  } catch (error) {
    console.error('Error dropping table "stats":', error)
    res.status(500).send('Error dropping table "stats"')
  }
}

module.exports = {
  createTable,
  listTables,
  alterTable,
  dropTable
}
