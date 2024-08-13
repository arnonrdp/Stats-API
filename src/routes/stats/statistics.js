const express = require('express')
const router = express.Router()
const statsController = require('../../controllers/stats/statistics')

router.post('/stats', statsController.updateStats)
router.get('/stats', statsController.getAllStats)
router.get('/stats/post', statsController.getPostStats)
router.get('/stats/users-locations', statsController.getUsersLocations)
router.get('/stats/metrics', statsController.getMetricsByCountry)

module.exports = router
