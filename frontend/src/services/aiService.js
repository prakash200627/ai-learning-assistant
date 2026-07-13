import API from './api'

export const sendChatMessage = async (documentId, message) => {
    const response = await API.post(`/ai/chat/${documentId}`, { message })
    return response.data
}

export const getChatHistory = async (documentId) => {
    const response = await API.get(`/ai/chat/history/${documentId}`)
    return response.data
}

export const clearChatHistory = async (documentId) => {
    const response = await API.delete(`/ai/chat/history/${documentId}`)
    return response.data
}
