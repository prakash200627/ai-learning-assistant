import mongoose from 'mongoose'

const flashcardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    cards: [{
        question: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: "medium"
        },
        lastReviewed: {
            type: Date,
            default: null
        },
        reviewCount: {
            type: Number,
            default: 0
        },
        isStarred: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
})

flashcardSchema.index({ userId: 1, documentId: 1 })

import { getMockModel, wrapInstance, generateId } from '../utils/localDBHelper.js'

const originalFlashcard = mongoose.model('Flashcard', flashcardSchema)
const Flashcard = new Proxy(originalFlashcard, {
    get(target, prop) {
        if (mongoose.connection.readyState !== 1) {
            const mockModel = getMockModel('flashcards')
            return mockModel[prop]
        }
        return target[prop]
    },
    construct(target, args) {
        if (mongoose.connection.readyState !== 1) {
            const data = args[0] || {}
            return wrapInstance('flashcards', {
                _id: generateId(),
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }
        return new target(...args)
    }
})

export default Flashcard
