import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";
import { UserType } from "../Type/UserType";
import { FaPen, FaPlus } from "react-icons/fa6";
import { Modal, Button, Form } from "react-bootstrap";
import Select from 'react-select';
import { BranchType } from "../Type/BranchType";

const User = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [branchs, setBranchs] = useState<BranchType[]>([]);

    const [currentUser, setCurrentUser] = useState<Partial<UserType> | null>(null);
    const [modalMode, setModalMode] = useState<string>("");
    const [show, setShow] = useState(false);

    const roleOptions = [
        { value: 'ROLE_ADMIN', label: 'Administrador' },
        { value: 'ROLE_TECHNICIAN', label: 'Técnico' }
    ];

    const handleClose = () => setShow(false);

    const handleModalShow = (mode: string) => {
        fetchBranchs();

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

    const fetchBranchs = async () => {
        try {
            const res = await axiosInstance.get("/branch");
            if (res.status === 200) {
                setBranchs(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar carteiras");
        }
    }

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

        if (!currentUser.username || !currentUser.roles?.length || !currentUser.name) {
            toast.warning("Preencha o nome de usuário e selecione ao menos um perfil.");
            return;
        }

        const data = {
            username: currentUser.username,
            name: currentUser.name,
            password: currentUser.password,
            roles: currentUser.roles,
            branchId: currentUser.branch?.id || ""
        }

        try {
            let res;

            if (modalMode === "create") {
                res = await axiosInstance.post("/auth/register", data);

            } else {
                res = await axiosInstance.put(`/user/${currentUser?.id}`, data);
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
            <div className="my-3 floating_panel">
                <button
                    type="button"
                    className="button_agree"
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
                        <th>Nome</th>
                        <th>Perfis</th>
                        <th>Carteira</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 && (
                        users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <button
                                        className="button_edit"
                                        onClick={() => {
                                            const selectedUser = {
                                                ...user,
                                                password: "",
                                            };
                                            setCurrentUser(selectedUser);
                                            handleModalShow("edit");
                                        }}
                                    >
                                        <FaPen />
                                        Editar
                                    </button>
                                </td>
                                <td>{user.username}</td>
                                <td>{user.name}</td>
                                <td>{user.roles.join(", ")}</td>
                                <td>{user.branch?.name || "Sem carteira vinculada"}</td>
                            </tr>
                        ))

                    )}
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
                        <label className="form-label" htmlFor="user">
                            Usuário <span className="required-asterisk">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            value={currentUser?.username || ""}
                            onChange={(e) => handleChange("username", e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Nome <span className="required-asterisk">*</span></label>
                        <input
                            type="text"
                            className="form-control"
                            value={currentUser?.name || ""}
                            onChange={(e) => handleChange("name", e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Senha <span className="required-asterisk">*</span></label>
                        <input
                            type="password"
                            className="form-control"
                            value={currentUser?.password || ""}
                            onChange={(e) => handleChange("password", e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Perfis <span className="required-asterisk">*</span></label>
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

                    <Form.Group className="mb-3">
                        <Form.Label>Carteira</Form.Label>
                        <Form.Select
                            value={currentUser?.branch?.id || ""}
                            onChange={(e) =>
                                setCurrentUser(prev => ({
                                    ...prev,
                                    branch: {
                                        id: Number(e.target.value),
                                        name: prev?.branch?.name || ""
                                    }
                                }))
                            }
                        >
                            <option value="">Selecione uma opção</option>
                            {Object.values(branchs).map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
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
