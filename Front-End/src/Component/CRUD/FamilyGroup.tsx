import { useEffect, useState } from "react";
import SelectOrAddBar from "../Common/SelectOrAddBar/SelectOrAddBar";
import { FamilyGroupType } from "../../Type/FamilyGroupType";
import axiosInstance from "../../axiosInstance";
import { toast } from "react-toastify";
import { usePaginatedFetchData } from "../../Hook/usePaginatedFetchData";
import FamilyGroupTable from "../FamilyGroupTable";
import { Button, Form, Modal } from "react-bootstrap";
import Select from "react-select";
import Pagination from "../Common/Pagination";
import CustomTable from "../Common/CustomTable";
import { useFetchItem } from "../../Hook/useFetchItem";
import { useFetchData } from "../../Hook/useFetchData";
import { FarmerType } from "../../Type/FarmerType";
import { FaPlus } from "react-icons/fa6";
import FarmerModal from "../FarmerModal";

interface CultivationType {
    canolaArea?: number;
    wheatArea?: number;
    cornSilageArea?: number;
    grainCornArea?: number;
    beanArea?: number;
    soybeanArea?: number;
}

interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

const FamilyGroup = () => {
    const [selectedFamilyGroup, setSelectedFamilyGroup] = useState<FamilyGroupType | null>(null);
    const [modalMode, setModalMode] = useState<"create" | "select" | "add-farmer" | "add-cultivation" | "edit" | null>(null);
    const itemsPerPage = 10;
    const [currentFarmer, setCurrentFarmer] = useState<Partial<FarmerType> | null>(null);
    const [show, setShow] = useState(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>("");
    const [selectedMembers, setSelectedMembers] = useState<FarmerType[]>([]);
    const [editCultivation, setEditCultivation] = useState<CultivationType>({});

    const {
        data: initialFamilyGroups,
        currentPage,
        totalPages,
        pageSize,
        fetchPage,
        setPageSize
    } = usePaginatedFetchData<FamilyGroupType>("/family-group");

    const { data: cultivations } = useFetchItem<CultivationType>(
        `/family-group/cultivation/${selectedFamilyGroup?.id}`,
        selectedFamilyGroup ? { id: selectedFamilyGroup.id } : undefined,
        !!selectedFamilyGroup
    );

    const { data: farmers, refetch: refetchFarmers } = useFetchItem<FarmerType[]>(
        selectedFamilyGroup ? `/farmer/by-family-group/${selectedFamilyGroup.id}` : "",
        undefined,
        !!selectedFamilyGroup
    );

    const { data: avaibleFarmers, fetch: fetchFarmers } = useFetchData<FarmerType[]>();

    const params = {
        search: searchValue?.length >= 3 ? searchValue : null,
        page: currentPage - 1,
        size: itemsPerPage,
    };

    const { data: searchedFamilyGroups } = useFetchItem<PaginatedResponse<FamilyGroupType>>(
        "/family-group",
        params,
        !!searchValue && searchValue.length >= 3
    );

    const familyGroupsToDisplay = searchValue?.length >= 3 ? (searchedFamilyGroups?.content || []) : (initialFamilyGroups || []);

    const handleClose = () => setShow(false);

    const handleModalShow = async (mode: "create" | "select" | "add-farmer" | "add-cultivation" | "edit") => {
        setModalMode(mode);

        if (mode === "add-cultivation" && selectedFamilyGroup) {
            setEditCultivation({
                canolaArea: selectedFamilyGroup.canolaArea,
                wheatArea: selectedFamilyGroup.wheatArea,
                cornSilageArea: selectedFamilyGroup.cornSilageArea,
                grainCornArea: selectedFamilyGroup.grainCornArea,
                beanArea: selectedFamilyGroup.beanArea,
                soybeanArea: selectedFamilyGroup.soybeanArea,
            });
        }

        if (mode === "select") fetchPage(currentPage);

        if (mode === "add-farmer" || mode === "create") {
            await fetchFarmers("/farmer/avaible", "Erro ao buscar os produtores");
        }

        setShow(true);
    };

    const handleEditCultivation = async () => {
        try {
            if (!selectedFamilyGroup) return;

            const res = await axiosInstance.put(
                `/family-group/cultivation/${selectedFamilyGroup.id}`,
                editCultivation
            );

            if (res.status === 200 || res.status === 201) {
                toast.success("Culturas atualizadas com sucesso");
                setSelectedFamilyGroup(prev => prev ? { ...prev, ...editCultivation } : prev);
            }
        } catch (error) {
            toast.error("Erro ao atualizar culturas");
        } finally {
            setShow(false);
        }
    };

    const handlePrincipalChange = async (farmerId: String) => {
        try {
            const res = await axiosInstance.put(`/family-group/change-principal/${selectedFamilyGroup?.id}/${farmerId}`)

            if (res.status === 200 || res.status === 201) {

                if (selectedFamilyGroup && farmers) {
                    const newPrincipal = farmers.find(f => f.registrationNumber === farmerId);
                    if (newPrincipal) {
                        setSelectedFamilyGroup({
                            ...selectedFamilyGroup,
                            principal: newPrincipal,
                        });
                    }
                }

                toast.success("Principal atualizado.");
            }
        } catch (error) {
            toast.error("Erro ao alterar o principal do grupo")
        }
    }

    const handleSelectGroup = (group: FamilyGroupType) => {
        setSelectedFamilyGroup(group);
        handleClose();
    };

    const handleAddMember = async (farmer: string) => {
        try {
            const res = await axiosInstance.put(`/family-group/add-member/${selectedFamilyGroup?.id}/${farmer}`);

            if (res.status === 200 || res.status === 201) {
                toast.success("Produtor adicionado com sucesso!");
                refetchFarmers();
                handleClose();
            }
        } catch (error) {
            toast.error("Erro ao adicionar o produtor ao grupo familiar.");
        }
    };

    const handleRemoveMember = async (farmer: String) => {
        try {
            const res = await axiosInstance.put(`/family-group/remove-member/${selectedFamilyGroup?.id}/${farmer}`);

            if (res.status === 200 || res.status === 201) {
                toast.success("Produtor removido com sucesso!");
                refetchFarmers();
                handleClose();
            }
        } catch (error) {
            toast.error("Erro ao remover o produtor do grupo familiar.");
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

    const handleEditFarmer = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setModalMode("edit");
        setShow(true);
    };

    const handleSubmitFarmer = async () => {
        try {
            if (!currentFarmer?.registrationNumber || !currentFarmer.name) {
                toast.warn("Preencha todos os campos obrigatórios.");
                return;
            }

            const data = {
                registrationNumber: currentFarmer.registrationNumber,
                name: currentFarmer.name,
                status: currentFarmer.status,
                familyGroupId: currentFarmer.familyGroup?.id,
                technicianId: currentFarmer.technician?.id,
                ownedArea: currentFarmer.ownedArea,
                leasedArea: currentFarmer.leasedArea,
                branch: currentFarmer.branch?.id
            }

            const res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, data);

            if (res.status === 200 || res.status === 201) {
                toast.success("Produtor atualizado com sucesso!");
                refetchFarmers();
                setShow(false);
                setModalMode(null);
            }
        } catch (error) {
            toast.error("Erro ao atualizar o produtor.");
        }
    };

    useEffect(() => {
        if (selectedFamilyGroup && cultivations) {
            setSelectedFamilyGroup(prev => prev ? { ...prev, ...cultivations } : prev);
        }
    }, [cultivations]);

    useEffect(() => {
        if (selectedFamilyGroup && farmers) {
            setSelectedFamilyGroup(prev => prev ? { ...prev, members: farmers } : prev);
        }
    }, [farmers]);

    useEffect(() => {
        if (searchValue.length >= 3) {
            fetchPage(1);
        }
    }, [searchValue]);

    return (
        <div className="p-4">
            <SelectOrAddBar
                value={selectedFamilyGroup?.principal?.name || ""}
                onSelectClick={() => handleModalShow("select")}
                onCreateClick={() => handleModalShow("create")}
            />

            {selectedFamilyGroup && (
                <>
                    <div className="d-flex align-items-center justify-content-between mt-5 mb-3 floating_panel">
                        <h3 className="fw-bold" style={{ margin: "0", padding: "0" }}>Participantes</h3>
                        <button
                            type="button"
                            className="button_agree"
                            onClick={() => handleModalShow("add-farmer")}
                        >
                            <FaPlus />
                            Adicionar Participante
                        </button>
                    </div>
                    <div className="floating_panel" style={{ overflowX: 'auto' }}>
                        <FamilyGroupTable
                            familyGroup={selectedFamilyGroup}
                            showActions={true}
                            onMakePrincipal={(farmer) => handlePrincipalChange(farmer.registrationNumber)}
                            onRemoveFarmer={(farmer) => handleRemoveMember(farmer.registrationNumber)}
                            onEditFarmer={handleEditFarmer}
                            onEditCultivation={() => handleModalShow("add-cultivation")}
                        />
                    </div>
                </>
            )
            }

            <FarmerModal
                show={modalMode === "edit"}
                onClose={() => {
                    setModalMode(null)
                    setShow(false)
                    setCurrentFarmer(null);
                }}
                onSubmit={handleSubmitFarmer}
                currentFarmer={currentFarmer}
                modalMode="edit"
                onChange={(field, value) =>
                    setCurrentFarmer(prev => prev ? { ...prev, [field]: value } : prev)
                }
            />

            <Modal show={show && modalMode !== "edit"} onHide={handleClose} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        {modalMode === "create"
                            ? "Criar um grupo familiar"
                            : modalMode === "add-farmer"
                                ? "Adicionar produtor ao grupo familiar"
                                : modalMode === "add-cultivation" ?
                                    "Adicionar área de cultivo"
                                    : "Selecione um grupo familiar"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalMode === "select" ? (
                        <Pagination
                            itemsPerPage={pageSize}
                            onItemsPerPageChange={(val) => {
                                setPageSize(val);
                            }}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => fetchPage(page)}
                        >
                            <input
                                type="text"
                                placeholder="Procurar"
                                className="mb-3 w-50"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                            {familyGroupsToDisplay.length > 0 && (
                                <CustomTable
                                    headers={["Ações", "ID", "Principal"]}
                                    columnWidths={[
                                        "170px",
                                        "70px",
                                        undefined,
                                    ]}
                                >
                                    {familyGroupsToDisplay.map((group) => (
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
                                    ))}
                                </CustomTable>
                            )}
                        </ Pagination>
                    ) : modalMode === "add-farmer" && avaibleFarmers ? (
                        <CustomTable
                            headers={[
                                "Ações",
                                "Matrícula",
                                "Nome",
                                "Técnico"
                            ]}
                        >
                            {avaibleFarmers.map((p) => (
                                <tr key={Number(p.registrationNumber)}>
                                    <td>
                                        <button
                                            className="button_agree btn_sm"
                                            onClick={() => handleAddMember(String(p.registrationNumber))}
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
                        </CustomTable>
                    ) : modalMode === "add-cultivation" ? (
                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Canola
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={cultivations?.canolaArea || 0}
                                    onChange={(e) => {
                                        setEditCultivation(prev => ({
                                            ...prev,
                                            canolaArea: parseFloat(e.target.value)
                                        }))
                                    }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Trigo</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editCultivation.wheatArea ?? 0}
                                    onChange={(e) =>
                                        setEditCultivation(prev => ({
                                            ...prev,
                                            wheatArea: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label>Milho silagem</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editCultivation.cornSilageArea ?? 0}
                                    onChange={(e) =>
                                        setEditCultivation(prev => ({
                                            ...prev,
                                            cornSilageArea: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label>Milho grão</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editCultivation.grainCornArea ?? 0}
                                    onChange={(e) =>
                                        setEditCultivation(prev => ({
                                            ...prev,
                                            grainCornArea: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label>Feijão</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editCultivation.beanArea ?? 0}
                                    onChange={(e) =>
                                        setEditCultivation(prev => ({
                                            ...prev,
                                            beanArea: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                />
                            </Form.Group>

                            <Form.Group className="mb-2">
                                <Form.Label>Soja</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editCultivation.soybeanArea ?? 0}
                                    onChange={(e) =>
                                        setEditCultivation(prev => ({
                                            ...prev,
                                            soybeanArea: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                />
                            </Form.Group>
                        </Form>
                    ) : (
                        <Form>
                            {avaibleFarmers && (
                                <>
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
                                </>
                            )}
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
        </div >
    )
}

export default FamilyGroup;
