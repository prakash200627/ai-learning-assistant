import Flashcard from '../models/Flashcard.js'
import Document from '../models/Document.js'
import { generateFlashcards } from '../utils/groqService.js'

export const generateFlashcardsForDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.documentId, user: req.user._id })
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        // Call Groq AI service to generate flashcards
        const generatedCards = await generateFlashcards(document.extractedText)

        const cardObjects = generatedCards.map(card => ({
            question: card.question,
            answer: card.answer,
            difficulty: 'medium',
            reviewCount: 0,
            isStarred: false
        }))

        // Always create a new flashcard set for multiple sets support
        const flashcardSet = await Flashcard.create({
            userId: req.user._id,
            documentId: document._id,
            cards: cardObjects
        })

        res.status(201).json({
            success: true,
            flashcardSet,
            message: "Flashcards generated successfully"
        })
    } catch (error) {
        next(error)
    }
}

export const getFlashcardsByDocument = async (req, res, next) => {
    try {
        const flashcardSets = await Flashcard.find({ userId: req.user._id, documentId: req.params.documentId }).sort({ createdAt: -1 })
        res.status(200).json({
            success: true,
            flashcardSets
        })
    } catch (error) {
        next(error)
    }
}

export const getAllFlashcardSets = async (req, res, next) => {
    try {
        const flashcardSets = await Flashcard.find({ userId: req.user._id })
            .populate('documentId', 'title')
            .sort({ createdAt: -1 })
        res.status(200).json({
            success: true,
            flashcardSets
        })
    } catch (error) {
        next(error)
    }
}

export const deleteFlashcardSet = async (req, res, next) => {
    try {
        const result = await Flashcard.deleteOne({ _id: req.params.setId, userId: req.user._id })
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found',
                statusCode: 404
            })
        }
        res.status(200).json({
            success: true,
            message: 'Flashcard set deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

export const deleteFlashcard = async (req, res, next) => {
    try {
        // Find the flashcard set containing this specific card ID
        const flashcardSet = await Flashcard.findOne({ "cards._id": req.params.id, userId: req.user._id })
        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found',
                statusCode: 404
            })
        }

        // Pull the subdocument card from the cards array
        flashcardSet.cards.pull(req.params.id)
        await flashcardSet.save()

        res.status(200).json({
            success: true,
            message: 'Flashcard deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

export const toggleStarFlashcard = async (req, res, next) => {
    try {
        const flashcardSet = await Flashcard.findOne({ "cards._id": req.params.id, userId: req.user._id })
        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found',
                statusCode: 404
            })
        }

        const card = flashcardSet.cards.id(req.params.id)
        card.isStarred = !card.isStarred
        await flashcardSet.save()

        res.status(200).json({
            success: true,
            card,
            message: card.isStarred ? 'Flashcard starred' : 'Flashcard unstarred'
        })
    } catch (error) {
        next(error)
    }
}

