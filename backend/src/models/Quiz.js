import mongoose from 'mongoose'

const quizSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true,
        trim: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true,
            validate: [array => array.length === 4, "must have exactly 4 options"]
        },
        correctAnswer: {
            type: String,
            required: true
        },
        explanation: {
            type: String,
            default: ""
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        }
    }],
    userAnswers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        selectAnswer: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        },
        answeredAt: {
            type: Date,
            default: Date.now
        }
    }
    ],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

quizSchema.index({ userId: 1, documentId: 1 })
import { getMockModel, wrapInstance, generateId } from '../utils/localDBHelper.js'

const originalQuiz = mongoose.model('Quiz', quizSchema)
const Quiz = new Proxy(originalQuiz, {
    get(target, prop) {
        if (mongoose.connection.readyState !== 1) {
            const mockModel = getMockModel('quizzes')
            return mockModel[prop]
        }
        return target[prop]
    },
    construct(target, args) {
        if (mongoose.connection.readyState !== 1) {
            const data = args[0] || {}
            return wrapInstance('quizzes', {
                _id: generateId(),
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }
        return new target(...args)
    }
})

export default Quiz
