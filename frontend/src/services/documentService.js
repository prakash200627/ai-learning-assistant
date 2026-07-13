import API from './api'

export const uploadDocument = async (formData, onUploadProgress) => {
    const response = await API.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
    })
    return response.data
}

export const getDocuments = async () => {
    const response = await API.get('/documents')
    return response.data
}

export const getDocument = async (id) => {
    const response = await API.get(`/documents/${id}`)
    return response.data
}

export const deleteDocument = async (id) => {
    const response = await API.delete(`/documents/${id}`)
    return response.data
}

export const updateDocument = async (id, title) => {
    const response = await API.put(`/documents/${id}`, { title })
    return response.data
}
