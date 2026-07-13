import express from 'express'
import { 
    generateQuizForDocument, 
    getQuizzesByDocument, 
    getQuizById, 
    submitQuizResult, 
    deleteQuiz 
} from '../controllers/quizController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.post('/generate/:documentId', generateQuizForDocument)
router.get('/document/:documentId', getQuizzesByDocument)
router.get('/:id', getQuizById)
router.post('/:id/submit', submitQuizResult)
router.delete('/:id', deleteQuiz)

export default router
