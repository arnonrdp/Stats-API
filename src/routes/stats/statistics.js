const express = require('express')
const router = express.Router()
const statsController = require('../../controllers/stats/statistics')

const app = express()
router.post('/stats', statsController.create)
router.get('/stats', statsController.getAllStats)
router.get('/stats/article', app.use(express.json()), statsController.getArticleStats)
router.get('/stats/users-locations', statsController.getUsersLocations)
router.get('/stats/metrics', statsController.getMetricsByCountry)

module.exports = router
