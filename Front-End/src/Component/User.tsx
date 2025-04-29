import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";
import { UserType } from "../Type/UserType";
import { FaPlus } from "react-icons/fa6";
import { Modal, Button } from "react-bootstrap";
import Select from 'react-select';

const User = () => {
    const [users, setUsers] = useState<UserType[]>([]);

    const [currentUser, setCurrentUser] = useState<Partial<UserType> | null>(null);
    const [modalMode, setModalMode] = useState<string>("");
    const [show, setShow] = useState(false);

    const roleOptions = [
        { value: 'ROLE_ADMIN', label: 'Administrador' },
        { value: 'ROLE_TECHNICIAN', label: 'Técnico' }
    ];

    const handleClose = () => setShow(false);

    const handleModalShow = (mode: string) => {
        setModalMode(mode);

        if (mode === "create") {
            setCurrentUser(null);
        }

        setShow(true);
    };

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get("/user");
            if (res.status === 200 || res.status === 201) {
                setUsers(res.data);
            }
        } catch (error) {
            toast.error('Erro ao buscar usuários');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (field: string, value: any) => {
        setCurrentUser(prev => ({
            ...prev,
            [field]: value,
        }));
    }

    const handleSubmit = async () => {
        if (!currentUser) {
            return;
        }

        if (!currentUser.username || !currentUser.roles?.length) {
            toast.warning("Preencha o nome de usuário e selecione ao menos um perfil.");
            return;
        }

        try {
            let res;

            if (modalMode === "create") {
                res = await axiosInstance.post("/auth/register", currentUser);

            } else {
                res = await axiosInstance.put(`/user/${currentUser?.id}`, currentUser);
            }

            if (res.status === 200 || res.status === 201) {
                setCurrentUser(null);
                fetchUsers();

                toast.success(
                    modalMode === "create"
                        ? "Usuário criado com sucesso!"
                        : "Usuário atualizado com sucesso!"
                );
            }
        } catch (error) {
            toast.error('Erro ao criar usuário');
        } finally {
            handleClose();
        }
    }

    return (
        <div className="container-fluid">
            <div className="mt-3">
                <button
                    type="button"
                    className="btn-create full_rounded"
                    onClick={() => handleModalShow("create")}
                >
                    <FaPlus /> Criar Usuário
                </button>
            </div>

            <table className="custom_table striped">
                <thead>
                    <tr>
                        <th>Ações</th>
                        <th>Usuário</th>
                        <th>Perfis</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <button
                                    className="btn btn-small btn-warning"
                                    onClick={() => {
                                        const selectedUser = {
                                            ...user,
                                            password: "",
                                        };
                                        setCurrentUser(selectedUser);
                                        handleModalShow("edit");
                                    }}
                                >
                                    Editar
                                </button>
                            </td>
                            <td>{user.username}</td>
                            <td>{user.roles.join(", ")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === "create" ? "Criar Usuário" : "Editar Usuário"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <label className="form-label">Nome de Usuário</label>
                        <input
                            type="text"
                            className="form-control"
                            value={currentUser?.username || ""}
                            onChange={(e) => handleChange("username", e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            value={currentUser?.password || ""}
                            onChange={(e) => handleChange("password", e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Perfis</label>
                        <Select
                            isMulti
                            options={roleOptions}
                            value={roleOptions.filter(opt => currentUser?.roles?.includes(opt.value))}
                            onChange={(selectedOptions) =>
                                handleChange('roles', selectedOptions.map(opt => opt.value))
                            }
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Selecione perfis"
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                    >
                        {modalMode === "create" ? "Criar" : "Atualizar"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default User;
