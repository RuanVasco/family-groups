import { useEffect, useState } from "react";
import { FaPen, FaPlus } from "react-icons/fa6";
import { toast } from "react-toastify";
import { FarmerType } from "../Type/FarmerType";
import axiosInstance from "../axiosInstance";
import { Modal, Button, Form } from "react-bootstrap";
import { StatusEnum, StatusLabels } from "../Enum/StatusEnum";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import { UserType } from "../Type/UserType";
import Select from "react-select";

const Farmer = () => {
    const [farmers, setFarmers] = useState<FarmerType[]>([]);
    const [currentFarmer, setCurrentFarmer] = useState<Partial<FarmerType> | null>(null);
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupType[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [show, setShow] = useState(false);

    const fetchFarmers = async () => {
        try {
            const res = await axiosInstance.get("/farmer");
            if (res.status === 200) {
                setFarmers(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os produtores");
        }
    };

    const fetchFamilyGroups = async () => {
        try {
            const res = await axiosInstance.get("/family-group");
            if (res.status === 200) {
                setFamilyGroups(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os grupos familiares");
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get("/user");
            if (res.status === 200 || res.status === 201) {
                setUsers(res.data);
            }
        } catch (error) {
            toast.error('Erro ao buscar usuários');
        }
    }

    const handleModalClose = () => setShow(false);

    const openModal = (mode: "create" | "edit", farmer?: FarmerType) => {
        setModalMode(mode);
        setCurrentFarmer(mode === "edit" ? { ...farmer } : null);
        setShow(true);
        fetchFamilyGroups();
        fetchUsers();
    };

    const handleChange = (field: keyof FarmerType, value: any) => {
        setCurrentFarmer(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        try {

            if (!currentFarmer?.name || !currentFarmer?.registrationNumber) {
                toast.warn("Preencha todos os campos obrigatórios.");
                return;
            }

            const data = {
                registrationNumber: currentFarmer.registrationNumber,
                name: currentFarmer.name,
                status: currentFarmer.status,
                familyGroupId: currentFarmer.familyGroup?.id,
                technicianId: currentFarmer.technician?.id
            }

            let res;
            let msg: string;

            if (modalMode === "create") {
                res = await axiosInstance.post("/farmer", data);
                msg = "Produtor criado com sucesso!";
            } else {
                res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, data);
                msg = "Produtor atualizado com sucesso!";
            }

            if (res.status === 200 || res.status === 201) {
                toast.success(msg);
                fetchFarmers();
            }


        } catch (error) {
            toast.error("Erro ao salvar produtor.");
        } finally {
            handleModalClose();
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    return (
        <div className="container-fluid">
            <div className="my-3 floating_panel">
                <button
                    type="button"
                    className="button_agree"
                    onClick={() => openModal("create")}
                >
                    <FaPlus /> Criar Produtor
                </button>
            </div>

            <table className="custom_table striped">
                <thead>
                    <tr>
                        <th>Ações</th>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>Situação</th>
                        <th>Técnico</th>
                        <th>Grupo Familiar</th>
                    </tr>
                </thead>
                <tbody>
                    {farmers.map(farmer => (
                        <tr key={Number(farmer.registrationNumber)}>
                            <td>
                                <button
                                    className="button_edit"
                                    onClick={() => openModal("edit", farmer)}
                                >
                                    <FaPen /> Editar
                                </button>
                            </td>
                            <td>{farmer.registrationNumber}</td>
                            <td>{farmer.name}</td>
                            <td>{StatusLabels[farmer.status]}</td>
                            <td>{farmer.technician?.username || "Sem técnico vinculado"}</td>
                            <td>{farmer.familyGroup ? (farmer.familyGroup?.principal.name) : ("Sem grupo familiar")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={show} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === "create" ? "Criar Produtor" : "Editar Produtor"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Matrícula</Form.Label>
                            <Form.Control
                                required
                                type="text"
                                value={Number(currentFarmer?.registrationNumber) || ""}
                                onChange={(e) => handleChange("registrationNumber", e.target.value)}
                                disabled={modalMode === "edit"}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                required
                                type="text"
                                value={currentFarmer?.name || ""}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Situação</Form.Label>
                            <Form.Select
                                required
                                value={currentFarmer?.status || ""}
                                onChange={(e) => handleChange("status", e.target.value as StatusEnum)}
                            >
                                <option value="">Selecione uma opção</option>
                                {Object.values(StatusEnum).map((status) => (
                                    <option key={status} value={status}>
                                        {StatusLabels[status]}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Grupo Familiar</Form.Label>
                            <Form.Select
                                value={currentFarmer?.familyGroup?.id || ""}
                                onChange={(e) => {
                                    const selectedGroup = familyGroups.find(fg => fg.id === Number(e.target.value));
                                    handleChange("familyGroup", selectedGroup || null);
                                }}
                            >
                                <option value="">Selecione uma opção</option>
                                {familyGroups.map((familyGroup) => (
                                    <option key={familyGroup.id} value={familyGroup.id}>
                                        {familyGroup.principal.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Técnico</Form.Label>
                            <Select
                                options={users.map((user) => ({
                                    value: user,
                                    label: user.username
                                }))}
                                value={users
                                    .map((user) => ({ value: user, label: user.username }))
                                    .find(opt => opt.value.id === currentFarmer?.technician?.id)}
                                onChange={(selectedOption) => handleChange("technician", selectedOption?.value)}
                                placeholder="Selecione um técnico"
                                isClearable
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

export default Farmer;
