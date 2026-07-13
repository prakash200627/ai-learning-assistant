import express from 'express'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../controllers/aiController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.post('/chat/:documentId', sendChatMessage)
router.get('/chat/history/:documentId', getChatHistory)
router.delete('/chat/history/:documentId', clearChatHistory)

export default router
