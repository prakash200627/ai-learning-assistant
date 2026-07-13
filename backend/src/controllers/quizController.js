import Quiz from '../models/Quiz.js'
import Document from '../models/Document.js'
import { generateQuiz } from '../utils/groqService.js'

export const generateQuizForDocument = async (req, res, next) => {
    try {
        const { count, title } = req.body
        const document = await Document.findOne({ _id: req.params.documentId, user: req.user._id })
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        const questionCount = parseInt(count) || 5
        const quizTitle = title || `Quiz on ${document.title}`

        // Call Groq AI service to generate quiz
        const generatedQuestions = await generateQuiz(document.extractedText, questionCount)

        const quiz = await Quiz.create({
            userId: req.user._id,
            documentId: document._id,
            title: quizTitle,
            questions: generatedQuestions.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || "No explanation provided.",
                difficulty: q.difficulty || "medium"
            })),
            totalQuestions: generatedQuestions.length,
            score: 0
        })

        res.status(201).json({
            success: true,
            quiz,
            message: "Quiz generated successfully"
        })
    } catch (error) {
        next(error)
    }
}

export const getQuizzesByDocument = async (req, res, next) => {
    try {
        const quizzes = await Quiz.find({ documentId: req.params.documentId, userId: req.user._id })
            .select('-questions.correctAnswer')
            .sort({ createdAt: -1 })
            
        res.status(200).json({
            success: true,
            quizzes
        })
    } catch (error) {
        next(error)
    }
}

export const getQuizById = async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id })
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            })
        }

        res.status(200).json({
            success: true,
            quiz
        })
    } catch (error) {
        next(error)
    }
}

export const submitQuizResult = async (req, res, next) => {
    try {
        const { userAnswers } = req.body // Array of option strings in order of questions
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id })

        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            })
        }

        if (!userAnswers || !Array.isArray(userAnswers)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing user answers',
                statusCode: 400
            })
        }

        let score = 0
        const totalQuestions = quiz.questions.length
        const answersList = quiz.questions.map((question, index) => {
            const rawSelected = userAnswers[index]
            const selected = (rawSelected && rawSelected.trim()) ? rawSelected.trim() : 'Not Answered'
            const isCorrect = question.correctAnswer.trim().toLowerCase() === selected.toLowerCase()
            if (isCorrect) score++
            
            return {
                questionIndex: index,
                selectAnswer: selected,
                isCorrect,
                answeredAt: new Date()
            }
        })

        // Update the quiz record directly
        quiz.userAnswers = answersList
        quiz.score = score
        quiz.completedAt = new Date()
        
        await quiz.save()

        res.status(200).json({
            success: true,
            score,
            totalQuestions,
            quiz,
            correctAnswers: quiz.questions.map(q => q.correctAnswer)
        })
    } catch (error) {
        next(error)
    }
}

export const deleteQuiz = async (req, res, next) => {
    try {
        const result = await Quiz.deleteOne({ _id: req.params.id, userId: req.user._id })
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found',
                statusCode: 404
            })
        }

        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully'
        })
    } catch (error) {
        next(error)
    }
}
