import { createContext, useContext, ReactNode } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../axiosInstance';

interface AuthorizationContextProps {
    hasPermission: (type: string) => Promise<boolean>;
}

const AuthorizationContext = createContext<AuthorizationContextProps | undefined>(undefined);

export const AuthorizationProvider = ({ children }: { children: ReactNode }) => {
    const hasPermission = async (type: string): Promise<boolean> => {
        try {
            const response = await axiosInstance.get('/authorization/has-permission', {
                params: { item: type },
            });

            if (response.status === 200 || response.status === 201) {
                return response.data === true;
            }

            return false;
        } catch (error) {
            toast.error('Erro ao verificar permissão');
            return false;
        }
    };

    return (
        <AuthorizationContext.Provider value={{ hasPermission }}>
            {children}
        </AuthorizationContext.Provider>
    );
};

export const useAuthorization = () => {
    const context = useContext(AuthorizationContext);
    if (!context) throw new Error('useAuthorization must be used within AuthorizationProvider');
    return context;
};
