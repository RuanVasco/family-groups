import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import LoginPage from './Page/LoginPage';
import HomePage from './Page/HomePage';
import { JSX } from 'react';
import { ToastContainer } from 'react-toastify';
import { AuthorizationProvider } from './Context/AuthorizationContext';
import "./assets/styles/Components/_button.scss";

function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <>
            <Router>
                <AuthProvider>
                    <AuthorizationProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <HomePage />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </AuthorizationProvider>
                </AuthProvider>
            </Router>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </>
    );
}

export default App;
