import API from './api'

export const getStats = async () => {
    const response = await API.get('/dashboard/stats')
    return response.data
}
