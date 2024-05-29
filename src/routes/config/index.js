const express = require('express')
const router = express.Router()
const configController = require('../../controllers/config')

router.get('/create-table', configController.createTable)
router.get('/list-tables', configController.listTables)
router.get('/drop-table', configController.dropTable)

module.exports = router
