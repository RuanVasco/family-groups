// Farmer.tsx
import { useEffect, useState } from "react";
import { FaPen, FaPlus, FaTractor } from "react-icons/fa6";
import { toast } from "react-toastify";
import { FarmerType } from "../Type/FarmerType";
import axiosInstance from "../axiosInstance";
import { StatusLabels } from "../Enum/StatusEnum";
import Pagination from "./Common/Pagination";
import FarmerModal from "./FarmerModal";
import { usePaginatedFetchData } from "../Hook/usePaginatedFetchData";
import CustomTable from "./Common/CustomTable";
import Select from "react-select";
import AssetModal from "./AssetModal";

const Farmer = () => {
    const [searchValue, setSearchValue] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [show, setShow] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [selectedType, setSelectedType] = useState<{ label: string; value: string } | null>({
        label: "Todos",
        value: ""
    });
    const [currentFarmer, setCurrentFarmer] =
        useState<FarmerType | null>(null);

    const {
        data: farmers,
        currentPage,
        totalPages,
        totalItems,
        isLoading,
        fetchPage,
        setPageSize: hookSetPageSize,
    } = usePaginatedFetchData<FarmerType>("/farmer", pageSize);

    useEffect(() => {
        fetchPage(1);
    }, []);

    useEffect(() => {
        const id = setTimeout(() => {
            const filters =
                searchValue.length >= 3 ? { value: searchValue.trim() } : {};
            fetchPage(1, filters);
        }, 300);

        return () => clearTimeout(id);
    }, [searchValue]);

    const openModal = (mode: "create" | "edit", farmer?: FarmerType) => {
        setModalMode(mode);
        if (mode === "edit" && farmer) {
            setCurrentFarmer(farmer);
        }
        setShow(true);
    };

    const handleModalClose = () => setShow(false);

    const handleChange = (field: keyof FarmerType, value: any) => {
        setCurrentFarmer((prev) => {
            if (!prev) return prev;
            return { ...prev, [field]: value };
        });
    };

    const handleSubmit = async () => {
        try {
            if (!currentFarmer?.name || !currentFarmer?.registrationNumber) {
                toast.warn("Preencha todos os campos obrigatórios.");
                return;
            }

            const body = {
                registrationNumber: currentFarmer.registrationNumber,
                name: currentFarmer.name,
                status: currentFarmer.status,
                familyGroupId: currentFarmer.familyGroup?.id,
                technicianId: currentFarmer.technician?.id,
                ownedArea: currentFarmer.ownedArea,
                leasedArea: currentFarmer.leasedArea,
                branch: currentFarmer.branch?.id
            };

            const res =
                modalMode === "create"
                    ? await axiosInstance.post("/farmer", body)
                    : await axiosInstance.put(
                        `/farmer/${currentFarmer.registrationNumber}`,
                        body
                    );

            if (res.status === 200 || res.status === 201) {
                toast.success(
                    modalMode === "create"
                        ? "Produtor criado com sucesso!"
                        : "Produtor atualizado com sucesso!"
                );
                fetchPage(currentPage);
            }
        } catch {
            toast.error("Erro ao salvar produtor.");
        } finally {
            handleModalClose();
        }
    };

    const handleType = (opt: any) => {
        setSelectedType(opt);

        const newFilters = { ...filters };
        if (opt?.value) {
            newFilters.typeId = opt.value;
        } else {
            delete newFilters.typeId;
        }

        setFilters(newFilters);

        fetchPage(1, { ...newFilters, value: searchValue.length >= 3 ? searchValue.trim() : undefined });
    };

    const openAssetModal = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShowAssetModal(true);
    }

    return (
        <div className="pt-3 px-4 pb-5">
            <div className="my-3 floating_panel d-flex align-items-center justify-content-between">
                <button className="button_agree" onClick={() => openModal("create")}>
                    <FaPlus /> Criar Produtor
                </button>

                <input
                    className="w-50"
                    placeholder="Pesquisar (mín. 3 letras)"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />

                <h4 className="fw-bold m-0">Total: {totalItems}</h4>
            </div>

            <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
                <Select
                    className="w-25"
                    options={[
                        { label: "Todos", value: "" },
                        { label: "1 - Pessoa Física Associado", value: "1" },
                        { label: "2 - Pessoa Física Terceiro", value: "2" },
                        { label: "3 - Pessoa Jurídica Associado", value: "3" },
                        { label: "4 - Pessoa Jurídica Terceiro", value: "4" },
                    ]}
                    onChange={handleType}
                    value={selectedType}
                />
            </div>

            <Pagination
                itemsPerPage={pageSize}
                onItemsPerPageChange={(val) => {
                    setPageSize(val);
                    hookSetPageSize(val);
                }}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) =>
                    fetchPage(page, searchValue.length >= 3 ? { value: searchValue } : {})
                }
            >
                <div className="my-3 floating_panel">
                    {isLoading ? (
                        <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                            <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                        </div>
                    ) : farmers.length === 0 ? (
                        <h4 className="py-3 text-center fw-bold">Nenhum produtor encontrado.</h4>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <CustomTable
                                headers={[
                                    "Ações", "Matrícula", "Nome", "Tipo", "Situação", "Técnico", "Carteira", "Grupo familiar",
                                    "SAP Própria", "SAP Arrendada", "SAP Total", "Própria", "Arrendada", "Total"
                                ]}
                            >
                                {farmers.map((f) => {
                                    const sapOwned = (
                                        f.ownedAssets
                                            ?.filter((asset) => asset.assetType.id === 1 || asset.assetType.id === 2)
                                            .reduce((sum, asset) => sum + asset.amount, 0) || 0
                                    ).toFixed(2);

                                    const sapLeased = (
                                        f.leasedAssets
                                            ?.filter((asset) => asset.assetType.id === 1 || asset.assetType.id === 2)
                                            .reduce((sum, asset) => sum + asset.amount, 0) || 0
                                    ).toFixed(2);

                                    const sapTotal = (parseFloat(sapOwned) + parseFloat(sapLeased)).toFixed(2);

                                    const ownedArea = (f.ownedArea ?? 0).toFixed(2);
                                    const leasedArea = (f.leasedArea ?? 0).toFixed(2);
                                    const totalArea = ((f.ownedArea ?? 0) + (f.leasedArea ?? 0)).toFixed(2);

                                    return (
                                        <tr key={Number(f.registrationNumber)}>
                                            <td className="d-flex gap-2">
                                                <button
                                                    className="button_edit"
                                                    onClick={() => openModal("edit", f)}
                                                    title="Editar Produtor"
                                                >
                                                    <FaPen />
                                                </button>
                                                <button
                                                    className="button_info btn_sm"
                                                    onClick={() => openAssetModal(f)}
                                                    title="Editar Bens"
                                                >
                                                    <FaTractor />
                                                </button>
                                            </td>
                                            <td>{f.registrationNumber}</td>
                                            <td>{f.name}</td>
                                            <td>{f.type?.id}</td>
                                            <td>{StatusLabels[f.status]}</td>
                                            <td>{f.technician?.name ?? "Sem técnico vinculado"}</td>
                                            <td>{f.branch?.name ?? "Sem carteira vinculada"}</td>
                                            <td>
                                                {f.familyGroup
                                                    ? `${f.familyGroup.principal.registrationNumber} - ${f.familyGroup.principal.name}`
                                                    : "Sem grupo familiar"}
                                            </td>
                                            <td>{`${sapOwned} ha`}</td>
                                            <td>{`${sapLeased} ha`}</td>
                                            <td>{`${sapTotal} ha`}</td>
                                            <td>
                                                {`${ownedArea} ha`}
                                            </td>
                                            <td>
                                                {`${leasedArea} ha`}
                                            </td>
                                            <td className={sapTotal !== totalArea ? "text-danger" : ""}>
                                                {`${totalArea} ha`}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </CustomTable>

                        </div>
                    )}
                </div>
            </Pagination>

            <FarmerModal
                show={show}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
                currentFarmer={currentFarmer}
                modalMode={modalMode}
                onChange={handleChange}
            />

            <AssetModal
                show={showAssetModal}
                onClose={() => {
                    setShowAssetModal(false);
                }}
                farmer={currentFarmer}
                onChange={() => { }}
                onFarmerUpdated={() => { }}
            />
        </div>
    );
};

export default Farmer;
