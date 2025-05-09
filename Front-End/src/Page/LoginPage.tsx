import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { toast } from 'react-toastify';
import api from '../axiosInstance';

const LoginPage = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const handleLogin = async () => {
        try {
            let response = await api.post('/auth/login', {
                username,
                password,
            });

            const token = response.data.token;
            login(token);
        } catch (error) {
            console.error('Erro no login', error);
            toast.error('Usuário ou senha inválidos');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Login</h2>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuário"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
            />
            <button className="btn btn-primary" onClick={handleLogin}>
                Entrar
            </button>
        </div>
    );
};

export default LoginPage;
