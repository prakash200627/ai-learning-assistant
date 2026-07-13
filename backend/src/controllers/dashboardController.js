import Document from '../models/Document.js'
import Flashcard from '../models/Flashcard.js'
import Quiz from '../models/Quiz.js'

export const getDashboardOverview = async (req, res, next) => {
    try {
        const userId = req.user._id

        // 1. Total Documents
        const totalDocuments = await Document.countDocuments({ user: userId })

        // 2. Flashcards metrics
        const flashcardSets = await Flashcard.find({ userId })
        let totalFlashcards = 0
        let starredFlashcards = 0
        flashcardSets.forEach(set => {
            totalFlashcards += set.cards.length
            starredFlashcards += set.cards.filter(c => c.isStarred).length
        })

        // 3. Quiz metrics
        const quizzes = await Quiz.find({ userId })
        const totalQuizzes = quizzes.length
        const completedQuizzes = quizzes.filter(q => q.completedAt !== null).length
        
        let avgScorePercentage = 0
        if (completedQuizzes > 0) {
            const sumPercentage = quizzes
                .filter(q => q.completedAt !== null)
                .reduce((acc, q) => acc + (q.score / (q.totalQuestions || 1)) * 100, 0)
            avgScorePercentage = Math.round(sumPercentage / completedQuizzes)
        }

        // 4. Activity Feed construction
        // Fetch recent documents
        const recentDocs = await Document.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)

        // Fetch recent completed quizzes
        const recentQuizzes = await Quiz.find({ userId, completedAt: { $ne: null } })
            .sort({ completedAt: -1 })
            .limit(5)

        const activities = []

        recentDocs.forEach(doc => {
            activities.push({
                id: doc._id,
                type: 'document_upload',
                title: 'Document Uploaded',
                detail: `Uploaded "${doc.title}"`,
                date: doc.createdAt
            })
        })

        recentQuizzes.forEach(quiz => {
            activities.push({
                id: quiz._id,
                type: 'quiz_completed',
                title: 'Quiz Completed',
                detail: `Scored ${quiz.score}/${quiz.totalQuestions} on "${quiz.title}"`,
                date: quiz.completedAt
            })
        })

        // Sort all activities by date descending
        activities.sort((a, b) => new Date(b.date) - new Date(a.date))
        const recentActivity = activities.slice(0, 5)

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalDocuments,
                    totalFlashcards,
                    starredFlashcards,
                    totalQuizzes,
                    completedQuizzes,
                    avgScorePercentage
                },
                recentActivity
            }
        })
    } catch (error) {
        next(error)
    }
}
