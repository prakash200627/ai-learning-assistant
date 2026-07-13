import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, "Please provide a document title"],
        trim: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    extractedText: {
        type: String,
        default: ""
    },
    chunks: [{
        content: {
            type: String,
            required: true
        },
        pageNumber: {
            type: Number,
            default: 0
        },
        chunkIndex: {
            type: Number,
            required: true
        }
    }],
    uploadDate: {
        type: Date,
        default: Date.now
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    summary: {
        type: String,
        default: ""
    },
    explainConcept: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['processing', 'ready', 'failed'],
        default: 'processing'
    }
}, {
    timestamps: true
})

documentSchema.index({ user: 1, uploadDate: -1 })
import { getMockModel, wrapInstance, generateId } from '../utils/localDBHelper.js'

const originalDocument = mongoose.model('Document', documentSchema)
const Document = new Proxy(originalDocument, {
    get(target, prop) {
        if (mongoose.connection.readyState !== 1) {
            const mockModel = getMockModel('documents')
            return mockModel[prop]
        }
        return target[prop]
    },
    construct(target, args) {
        if (mongoose.connection.readyState !== 1) {
            const data = args[0] || {}
            return wrapInstance('documents', {
                _id: generateId(),
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }
        return new target(...args)
    }
})

export default Document
