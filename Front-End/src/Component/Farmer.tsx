import { useEffect, useState } from "react";
import { FaPen, FaPlus, FaTractor } from "react-icons/fa6";
import { toast } from "react-toastify";

import { FarmerType } from "../Type/FarmerType";
import { StatusEnum, StatusLabels } from "../Enum/StatusEnum";
import { usePaginatedFetchData } from "../Hook/usePaginatedFetchData";
import axiosInstance from "../axiosInstance";

import Pagination from "./Common/Pagination";
import CustomTable from "./Common/CustomTable";
import FarmerModal from "./FarmerModal";
import AssetModal from "./AssetModal";
import Select from "react-select";

const Farmer = () => {
    /* -------------------- estados -------------------- */
    const [searchValue, setSearchValue] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");

    const [filters, setFilters] = useState<Record<string, string>>({});
    const [selectedType, setSelectedType] = useState<{ label: string; value: string } | null>({
        label: "Todos",
        value: "",
    });

    const [showFarmerModal, setShowFarmerModal] = useState(false);
    const [showAssetModal, setShowAssetModal] = useState(false);

    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);
    const [farmers, setFarmers] = useState<FarmerType[]>([]);

    /* -------------------- paginação -------------------- */
    const {
        data: apiFarmers,
        currentPage,
        totalPages,
        totalItems,
        isLoading,
        fetchPage,
        setPageSize: hookSetPageSize,
    } = usePaginatedFetchData<FarmerType>("/farmer", pageSize);

    /* -------------------- efeitos -------------------- */
    useEffect(() => {
        fetchPage(1);
    }, []);

    useEffect(() => {
        if (apiFarmers) setFarmers(apiFarmers);
    }, [apiFarmers]);

    /* debounce simples p/ busca */
    useEffect(() => {
        const id = setTimeout(() => {
            const params = searchValue.length >= 3 ? { value: searchValue.trim() } : {};
            fetchPage(1, { ...params, ...filters });
        }, 300);
        return () => clearTimeout(id);
    }, [searchValue, filters]);

    /* -------------------- handlers -------------------- */
    const openFarmerModal = (mode: "create" | "edit", farmer?: FarmerType) => {
        setModalMode(mode);
        setCurrentFarmer(
            mode === "edit" && farmer
                ? farmer
                : {
                    registrationNumber: "",
                    name: "",
                    status: StatusEnum.ACTIVE,
                }
        );
        setShowFarmerModal(true);
    };

    const saveFarmer = async () => {
        if (!currentFarmer?.name || !currentFarmer.registrationNumber) {
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
            branch: currentFarmer.branch?.id,
        };

        try {
            const res =
                modalMode === "create"
                    ? await axiosInstance.post("/farmer", body)
                    : await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, body);

            if (res.status === 200 || res.status === 201) {
                toast.success(modalMode === "create" ? "Produtor criado!" : "Produtor atualizado!");
                fetchPage(currentPage);
            }
        } catch {
            toast.error("Erro ao salvar produtor.");
        } finally {
            setShowFarmerModal(false);
        }
    };

    const openAssetModal = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShowAssetModal(true);
    };

    /* -------------------- render -------------------- */
    return (
        <div className="pt-3 px-4 pb-5">
            {/* Barra de ações */}
            <div className="my-3 floating_panel d-flex align-items-center justify-content-between">
                <button className="button_agree" onClick={() => openFarmerModal("create")}>
                    <FaPlus /> Criar Produtor
                </button>

                <input
                    className="w-50"
                    placeholder="Pesquisar (mín. 3 letras)"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                />

                <h4 className="fw-bold m-0">Total: {totalItems}</h4>
            </div>

            {/* Filtro de tipo */}
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
                    value={selectedType}
                    onChange={opt => {
                        setSelectedType(opt);
                        const f = { ...filters };
                        opt?.value ? (f.typeId = opt.value) : delete f.typeId;
                        setFilters(f);
                    }}
                />
            </div>

            {/* Tabela + paginação */}
            <Pagination
                itemsPerPage={pageSize}
                onItemsPerPageChange={val => {
                    setPageSize(val);
                    hookSetPageSize(val);
                }}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={page => fetchPage(page, searchValue.length >= 3 ? { value: searchValue.trim(), ...filters } : filters)}
            >
                <div className="my-3 floating_panel">
                    {isLoading ? (
                        <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : farmers.length === 0 ? (
                        <h4 className="py-3 text-center fw-bold">Nenhum produtor encontrado.</h4>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <CustomTable
                                headers={[
                                    "Matrícula",
                                    "Tipo",
                                    "Nome",
                                    "Situação",
                                    "Técnico",
                                    "Carteira",
                                    "Grupo Familiar",
                                    "SAP Própria",
                                    "SAP Arrendada",
                                    "SAP Total",
                                    "Editar SAP",
                                    "Própria",
                                    "Arrendada",
                                    "Total",
                                    "Editar",
                                ]}
                                columnStyles={[
                                    undefined,
                                    undefined,
                                    undefined,
                                    undefined,
                                    undefined,
                                    undefined,
                                    undefined,
                                    { background: "#dae3de" },
                                    { background: "#dae3de" },
                                    { background: "#dae3de" },
                                    { background: "#dae3de" },
                                    { background: "#dbdbdb" },
                                    { background: "#dbdbdb" },
                                    { background: "#dbdbdb" },
                                    { background: "#dbdbdb" },
                                ]}
                            >
                                {farmers.map(f => {
                                    const sapOwned =
                                        f.ownedAssets?.filter(a => a.assetType.id === 1 || a.assetType.id === 2).reduce((s, a) => s + a.amount, 0) || 0;

                                    const sapLeased =
                                        f.leasedAssets?.filter(a => a.assetType.id === 1 || a.assetType.id === 2).reduce((s, a) => s + a.amount, 0) || 0;

                                    const sapTotal = sapOwned + sapLeased;

                                    const ownedArea = f.ownedArea ?? 0;
                                    const leasedArea = f.leasedArea ?? 0;
                                    const totalArea = ownedArea + leasedArea;

                                    return (
                                        <tr key={Number(f.registrationNumber)}>
                                            <td>{f.registrationNumber}</td>
                                            <td>{f.type?.id ?? "-"}</td>
                                            <td>{f.name}</td>
                                            <td>{StatusLabels[f.status]}</td>
                                            <td>{f.technician?.name ?? "Sem técnico"}</td>
                                            <td>{f.branch?.name ?? "Sem carteira"}</td>
                                            <td>
                                                {f.familyGroup
                                                    ? `${f.familyGroup.principal.registrationNumber} - ${f.familyGroup.principal.name}`
                                                    : "Sem grupo"}
                                            </td>
                                            <td>{sapOwned.toFixed(2)} ha</td>
                                            <td>{sapLeased.toFixed(2)} ha</td>
                                            <td>{sapTotal.toFixed(2)} ha</td>
                                            <td>
                                                <button className="button_info btn_sm" onClick={() => openAssetModal(f)} title="Editar bens">
                                                    <FaTractor />
                                                </button>
                                            </td>
                                            <td>{ownedArea.toFixed(2)} ha</td>
                                            <td>{leasedArea.toFixed(2)} ha</td>
                                            <td className={sapTotal !== totalArea ? "text-danger" : ""}>{totalArea.toFixed(2)} ha</td>
                                            <td>
                                                <button className="button_edit" onClick={() => openFarmerModal("edit", f)} title="Editar produtor">
                                                    <FaPen />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </CustomTable>
                        </div>
                    )}
                </div>
            </Pagination>

            {/* ---------- Modais ---------- */}
            <FarmerModal
                show={showFarmerModal}
                onClose={() => setShowFarmerModal(false)}
                onSubmit={saveFarmer}
                currentFarmer={currentFarmer}
                modalMode={modalMode}
                onChange={(field, val) => setCurrentFarmer(prev => (prev ? { ...prev, [field]: val } : prev))}
            />

            <AssetModal
                show={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                currentFarmer={currentFarmer}
                setCurrentFarmer={setCurrentFarmer}
                onChange={() => { }}
                /* Produtor editado no próprio modal */
                onFarmerUpdated={updated => {
                    setFarmers(prev => prev.map(f => (f.registrationNumber === updated.registrationNumber ? updated : f)));
                    if (currentFarmer?.registrationNumber === updated.registrationNumber) setCurrentFarmer(updated);
                }}
                /* Produtores afetados como arrendador/arrendatário */
                onOtherFarmerUpdated={affected =>
                    setFarmers(prev => prev.map(f => (f.registrationNumber === affected.registrationNumber ? affected : f)))
                }
            />
        </div>
    );
};

export default Farmer;
