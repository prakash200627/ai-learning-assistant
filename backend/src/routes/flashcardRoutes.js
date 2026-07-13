import express from 'express'
import { 
    generateFlashcardsForDocument, 
    getFlashcardsByDocument, 
    deleteFlashcard, 
    toggleStarFlashcard,
    getAllFlashcardSets,
    deleteFlashcardSet
} from '../controllers/flashcardController.js'
import protect from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

router.post('/generate/:documentId', generateFlashcardsForDocument)
router.get('/document/:documentId', getFlashcardsByDocument)
router.get('/all', getAllFlashcardSets)
router.delete('/set/:setId', deleteFlashcardSet)
router.put('/:id/star', toggleStarFlashcard)
router.delete('/:id', deleteFlashcard)

export default router
