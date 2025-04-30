import { FaChessKing, FaMinus, FaPlus } from "react-icons/fa6";
import "../assets/styles/_familygroup.scss";
import { Modal, Button, Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";
import { FarmerType } from "../Type/FarmerType";
import { FaSearch } from "react-icons/fa";
import Select from "react-select";
import { StatusLabels } from "../Enum/StatusEnum";

const FamilyGroup = () => {
    const [modalMode, setModalMode] = useState<"create" | "select" | "add-user" | "">("");
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupType[]>([]);
    const [avaibleFarmers, setAvaibleFarmers] = useState<FarmerType[]>([]);
    const [farmers, setFarmers] = useState<FarmerType[]>([]);
    const [selectedFamilyGroup, setSelectedFamilyGroup] = useState<FamilyGroupType | null>(null);
    const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>("");
    const [selectedMembers, setSelectedMembers] = useState<FarmerType[]>([]);

    const [show, setShow] = useState(false);

    useEffect(() => {
        if (selectedFamilyGroup) {
            handleSelectGroup(selectedFamilyGroup);
        }
    }, [selectedFamilyGroup]);

    const fetchFarmers = async () => {
        try {
            const res = await axiosInstance.get("/farmer/avaible");
            if (res.status === 200 || res.status === 201) {
                setAvaibleFarmers(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os produtores");
        }
    };

    const fetchFarmersByFamilyGroup = async (group: FamilyGroupType) => {
        try {
            const res = await axiosInstance.get(`/farmer/by-family-group/${group.id}`);

            if (res.status === 200 || res.status === 201) {
                setFarmers(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os participantes");
        }
    }

    const fetchFamilyGroups = async () => {
        try {
            const res = await axiosInstance.get("/family-group");
            if (res.status === 200 || res.status === 201) {
                setFamilyGroups(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os grupos familiares");
        }
    };

    const handleClose = () => setShow(false);

    const handleModalShow = async (mode: "create" | "select" | "add-user") => {
        setModalMode(mode);
        if (mode === "select") {
            await fetchFamilyGroups();
        } else {
            await fetchFarmers();
        }
        setShow(true);
    };

    const handleSelectGroup = (group: FamilyGroupType) => {
        setSelectedFamilyGroup(group);
        fetchFarmersByFamilyGroup(group);
        handleClose();
    };

    const handleCreateGroup = async () => {
        if (!selectedPrincipalId) {
            toast.warn("Selecione um produtor principal.");
            return;
        }

        try {
            const res = await axiosInstance.post("/family-group", {
                principalId: selectedPrincipalId,
                membersId: selectedMembers.map(m => m.registrationNumber),
            });

            if (res.status === 200 || res.status === 201) {
                setSelectedFamilyGroup(res.data);
                toast.success("Grupo familiar criado com sucesso!");
                handleClose();
            }
        } catch (error) {
            toast.error("Erro ao criar o grupo familiar.");
        }
    };

    const handleAddMember = async (farmer: String) => {
        try {
            const res = await axiosInstance.put(`/family-group/add-member/${selectedFamilyGroup?.id}/${farmer}`);

            if (res.status === 200 || res.status === 201) {

                if (selectedFamilyGroup) {
                    fetchFarmersByFamilyGroup(selectedFamilyGroup);
                }

                fetchFarmers();
                toast.success("Produtor adicionado com grupo familiar");
            }
        } catch (error) {
            toast.error("Erro ao adicionar o produtor ao grupo familiar.");
        }
    }

    const handleRemoveMember = async (farmer: String) => {
        try {
            const res = await axiosInstance.put(`/family-group/remove-member/${selectedFamilyGroup?.id}/${farmer}`);

            if (res.status === 200 || res.status === 201) {

                if (selectedFamilyGroup) {
                    fetchFarmersByFamilyGroup(selectedFamilyGroup);
                }

                fetchFarmers();
                toast.success("Produtor removido do grupo familiar.");
            }
        } catch (error) {
            toast.error("Erro ao remover o produtor do grupo familiar.");
        }
    }

    const handlePrincipalChange = async (farmerId: String) => {
        try {
            const res = await axiosInstance.put(`/family-group/change-principal/${selectedFamilyGroup?.id}/${farmerId}`)

            if (res.status === 200 || res.status === 201) {

                if (selectedFamilyGroup) {
                    const newPrincipal = farmers.find(f => f.registrationNumber === farmerId);
                    if (newPrincipal) {
                        setSelectedFamilyGroup({
                            ...selectedFamilyGroup,
                            principal: newPrincipal,
                        });
                    }
                }

                fetchFarmers();
                toast.success("Principal atualizado.");
            }
        } catch (error) {
            toast.error("Erro ao alterar o principal do grupo")
        }
    }

    return (
        <div className="container-fluid pt-4 pe-4">
            <div className="family-group-header">
                <input
                    type="text"
                    readOnly
                    className="input_readonly"
                    value={selectedFamilyGroup?.principal?.name || "Selecione um grupo familiar"}
                />
                <button
                    type="button"
                    className="btn_select"
                    onClick={() => handleModalShow("select")}
                >
                    <FaSearch /> Selecionar
                </button>
                <button
                    type="button"
                    className="btn_create"
                    onClick={() => handleModalShow("create")}
                >
                    <FaPlus /> Criar
                </button>
            </div>

            {selectedFamilyGroup != null && (
                <>
                    <div className="d-flex align-items-center justify-content-between mt-5 mb-3 floating_panel">
                        <h3 className="fw-bold" style={{ margin: "0", padding: "0" }}>Participantes</h3>
                        <button
                            type="button"
                            className="button_agree"
                            onClick={() => handleModalShow("add-user")}
                        >
                            <FaPlus />
                            Adicionar Participante
                        </button>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Nome</th>
                                <th>Situação</th>
                                <th>Técnico</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {farmers.map((p) => (
                                <tr key={Number(p.registrationNumber)}>
                                    <td>{p.registrationNumber}</td>
                                    <td>{p.name}</td>
                                    <td>{StatusLabels[p.status]}</td>
                                    <td>{p.technician?.username || "Sem técnico vinculado"}</td>
                                    <td className="d-flex gap-2">
                                        {p.registrationNumber != selectedFamilyGroup?.principal.registrationNumber ? (
                                            <>
                                                <button
                                                    className="button_neutral btn_sm"
                                                    onClick={() => handlePrincipalChange(p.registrationNumber)}
                                                >
                                                    <FaChessKing />
                                                    Tornar principal
                                                </button>
                                                <button
                                                    className="button_remove btn_sm"
                                                    onClick={() => handleRemoveMember(p.registrationNumber)}
                                                >
                                                    <FaMinus />
                                                    Remover
                                                </button></>
                                        ) : (
                                            <>-</>
                                        )}

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        {modalMode === "create"
                            ? "Criar um grupo familiar"
                            : modalMode === "add-user"
                                ? "Adicionar usuário ao grupo familiar"
                                : "Selecione um grupo familiar"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalMode === "select" ? (
                        <table className="custom_table">
                            <thead>
                                <tr>
                                    <th>Ações</th>
                                    <th>ID</th>
                                    <th>Principal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {familyGroups.length > 0 && (
                                    familyGroups.map((group) => (
                                        <tr key={group.id}>
                                            <td>
                                                <button
                                                    className="btn_select"
                                                    onClick={() => handleSelectGroup(group)}
                                                >
                                                    Selecionar
                                                </button>
                                            </td>
                                            <td>{group.id}</td>
                                            <td>{group.principal.name}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : modalMode === "add-user" ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Ações</th>
                                    <th>Matrícula</th>
                                    <th>Nome</th>
                                    <th>Técnico</th>
                                </tr>
                            </thead>
                            <tbody>
                                {avaibleFarmers.map((p) => (
                                    <tr key={Number(p.registrationNumber)}>
                                        <td>
                                            <button
                                                className="button_agree btn_sm"
                                                onClick={() => handleAddMember(p.registrationNumber)}
                                            >
                                                <FaPlus />
                                                Adicionar
                                            </button>
                                        </td>
                                        <td>{p.registrationNumber}</td>
                                        <td>{p.name}</td>
                                        <td>{p.technician?.username || "Sem técnico vinculado"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <Form>
                            <Form.Group>
                                <Form.Label>Produtor Principal</Form.Label>
                                <Form.Select
                                    value={selectedPrincipalId}
                                    onChange={(e) => setSelectedPrincipalId(e.target.value)}
                                >
                                    <option value="">Selecione</option>
                                    {avaibleFarmers.map((farmer) => (
                                        <option
                                            key={Number(farmer.registrationNumber)}
                                            value={Number(farmer.registrationNumber)}
                                        >
                                            {farmer.name} ({farmer.registrationNumber})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Participantes</Form.Label>
                                <Select
                                    isMulti
                                    options={avaibleFarmers
                                        .filter(farmer => farmer.registrationNumber !== selectedPrincipalId)
                                        .map(farmer => ({
                                            value: farmer,
                                            label: `${farmer.name} (${farmer.registrationNumber})`
                                        }))
                                    }
                                    value={selectedMembers.map(f => ({ value: f, label: `${f.name} (${f.registrationNumber})` }))}
                                    onChange={(selectedOptions) =>
                                        setSelectedMembers(selectedOptions.map(opt => opt.value))
                                    }
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancelar
                    </Button>
                    {modalMode === "create" && (
                        <Button variant="primary" onClick={handleCreateGroup}>
                            Criar
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FamilyGroup;
