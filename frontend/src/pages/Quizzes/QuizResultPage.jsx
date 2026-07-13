import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    Trophy,
    ArrowLeft,
    Check,
    X,
    Sparkles,
    BookOpen,
    Loader
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getQuiz } from '../../services/quizService'

const QuizResultPage = () => {
    const { quizId } = useParams()
    const navigate = useNavigate()

    const [quiz, setQuiz] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchQuizResults = async () => {
            try {
                const res = await getQuiz(quizId)
                if (res.success) {
                    setQuiz(res.quiz)
                } else {
                    toast.error('Quiz results not found')
                    navigate('/documents')
                }
            } catch (err) {
                toast.error('Failed to load quiz results')
                navigate('/documents')
            } finally {
                setLoading(false)
            }
        }
        fetchQuizResults()
    }, [quizId])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-(--text-light) gap-3">
                <Loader className="h-10 w-10 text-(--color-primary) animate-spin" />
                <span className="text-sm font-medium animate-pulse text-(--text-muted)">Retrieving quiz scorecard...</span>
            </div>
        )
    }

    const accuracy = Math.round((quiz.score / (quiz.totalQuestions || 1)) * 100)

    // Custom style classes based on performance
    const getGradeDetails = (score, total) => {
        const pct = (score / total) * 100
        if (pct >= 80) {
            return {
                label: 'Excellent Work!',
                desc: 'Outstanding performance! You have grasped the concepts from this study material exceptionally well.',
                cardBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-250',
                accuracyRing: 'stroke-emerald-600',
                scoreColor: 'text-emerald-700'
            }
        }
        if (pct >= 50) {
            return {
                label: 'Great Attempt!',
                desc: 'Good progress! A little more study time and practice quizzes will help solidify these core points.',
                cardBg: 'bg-amber-50 border-amber-200 text-amber-800',
                badgeBg: 'bg-amber-100 text-amber-700 border-amber-250',
                accuracyRing: 'stroke-amber-500',
                scoreColor: 'text-amber-700'
            }
        }
        return {
            label: 'Keep Reviewing!',
            desc: 'Don\'t give up! Use flashcards and the AI concept explainer to study the material and try again.',
            cardBg: 'bg-rose-50 border-rose-200 text-rose-800',
            badgeBg: 'bg-rose-100 text-rose-700 border-rose-250',
            accuracyRing: 'stroke-rose-500',
            scoreColor: 'text-rose-700'
        }
    }

    const grade = getGradeDetails(quiz.score, quiz.totalQuestions)

    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto text-left p-4 md:p-6 min-h-[calc(100vh-6rem)]">
            {/* Top Navigation */}
            <div className="flex items-center justify-between border-b border-(--border-color) pb-5 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                    <Link
                        to={`/documents/${quiz.documentId}`}
                        className="p-2.5 border border-(--border-color) hover:border-(--color-primary)/30 bg-(--card-bg-solid) rounded-2xl text-(--text-muted) hover:text-(--text-main) transition-colors shrink-0 shadow-2xs"
                    >
                        <ArrowLeft className="h-4.5 w-4.5" />
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-widest">WORKSPACE QUIZ RESULTS</span>
                        <h1 className="font-extrabold text-(--text-main) truncate text-lg md:text-xl mt-0.5">
                            {quiz.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Score Ring Summary Card */}
            <div className={`card surface-soft p-6 md:p-8 rounded-[28px] flex flex-col md:flex-row items-center gap-8 shadow-premium-hover transition-all ${grade.cardBg}`}>
                <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="stroke-(--border-color)"
                            strokeWidth="3.2"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                            className={`${grade.accuracyRing} transition-all duration-1000 ease-out`}
                            strokeWidth="3.2"
                            strokeDasharray={`${accuracy}, 100`}
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={`text-2xl font-black tracking-tight ${grade.scoreColor}`}>{accuracy}%</span>
                        <span className="text-[8px] text-(--text-light) font-extrabold uppercase tracking-wider mt-0.5">accuracy</span>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left flex flex-col gap-1.5 min-w-0">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full border w-fit mx-auto md:mx-0 ${grade.badgeBg}`}>
                        {grade.label}
                    </span>
                    <h2 className="text-xl md:text-2xl font-black text-(--text-main) mt-2">
                        Quiz Score: <span className={grade.scoreColor}>{quiz.score}</span> / {quiz.totalQuestions}
                    </h2>
                    <p className="text-(--text-muted) text-xs md:text-sm leading-relaxed max-w-xl font-medium">
                        {grade.desc}
                    </p>
                </div>

                <Link
                    to={`/documents/${quiz.documentId}`}
                    className="btn btn-primary self-center shadow-md font-bold text-xs shrink-0 w-full md:w-auto hover:scale-[1.01]"
                >
                    <BookOpen className="h-4.5 w-4.5 text-white" />
                    <span>Back to Workspace</span>
                </Link>
            </div>

            {/* Questions List */}
            <div className="flex flex-col gap-6">
                <h3 className="text-xs font-bold text-(--text-light) uppercase tracking-widest px-1">DETAILED QUESTION SCORECARD</h3>
                {quiz.questions.map((question, idx) => {
                    const userAnswerObj = quiz.userAnswers?.find(ua => ua.questionIndex === idx)
                    const userSelectedAnswer = userAnswerObj ? userAnswerObj.selectAnswer : ''
                    const isCorrect = userAnswerObj ? userAnswerObj.isCorrect : false

                    return (
                        <div
                            key={idx}
                            className={`card surface-soft rounded-[28px] p-6 md:p-8 flex flex-col gap-6 text-left border-l-4 shadow-premium-hover transition-all duration-300 ${isCorrect ? 'border-l-emerald-500 hover:border-l-emerald-600' : 'border-l-rose-500 hover:border-l-rose-600'
                                }`}
                        >
                            {/* Question Header */}
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 rounded-xl shrink-0 shadow-3xs border ${isCorrect ? 'bg-emerald-50 text-emerald-650 border-emerald-200' : 'bg-rose-50 text-rose-655 border-rose-200'
                                    }`}>
                                    {isCorrect ? <Check className="h-5 w-5 font-bold" /> : <X className="h-5 w-5 font-bold" />}
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-[10px] text-(--text-light) font-extrabold uppercase tracking-wider">QUESTION {idx + 1}</span>
                                    <p className="font-extrabold text-(--text-main) text-sm md:text-base leading-relaxed mt-1">
                                        {question.question}
                                    </p>
                                </div>
                            </div>

                            {/* Option selections Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-0 md:pl-14">
                                {question.options.map((option, oIdx) => {
                                    const wasUserChoice = userSelectedAnswer === option
                                    const isCorrectChoice = question.correctAnswer === option

                                    let optionStyle = 'border-(--border-color) bg-(--bg-canvas) text-(--text-muted)'
                                    let indicatorDot = 'border-(--border-color) text-transparent'

                                    if (wasUserChoice) {
                                        if (isCorrect) {
                                            optionStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-700 font-bold shadow-2xs'
                                            indicatorDot = 'bg-emerald-600 border-emerald-500 text-white'
                                        } else {
                                            optionStyle = 'border-rose-500 bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 font-bold shadow-2xs'
                                            indicatorDot = 'bg-rose-600 border-rose-550 text-white'
                                        }
                                    } else if (isCorrectChoice) {
                                        optionStyle = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/8 text-emerald-650 font-bold'
                                        indicatorDot = 'border-emerald-500 text-emerald-650'
                                    }

                                    return (
                                        <div
                                            key={oIdx}
                                            className={`px-4.5 py-3.5 rounded-xl text-xs flex items-center justify-between gap-3 border transition-all ${optionStyle}`}
                                        >
                                            <span className="truncate leading-relaxed">{option}</span>
                                            <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] ${indicatorDot}`}>
                                                {wasUserChoice && (isCorrect ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-white" />)}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* AI Explanation Callout */}
                            {question.explanation && (
                                <div className="pl-0 md:pl-14">
                                    <div className="bg-linear-to-r from-teal-50/40 to-blue-50/25 dark:from-teal-500/10 dark:to-blue-500/8 border border-teal-150/80 dark:border-teal-400/20 p-5 rounded-2xl flex gap-4 text-left relative overflow-hidden border-l-4 border-l-teal-600 shadow-2xs backdrop-blur-md">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full" />
                                        <div className="p-2.5 bg-teal-50 text-teal-650 rounded-xl h-fit shrink-0 border border-teal-200/50 shadow-3xs">
                                            <Sparkles className="h-5 w-5 animate-pulse text-teal-650" />
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0 z-10">
                                            <span className="text-[10px] text-teal-700 dark:text-teal-300 font-extrabold uppercase tracking-widest">AI CONCEPT EXPLANATION</span>
                                            <p className="text-(--text-muted) text-xs md:text-sm leading-relaxed mt-1 font-semibold font-sans">
                                                {question.explanation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default QuizResultPage