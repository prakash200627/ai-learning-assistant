import fs from 'fs'
import path from 'path'
import Document from '../models/Document.js'
import Flashcard from '../models/Flashcard.js'
import Quiz from '../models/Quiz.js'
import { extractTextFromPDF } from '../utils/pdfParser.js'
import { chunkText } from '../utils/textChunker.js'
import { generateSummary, generateExplanation } from '../utils/groqService.js'
import { uploadDir } from '../config/multer.js'

export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF document',
                statusCode: 400
            })
        }

        const filePath = req.file.path
        const fileName = req.file.filename
        const title = req.body.title || req.file.originalname

        // Extract PDF text
        let pdfData
        try {
            pdfData = await extractTextFromPDF(filePath)
        } catch (err) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            return res.status(400).json({
                success: false,
                error: 'Could not extract text from the PDF file',
                statusCode: 400
            })
        }

        const { text, numPages } = pdfData
        if (!text || text.trim() === '') {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            return res.status(400).json({
                success: false,
                error: 'The uploaded PDF appears to have no extractable text.',
                statusCode: 400
            })
        }

        // Chunk text for AI/RAG processing
        const chunks = chunkText(text, 500, 50)

        // Generate Summary and Explanations via Groq
        const summary = await generateSummary(text)
        const explainConcept = await generateExplanation(text)

        // Save document to DB
        const document = await Document.create({
            user: req.user._id,
            title,
            fileName,
            filePath: `/uploads/${fileName}`,
            fileSize: req.file.size,
            extractedText: text,
            chunks,
            summary,
            explainConcept,
            status: 'ready'
        })

        res.status(201).json({
            success: true,
            document
        })
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
        }
        next(error)
    }
}

export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.find({ user: req.user._id })
            .select('-extractedText -chunks')
            .sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            documents
        })
    } catch (error) {
        next(error)
    }
}

export const getDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, user: req.user._id })
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        res.status(200).json({
            success: true,
            document
        })
    } catch (error) {
        next(error)
    }
}

export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({ _id: req.params.id, user: req.user._id })
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        // Delete physical file
        const fileFullPath = path.join(uploadDir, document.fileName)
        if (fs.existsSync(fileFullPath)) {
            fs.unlinkSync(fileFullPath)
        }

        // Delete document record
        await document.deleteOne()

        // Also clean up flashcards and quizzes associated with this document
        await Flashcard.deleteMany({ documentId: document._id, userId: req.user._id })
        await Quiz.deleteMany({ documentId: document._id, userId: req.user._id })

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}

export const updateDocument = async (req, res, next) => {
    try {
        const { title } = req.body
        const document = await Document.findOne({ _id: req.params.id, user: req.user._id })
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        if (title) {
            document.title = title
        }

        await document.save()

        res.status(200).json({
            success: true,
            document,
            message: "Document updated successfully"
        })
    } catch (error) {
        next(error)
    }
}
