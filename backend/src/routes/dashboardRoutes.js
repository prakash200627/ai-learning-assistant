import express from 'express'
import { getDashboardOverview } from '../controllers/dashboardController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.get('/stats', getDashboardOverview)

export default router
