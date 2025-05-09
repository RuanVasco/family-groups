import { useEffect, useState } from "react";
import { FaPen, FaPlus } from "react-icons/fa6";
import { toast } from "react-toastify";
import axiosInstance from "../axiosInstance";
import { Modal, Button, Form } from "react-bootstrap";
import { BranchType } from "../Type/BranchType";

const Branch = () => {
    const [branchs, setBranchs] = useState<BranchType[]>([]);
    const [currentBranch, setCurrentBranch] = useState<Partial<BranchType> | null>(null);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [show, setShow] = useState(false);

    const fetchBranchs = async () => {
        try {
            const res = await axiosInstance.get("/branch");
            if (res.status === 200) {
                setBranchs(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar carteiras");
        }
    };

    const handleModalClose = () => setShow(false);

    const openModal = (mode: "create" | "edit", branch?: BranchType) => {
        setModalMode(mode);
        setCurrentBranch(mode === "edit" ? { ...branch } : null);
        setShow(true);
    };

    const handleChange = (field: keyof BranchType, value: any) => {
        setCurrentBranch(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        try {
            if (!currentBranch?.name) {
                toast.warn("Preencha todos os campos obrigatórios.");
                return;
            }

            if (modalMode === "create") {
                await axiosInstance.post("/branch", { name: currentBranch.name });
                toast.success("Carteira criada com sucesso!");
            } else {
                await axiosInstance.put(`/branch/${currentBranch.id}`, { name: currentBranch.name });
                toast.success("Carteira atualizada com sucesso!");
            }

            fetchBranchs();
            handleModalClose();
        } catch (error) {
            toast.error("Erro ao salvar carteira.");
        }
    };

    useEffect(() => {
        fetchBranchs();
    }, []);

    return (
        <div className="container-fluid">
            <div className="my-3 floating_panel">
                <button
                    type="button"
                    className="button_agree"
                    onClick={() => openModal("create")}
                >
                    <FaPlus /> Criar Carteira
                </button>
            </div>

            <div className="floating_panel">
                <table className="custom_table striped">
                    <thead>
                        <tr>
                            <th>Ações</th>
                            <th>ID</th>
                            <th>Nome</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branchs.map(branch => (
                            <tr key={branch.id}>
                                <td>
                                    <button
                                        className="button_edit"
                                        onClick={() => openModal("edit", branch)}
                                    >
                                        <FaPen /> Editar
                                    </button>
                                </td>
                                <td>{branch.id}</td>
                                <td>{branch.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal show={show} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === "create" ? "Criar Carteira" : "Editar Carteira"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {modalMode === "edit" && (
                            <Form.Group className="mb-3">
                                <Form.Label>ID</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    value={currentBranch?.id || ""}
                                    disabled
                                />
                            </Form.Group>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                required
                                type="text"
                                value={currentBranch?.name || ""}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {modalMode === "create" ? "Criar" : "Salvar"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Branch;
