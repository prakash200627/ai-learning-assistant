import ChatHistory from '../models/ChatHistory.js'
import Document from '../models/Document.js'
import { chatWithDocument } from '../utils/groqService.js'
import { findRelevantChunks } from '../utils/textChunker.js'

export const sendChatMessage = async (req, res, next) => {
    try {
        const { message } = req.body
        const { documentId } = req.params

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Message is required',
                statusCode: 400
            })
        }

        const document = await Document.findOne({ _id: documentId, user: req.user._id })
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        // 1. Find relevant chunks using the word-scoring search algorithm (RAG context)
        const relevantChunks = findRelevantChunks(document.chunks || [], message, 3)
        const context = relevantChunks.map(c => c.content).join('\n\n')

        // 2. Fetch existing chat history for this user and document
        let chatRecord = await ChatHistory.findOne({ userId: req.user._id, documentId })
        if (!chatRecord) {
            chatRecord = await ChatHistory.create({
                userId: req.user._id,
                documentId,
                message: []
            })
        }

        // Format history for the Groq API call
        const apiHistory = chatRecord.message.map(msg => ({
            role: msg.role,
            content: msg.content
        }))

        // 3. Generate response using Groq AI
        const reply = await chatWithDocument(context || document.extractedText, message, apiHistory)

        // 4. Save both the query and response in the database chatHistory messages array
        chatRecord.message.push({
            role: 'user',
            content: message,
            timestamp: new Date(),
            relevantChunks: relevantChunks.map(c => c.chunkIndex)
        })

        chatRecord.message.push({
            role: 'assistant',
            content: reply,
            timestamp: new Date()
        })

        await chatRecord.save()

        res.status(200).json({
            success: true,
            reply,
            chatRecord
        })
    } catch (error) {
        next(error)
    }
}

export const getChatHistory = async (req, res, next) => {
    try {
        const chatRecord = await ChatHistory.findOne({ userId: req.user._id, documentId: req.params.documentId })
        res.status(200).json({
            success: true,
            chatLogs: chatRecord ? chatRecord.message : []
        })
    } catch (error) {
        next(error)
    }
}

export const clearChatHistory = async (req, res, next) => {
    try {
        await ChatHistory.deleteOne({ userId: req.user._id, documentId: req.params.documentId })
        res.status(200).json({
            success: true,
            message: 'Chat history cleared successfully'
        })
    } catch (error) {
        next(error)
    }
}
