import API from './api'

export const generateFlashcards = async (documentId) => {
    const response = await API.post(`/flashcards/generate/${documentId}`)
    return response.data
}

export const getFlashcards = async (documentId) => {
    const response = await API.get(`/flashcards/document/${documentId}`)
    return response.data
}

export const getAllFlashcardSets = async () => {
    const response = await API.get('/flashcards/all')
    return response.data
}

export const deleteFlashcardSet = async (setId) => {
    const response = await API.delete(`/flashcards/set/${setId}`)
    return response.data
}

export const toggleStarFlashcard = async (id) => {
    const response = await API.put(`/flashcards/${id}/star`)
    return response.data
}

export const deleteFlashcard = async (id) => {
    const response = await API.delete(`/flashcards/${id}`)
    return response.data
}
