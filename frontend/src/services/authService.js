import API from './api'

export const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password })
    if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
}

export const register = async (username, email, password) => {
    const response = await API.post('/auth/register', { username, email, password })
    if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
    }
    return response.data
}

export const getProfile = async () => {
    const response = await API.get('/auth/profile')
    return response.data
}

export const updateProfile = async (profileData) => {
    const response = await API.put('/auth/profile', profileData)
    if (response.data.success && response.data.data) {
        localStorage.setItem('user', JSON.stringify(response.data.data))
    }
    return response.data
}

export const changePassword = async (currentPassword, newPassword) => {
    const response = await API.post('/auth/change-password', { currentPassword, newPassword })
    return response.data
}

export const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
}

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
        try {
            return JSON.parse(userStr)
        } catch (e) {
            return null
        }
    }
    return null
}
