import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { toast } from 'react-toastify';
import api from '../axiosInstance';
import logo from '../assets/logo_verde.png';

const LoginPage = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault(); // impede reload do form
        setLoading(true);
        try {
            const response = await api.post('/auth/login', {
                username,
                password,
            });

            const token = response.data.token;
            login(token);
        } catch (error) {
            console.error('Erro no login', error);
            toast.error('Usuário ou senha inválidos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#01634a" }}>
            <form
                onSubmit={handleLogin}
                className="card shadow p-4"
                style={{ maxWidth: "400px", width: "100%" }}
            >
                <div className="d-flex justify-content-center mb-3">
                    <img src={logo} alt="Logo" style={{ maxWidth: "180px" }} />
                </div>

                <div className="mb-3">
                    <label htmlFor="username" className="form-label">Usuário</label>
                    <input
                        type="text"
                        id="username"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Digite seu usuário"
                        autoComplete="username"
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Senha</label>
                    <input
                        type="password"
                        id="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                >
                    {loading ? "Entrando..." : "Entrar"}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
