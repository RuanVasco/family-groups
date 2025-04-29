import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import { toast } from 'react-toastify';

interface AuthContextProps {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const login = (token: string) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        setIsLoading(false);
        toast.success('Login realizado com sucesso!');
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setIsLoading(false);
        navigate('/login');
    };

    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                logout();
                return;
            }

            try {
                const response = await axiosInstance.get('/auth/validate', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 200 || response.status === 201) {
                    setIsAuthenticated(true);
                } else {
                    logout();
                }
            } catch (error) {
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        validateToken();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
