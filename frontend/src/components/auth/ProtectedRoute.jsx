import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'

const ProtectedRoute = () => {
    const token = localStorage.getItem('token')
    const isAuthenticated = !!token

    return isAuthenticated ? (
        <AppLayout>
            <Outlet />
        </AppLayout>
    ) : (
        <Navigate to="/login" replace />
    )
}

export default ProtectedRoute