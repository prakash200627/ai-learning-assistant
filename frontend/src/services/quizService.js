import API from './api'

export const generateQuiz = async (documentId, count = 5, title = '') => {
    const response = await API.post(`/quizzes/generate/${documentId}`, { count, title })
    return response.data
}

export const getQuizzes = async (documentId) => {
    const response = await API.get(`/quizzes/document/${documentId}`)
    return response.data
}

export const getQuiz = async (id) => {
    const response = await API.get(`/quizzes/${id}`)
    return response.data
}

export const submitQuiz = async (id, userAnswers) => {
    const response = await API.post(`/quizzes/${id}/submit`, { userAnswers })
    return response.data
}

export const deleteQuiz = async (id) => {
    const response = await API.delete(`/quizzes/${id}`)
    return response.data
}
