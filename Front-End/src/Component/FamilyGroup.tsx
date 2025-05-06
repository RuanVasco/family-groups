import { FaChessKing, FaMinus, FaPencil, FaPlus } from "react-icons/fa6";
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
import Pagination from "./Pagination";

interface CultivationType {
    canolaArea?: number;
    wheatArea?: number;
    cornSilageArea?: number;
    grainCornArea?: number;
    beanArea?: number;
    soybeanArea?: number;
}

const FamilyGroup = () => {
    const [modalMode, setModalMode] = useState<"create" | "select" | "add-user" | "add-cultivation" | "">("");
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupType[]>([]);
    const [avaibleFarmers, setAvaibleFarmers] = useState<FarmerType[]>([]);
    const [farmers, setFarmers] = useState<FarmerType[]>([]);
    const [selectedFamilyGroup, setSelectedFamilyGroup] = useState<FamilyGroupType | null>(null);
    const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>("");
    const [selectedMembers, setSelectedMembers] = useState<FarmerType[]>([]);
    const [cultivations, setCultivations] = useState<CultivationType | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchValue, setSearchValue] = useState<string>("");

    const [show, setShow] = useState(false);

    useEffect(() => {
        if (selectedFamilyGroup) {
            handleSelectGroup(selectedFamilyGroup);
            fetchCultivations();
        }
    }, [selectedFamilyGroup]);

    useEffect(() => {
        fetchFamilyGroups(currentPage, itemsPerPage);
    }, [currentPage, itemsPerPage]);

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

    const fetchFamilyGroups = async (page = 1, size = 10) => {
        try {
            const res = await axiosInstance.get(`/family-group?page=${page - 1}&size=${size}`);
            if (res.status === 200 || res.status === 201) {
                setFamilyGroups(res.data.content);
                setTotalPages(res.data.totalPages);
                setCurrentPage(res.data.number + 1);
            }
        } catch (error) {
            toast.error("Erro ao buscar os grupos familiares");
        }
    };

    const fetchCultivations = async () => {
        if (!selectedFamilyGroup) {
            return;
        }

        try {
            const res = await axiosInstance.get(`/family-group/cultivation/${selectedFamilyGroup?.id}`);
            if (res.status === 200 || res.status === 201) {
                setCultivations(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar culturas");
        }
    }

    const handleClose = () => setShow(false);

    const handleModalShow = async (mode: "create" | "select" | "add-user" | "add-cultivation") => {
        setModalMode(mode);
        if (mode === "select") {
            await fetchFamilyGroups(currentPage, itemsPerPage);
        } else if (mode === "add-cultivation") {
            await fetchCultivations();
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

    const handleEditCultivation = async () => {
        try {
            if (!selectedFamilyGroup) {
                return;
            }

            const res = await axiosInstance.put(
                `/family-group/cultivation/${selectedFamilyGroup?.id}`,
                cultivations
            );

            if (res.status === 200 || res.status === 201) {
                toast.success("Culturas atualizados com sucesso");
            }

        } catch (error) {
            console.log(error)
            toast.error("Erro ao atualizar culturas");
        } finally {
            setCultivations(null);
            fetchCultivations();
            setShow(false);
        }
    }

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

    const updateCultivation = (field: keyof CultivationType, value: number) => {
        setCultivations(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosInstance.get("/family-group", {
                    params: {
                        search: searchValue.length >= 3 ? searchValue : undefined,
                        page: currentPage - 1,
                        size: itemsPerPage,
                    },
                });

                if (res.status === 200) {
                    setFamilyGroups(res.data.content);
                    setTotalPages(res.data.totalPages);
                    setCurrentPage(res.data.number + 1);
                }
            } catch (error) {
                toast.error("Erro ao buscar produtores");
            }
        };

        fetch();
    }, [searchValue, currentPage, itemsPerPage]);

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
                                <th>Área total</th>
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
                                    <td>
                                        {(p.ownedArea || p.leasedArea)
                                            ? (p.ownedArea ?? 0) + (p.leasedArea ?? 0)
                                            : 0} ha
                                    </td>
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
                        <tfoot>
                            <tr>
                                <td colSpan={7}>
                                    <h4 className="fw-bold text-end">
                                        Área Total:{" "}
                                        {farmers.reduce((total, f) => total + (f.ownedArea ?? 0) + (f.leasedArea ?? 0), 0)} ha
                                    </h4>
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="d-flex align-items-center justify-content-between mt-5 mb-3 floating_panel">
                        <h3 className="fw-bold" style={{ margin: "0", padding: "0" }}>Cultivos</h3>
                        <button
                            type="button"
                            className="button_edit"
                            onClick={() => handleModalShow("add-cultivation")}
                        >
                            <FaPencil />
                            Editar cultivo
                        </button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Safra</th>
                                <th>Canola</th>
                                <th>Trigo</th>
                                <th>Milho silagem</th>
                                <th>Milho grão</th>
                                <th>Feijão</th>
                                <th>Soja</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {cultivations && (
                                    <>
                                        <td>2025/2026</td>
                                        <td>{cultivations.canolaArea} ha</td>
                                        <td>{cultivations.wheatArea} ha</td>
                                        <td>{cultivations.cornSilageArea} ha</td>
                                        <td>{cultivations.grainCornArea} ha</td>
                                        <td>{cultivations.beanArea} ha</td>
                                        <td>{cultivations.soybeanArea} ha</td>
                                    </>
                                )}
                            </tr>
                        </tbody>
                    </table>
                </>
            )}

            <Modal show={show} onHide={handleClose} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        {modalMode === "create"
                            ? "Criar um grupo familiar"
                            : modalMode === "add-user"
                                ? "Adicionar usuário ao grupo familiar"
                                : modalMode === "add-cultivation" ?
                                    "Adicionar área de cultivo"
                                    : "Selecione um grupo familiar"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalMode === "select" ? (
                        <Pagination
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={(val) => {
                                setItemsPerPage(val);
                                setCurrentPage(1);
                            }}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        >
                            <input
                                type="text"
                                placeholder="Procurar"
                                className="mb-3 w-50"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                            <table>
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
                        </ Pagination>
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
                    ) : modalMode === "add-cultivation" ? (
                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Canola
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cultivations?.canolaArea || 0}
                                    onChange={(e) => updateCultivation("canolaArea", parseFloat(e.target.value))}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Trigo
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cultivations?.wheatArea || 0}
                                    onChange={(e) => updateCultivation("wheatArea", parseFloat(e.target.value))}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Milho silagem
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cultivations?.cornSilageArea || 0}
                                    onChange={(e) => updateCultivation("cornSilageArea", parseFloat(e.target.value))}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Milho grão
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cultivations?.grainCornArea || 0}
                                    onChange={(e) => updateCultivation("grainCornArea", parseFloat(e.target.value))}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Feijão
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cultivations?.beanArea || 0}
                                    onChange={(e) => updateCultivation("beanArea", parseFloat(e.target.value))}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Soja
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cultivations?.soybeanArea || 0}
                                    onChange={(e) => updateCultivation("soybeanArea", parseFloat(e.target.value))}
                                />
                            </Form.Group>
                        </Form>
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
                    {modalMode === "create" ? (
                        <Button variant="primary" onClick={handleCreateGroup}>
                            Criar
                        </Button>
                    ) : modalMode === "add-cultivation" ? (
                        <Button variant="primary" onClick={handleEditCultivation}>
                            Atualizar
                        </Button>
                    ) : (
                        <></>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FamilyGroup;
