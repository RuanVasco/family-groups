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
import { FarmerType } from "../../Type/FarmerType";
import { FaPlus } from "react-icons/fa6";
import AssetModal from "../AssetModal";

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
    const [modalMode, setModalMode] = useState<"create" | "select" | "add-farmer" | "edit" | null>(null);
    const itemsPerPage = 10;
    const [show, setShow] = useState(false);
    const [showAssets, setShowAssets] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>("");
    const [selectedMembers, setSelectedMembers] = useState<FarmerType[]>([]);
    const [availableSearchValue, setAvailableSearchValue] = useState<string>("");
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);

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

    const {
        data: availableFarmers,
        fetchPage: fetchAvailableFarmersPage,
        currentPage: availableCurrentPage,
        totalPages: availableTotalPages,
        pageSize: availablePageSize,
        isLoading: isLoadingAvailableFarmers,
        setPageSize: setAvailablePageSize
    } = usePaginatedFetchData<FarmerType>("/farmer/available", 10);

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

    const handleModalShow = async (mode: "create" | "select" | "add-farmer" | "edit") => {
        setModalMode(mode);
        if (mode === "select") fetchPage(currentPage);

        if (mode === "add-farmer" || mode === "create") {
            fetchAvailableFarmersPage(1);
        }

        setShow(true);
    };

    useEffect(() => {
        if (availableSearchValue.length > 3) {
            fetchAvailableFarmersPage(1, { search: availableSearchValue });
        }
    }, [availableSearchValue]);

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

    const handleOpenAssetModal = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShowAssets(true);
    }

    const handleCloseAssetModal = () => {
        setCurrentFarmer(null);
        setShowAssets(false);
    }

    const handleFarmerAssetsUpdated = (updatedFarmer: FarmerType) => {
        setSelectedFamilyGroup(prev => {
            if (!prev) return prev;

            const members = prev.members?.map(m =>
                m.registrationNumber === updatedFarmer.registrationNumber ? updatedFarmer : m
            ) ?? [];

            const principal =
                prev.principal.registrationNumber === updatedFarmer.registrationNumber
                    ? updatedFarmer
                    : prev.principal;

            return { ...prev, principal, members };
        });
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
                            familyGroup={{
                                id: selectedFamilyGroup.id,
                                principal: selectedFamilyGroup.principal,
                                members: selectedFamilyGroup.members,
                                canolaArea: selectedFamilyGroup.canolaArea,
                                wheatArea: selectedFamilyGroup.wheatArea,
                                cornSilageArea: selectedFamilyGroup.cornSilageArea,
                                grainCornArea: selectedFamilyGroup.grainCornArea,
                                beanArea: selectedFamilyGroup.beanArea,
                                soybeanArea: selectedFamilyGroup.soybeanArea,
                            }}
                            showActions={true}
                            onMakePrincipal={(farmer) => handlePrincipalChange(farmer.registrationNumber)}
                            onRemoveFarmer={(farmer) => handleRemoveMember(farmer.registrationNumber)}
                            onEditAssets={(farmer) => handleOpenAssetModal(farmer)}
                        />
                    </div>
                </>
            )
            }

            <AssetModal
                show={showAssets}
                onClose={handleCloseAssetModal}
                currentFarmer={currentFarmer}
                setCurrentFarmer={setCurrentFarmer}
                onChange={() => { }}
                onFarmerUpdated={handleFarmerAssetsUpdated}
            />

            <Modal show={show && modalMode !== "edit"} onHide={handleClose} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        {modalMode === "create"
                            ? "Criar um grupo familiar"
                            : modalMode === "add-farmer"
                                ? "Adicionar produtor ao grupo familiar"
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
                    ) : modalMode === "add-farmer" && availableFarmers ? (
                        <Pagination
                            itemsPerPage={availablePageSize}
                            onItemsPerPageChange={(val) => setAvailablePageSize(val)}
                            currentPage={availableCurrentPage}
                            totalPages={availableTotalPages}
                            onPageChange={(page) => fetchAvailableFarmersPage(page)}
                        >
                            <>
                                <input
                                    type="text"
                                    placeholder="Buscar produtor..."
                                    className="mb-3 w-50"
                                    value={availableSearchValue}
                                    onChange={(e) => {
                                        setAvailableSearchValue(e.target.value);
                                        if (e.target.value.length >= 3) {
                                            fetchAvailableFarmersPage(1, { search: e.target.value });
                                        }
                                    }}
                                />

                                {isLoadingAvailableFarmers ? (
                                    <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                                        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                                    </div>
                                ) : (
                                    <CustomTable
                                        headers={[
                                            "Ações",
                                            "Matrícula",
                                            "Nome",
                                            "Técnico"
                                        ]}
                                    >
                                        {availableFarmers.map((p) => (
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
                                )}
                            </>
                        </Pagination>
                    ) : (
                        <Form>
                            {availableFarmers && (
                                <>
                                    <Form.Group>
                                        <Form.Label>Produtor Principal</Form.Label>
                                        <Form.Select
                                            value={selectedPrincipalId}
                                            onChange={(e) => setSelectedPrincipalId(e.target.value)}
                                        >
                                            <option value="">Selecione</option>
                                            {availableFarmers.map((farmer) => (
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
                                            options={availableFarmers
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
                    ) : (
                        <></>
                    )}
                </Modal.Footer>
            </Modal>
        </div >
    )
}

export default FamilyGroup;
