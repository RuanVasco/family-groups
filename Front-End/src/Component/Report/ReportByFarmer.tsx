import { useEffect, useMemo, useState } from "react";
import { FaPen, FaTractor } from "react-icons/fa6";
import axiosInstance from "../../axiosInstance";
import { toast } from "react-toastify";

import { StatusLabels } from "../../Enum/StatusEnum";
import { BranchType } from "../../Type/BranchType";
import { FarmerType } from "../../Type/FarmerType";
import { UserType } from "../../Type/UserType";

import CustomTable from "../Common/CustomTable";
import Pagination from "../Common/Pagination";
import FarmerModal from "../FarmerModal";
import { usePaginatedFetchData } from "../../Hook/usePaginatedFetchData";
import Select from "react-select";
import AssetModal from "../AssetModal";

function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

interface Props {
    branch?: BranchType;
    technician?: UserType;
    setTotalItems?: (total: number) => void;
}

const ReportByFarmer = ({ branch, technician, setTotalItems }: Props) => {
    const [pageSize, setPageSize] = useState(10);

    const [sortFieldUi, setSortFieldUi] = useState<string>();
    const [sortDirUi, setSortDirUi] = useState<"asc" | "desc">("asc");

    const [searchFarmer, setSearchFarmer] = useState("");
    const debouncedSearch = useDebouncedValue(searchFarmer.trim(), 200);

    const [selectedType, setSelectedType] = useState<{ label: string; value: string } | null>({
        label: "Todos",
        value: ""
    });

    const [filters, setFilters] = useState<Record<string, string>>({});
    const [currentFarmers, setCurrentFarmers] = useState<FarmerType[]>([]);

    const [showAssetModal, setShowAssetModal] = useState(false);

    const endpoint = branch
        ? `/farmer/by-branch/${branch.id}`
        : "/farmer/by-technician";

    const baseParams = useMemo(() => {
        return !branch && technician ? { userId: technician.id } : undefined;
    }, [branch, technician?.id]);

    const {
        data: farmers,
        currentPage,
        totalPages,
        totalItems,
        isLoading,
        fetchPage,
        setPageSize: updatePageSize
    } = usePaginatedFetchData<FarmerType>(endpoint, pageSize, { ...baseParams, ...filters });

    const fieldMap: Record<string, string> = {
        Matrícula: "registrationNumber",
        Tipo: "type",
        Nome: "name",
        Situação: "status",
        Técnico: "technician.name",
        Carteira: "branch",
        Própria: "ownedArea",
        Arrendada: "leasedArea",
        Total: "totalArea",
    };

    useEffect(() => {
        setFilters({});
        setSelectedType({ label: "Todos", value: "" });
        setSortFieldUi(undefined);
        fetchPage(1, baseParams);
    }, [endpoint]);

    useEffect(() => {
        if (farmers) setCurrentFarmers(farmers);
    }, [farmers])

    useEffect(() => {
        setFilters(prev => {
            const next = { ...prev };
            let changed = false;

            if (debouncedSearch.length >= 3) {
                if (next.search !== debouncedSearch) {
                    next.search = debouncedSearch;
                    changed = true;
                }
            } else {
                if ("search" in next) {
                    delete next.search;
                    changed = true;
                }
            }

            return changed ? next : prev;
        });
    }, [debouncedSearch]);


    useEffect(() => {
        fetchPage(1, { ...baseParams, ...filters });
    }, [baseParams, filters]);

    useEffect(() => {
        if (setTotalItems && totalItems !== undefined) setTotalItems(totalItems);
    }, [totalItems]);

    const handleSort = (header: string) => {
        const nextDir = sortFieldUi === header && sortDirUi === "asc" ? "desc" : "asc";
        setSortFieldUi(header);
        setSortDirUi(nextDir);

        const apiField = fieldMap[header];
        const newFilters = { ...filters, sort: `${apiField},${nextDir}` };
        setFilters(newFilters);
        fetchPage(1, { ...baseParams, ...newFilters });
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
        fetchPage(1, { ...baseParams, ...newFilters });
    };

    const [show, setShow] = useState(false);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);

    const openAssetModal = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShowAssetModal(true);
    }

    const handleSubmitFarmer = async () => {
        if (!currentFarmer?.registrationNumber || !currentFarmer.name) {
            toast.warn("Preencha todos os campos obrigatórios."); return;
        }

        try {
            const body = {
                registrationNumber: currentFarmer.registrationNumber,
                name: currentFarmer.name,
                status: currentFarmer.status,
                familyGroupId: currentFarmer.familyGroup?.id,
                technicianId: currentFarmer.technician?.id ?? null,
                ownedArea: currentFarmer.ownedArea ?? 0,
                leasedArea: currentFarmer.leasedArea ?? 0,
                branch: currentFarmer.branch?.id
            };
            const res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, body);
            if (res.status === 200 || res.status === 201) {
                toast.success("Produtor atualizado com sucesso!");

                setCurrentFarmers(prev =>
                    prev.map(f =>
                        f.registrationNumber === currentFarmer.registrationNumber
                            ? currentFarmer
                            : f
                    )
                );

                setShow(false);
            }
        } catch {
            toast.error("Erro ao atualizar o produtor.");
        }
    };

    return (
        <div className="pt-3 px-4 pb-5">
            <div className="floating_panel my-4 px-4">
                <div className="d-flex align-items-center justify-content-between my-3">
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

                    <input
                        type="text"
                        placeholder="Buscar produtor..."
                        className="w-25"
                        value={searchFarmer}
                        onChange={e => setSearchFarmer(e.target.value)}
                    />
                </div>

                <Pagination
                    itemsPerPage={pageSize}
                    onItemsPerPageChange={val => { setPageSize(val); updatePageSize(val); }}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={page => fetchPage(page, { ...baseParams, ...filters })}
                >
                    {!currentFarmers.length ? (
                        <h5 className="fw-bold mx-auto my-3">Nenhum dado encontrado.</h5>
                    ) : isLoading ? (
                        <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                            <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                        </div>
                    ) : (
                        <CustomTable
                            headers={[
                                "Matrícula",
                                "Tipo",
                                "Nome",
                                "Situação",
                                "Carteira",
                                "Grupo Familiar",
                                "SAP Própria",
                                "SAP Arrendada",
                                "SAP Total",
                                "Editar SAP",
                                "Própria",
                                "Arrendada",
                                "Total",
                                "Editar"
                            ]}
                            headerStyles={[
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                { background: "#d0d9d4" },
                                { background: "#d0d9d4" },
                                { background: "#d0d9d4" },
                                { background: "#d0d9d4" },
                                { background: "#c9c9c9" },
                                { background: "#c9c9c9" },
                                { background: "#c9c9c9" },
                                { background: "#c9c9c9" },
                            ]}
                            columnStyles={[
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
                            sortField={sortFieldUi}
                            sortDir={sortDirUi}
                            onSort={handleSort}
                        >
                            {currentFarmers.map(f => {

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

                                return (<tr key={Number(f.registrationNumber)}>
                                    <td>{f.registrationNumber}</td>
                                    <td>{f.type?.id ?? "-"}</td>
                                    <td>{f.name}</td>
                                    <td>{StatusLabels[f.status]}</td>
                                    <td>{f.branch?.name ?? "Sem carteira vinculada"}</td>
                                    <td>{f.familyGroup?.principal.name ?? "Sem grupo familiar"}</td>
                                    <td>{`${sapOwned} ha`}</td>
                                    <td>{`${sapLeased} ha`}</td>
                                    <td>{`${sapTotal} ha`}</td>
                                    <td>
                                        <button
                                            className="button_info btn_sm"
                                            onClick={() => openAssetModal(f)}
                                            title="Editar Bens"
                                        >
                                            <FaTractor />
                                        </button>
                                    </td>
                                    <td>
                                        {`${ownedArea} ha`}
                                    </td>
                                    <td>
                                        {`${leasedArea} ha`}
                                    </td>
                                    <td className={sapTotal !== totalArea ? "text-danger" : ""}>
                                        {`${totalArea} ha`}
                                    </td>
                                    <td className="d-flex gap-2">

                                        <button
                                            className="button_edit btn_sm"
                                            onClick={() => { setCurrentFarmer(f); setShow(true); }}
                                            title="Editar Produtor"
                                        >
                                            <FaPen />
                                        </button>
                                    </td>
                                </tr>
                                )
                            })}
                        </CustomTable>
                    )}
                </Pagination>
            </div>

            <FarmerModal
                show={show}
                onClose={() => { setShow(false); setCurrentFarmer(null); }}
                onSubmit={handleSubmitFarmer}
                currentFarmer={currentFarmer}
                modalMode="edit"
                onChange={(field, value) => {
                    setCurrentFarmer(p => p ? { ...p, [field]: value } : p)
                }}
            />

            <AssetModal
                show={showAssetModal}
                onClose={() => setShowAssetModal(false)}
                currentFarmer={currentFarmer}
                setCurrentFarmer={setCurrentFarmer}
                onChange={() => { }}
                onFarmerUpdated={(updatedFarmer) => {
                    setCurrentFarmers(prev =>
                        prev.map(f =>
                            f.registrationNumber === updatedFarmer.registrationNumber
                                ? updatedFarmer
                                : f
                        )
                    );
                }}
            />
        </div>
    );
};

export default ReportByFarmer;
