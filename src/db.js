const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.EXTERNAL_DB_URL,
  ssl: { rejectUnauthorized: false }
})

module.exports = pool
