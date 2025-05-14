/* ReportByFarmer.tsx */
import { useEffect, useMemo, useState } from "react";
import { FaPen } from "react-icons/fa6";
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

/* ————————————————————————————————————————————————————— */
/* pequeno hook de debounce */
function useDebouncedValue<T>(value: T, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}
/* ————————————————————————————————————————————————————— */

interface Props {
    branch?: BranchType;
    technician?: UserType;          // null → “sem técnico”
    setTotalItems?: (total: number) => void;
}

const ReportByFarmer = ({ branch, technician, setTotalItems }: Props) => {
    /* paginação */
    const [pageSize, setPageSize] = useState(10);

    /* ordenação (UI) */
    const [sortFieldUi, setSortFieldUi] = useState<string>();
    const [sortDirUi, setSortDirUi] = useState<"asc" | "desc">("asc");

    /* busca */
    const [searchFarmer, setSearchFarmer] = useState("");
    const debouncedSearch = useDebouncedValue(searchFarmer.trim(), 200);

    /* filtro tipo */
    const [selectedType, setSelectedType] = useState<{ label: string; value: string } | null>({
        label: "Todos",
        value: ""
    });

    /* objeto de filtros unificado */
    const [filters, setFilters] = useState<Record<string, string>>({});

    /* endpoint base */
    const endpoint = branch
        ? `/farmer/by-branch/${branch.id}`
        : "/farmer/by-technician";

    // const baseParams =
    //     !branch && technician ? { userId: technician.id } : undefined;

    const baseParams = useMemo(() => {
        return !branch && technician ? { userId: technician.id } : undefined;
    }, [branch, technician?.id]);

    /* hook paginado */
    const {
        data: farmers,
        currentPage,
        totalPages,
        totalItems,
        isLoading,
        fetchPage,
        setPageSize: updatePageSize
    } = usePaginatedFetchData<FarmerType>(endpoint, pageSize, { ...baseParams, ...filters });

    /* mapeia header → campo da API */
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

    /* efeito inicial (mudou endpoint) */
    useEffect(() => {
        setFilters({});
        setSelectedType({ label: "Todos", value: "" });
        setSortFieldUi(undefined);
        fetchPage(1, baseParams);
    }, [endpoint]);



    useEffect(() => {
        setFilters(prev => {
            /* copia mutável */
            const next = { ...prev };
            let changed = false;

            if (debouncedSearch.length >= 3) {
                if (next.search !== debouncedSearch) {
                    next.search = debouncedSearch;
                    changed = true;
                }
            } else {
                if ("search" in next) {
                    delete next.search;         // limpa filtro quando < 3 caracteres
                    changed = true;
                }
            }

            return changed ? next : prev;   // evita render extra se nada mudou
        });
    }, [debouncedSearch]);

    /* -----------------------------------------------------------
     * efeito: sempre que filters OU baseParams mudarem → nova busca
     * ----------------------------------------------------------- */
    useEffect(() => {
        fetchPage(1, { ...baseParams, ...filters });
    }, [baseParams, filters]);

    useEffect(() => {
        if (setTotalItems && totalItems !== undefined) setTotalItems(totalItems);
    }, [totalItems]);

    /* SORT */
    const handleSort = (header: string) => {
        const nextDir = sortFieldUi === header && sortDirUi === "asc" ? "desc" : "asc";
        setSortFieldUi(header);
        setSortDirUi(nextDir);

        const apiField = fieldMap[header];
        const newFilters = { ...filters, sort: `${apiField},${nextDir}` };
        setFilters(newFilters);
        fetchPage(1, { ...baseParams, ...newFilters });
    };

    /* FILTRO TIPO */
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

    /* MODAL editar */
    const [show, setShow] = useState(false);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);

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
                technicianId: currentFarmer.technician?.id,
                ownedArea: currentFarmer.ownedArea,
                leasedArea: currentFarmer.leasedArea,
                branch: currentFarmer.branch?.id
            };
            const res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, body);
            if (res.status === 200 || res.status === 201) {
                toast.success("Produtor atualizado com sucesso!");
                fetchPage(currentPage, { ...baseParams, ...filters });
                setShow(false);
            }
        } catch {
            toast.error("Erro ao atualizar o produtor.");
        }
    };

    /* UI */
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
                    {!farmers.length ? (
                        <h5 className="fw-bold mx-auto my-3">Nenhum dado encontrado.</h5>
                    ) : isLoading ? (
                        <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                            <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                        </div>
                    ) : (
                        <CustomTable
                            headers={[
                                "Matrícula", "Tipo", "Nome", "Situação", "Carteira", "Técnico",
                                "Própria", "Arrendada", "Total", "Ações"
                            ]}
                            sortField={sortFieldUi}
                            sortDir={sortDirUi}
                            onSort={handleSort}
                        >
                            {farmers.map(f => (
                                <tr key={Number(f.registrationNumber)}>
                                    <td>{f.registrationNumber}</td>
                                    <td>{f.type?.id ?? "-"}</td>
                                    <td>{f.name}</td>
                                    <td>{StatusLabels[f.status]}</td>
                                    <td>{f.branch?.name ?? "Sem carteira vinculada"}</td>
                                    <td>{f.technician?.name ?? "Sem técnico"}</td>
                                    <td>{f.ownedArea} ha</td>
                                    <td>{f.leasedArea} ha</td>
                                    <td>{(f.ownedArea ?? 0) + (f.leasedArea ?? 0)} ha</td>
                                    <td>
                                        <button className="button_edit"
                                            onClick={() => { setCurrentFarmer(f); setShow(true); }}>
                                            <FaPen /> Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </CustomTable>
                    )}
                </Pagination>
            </div>

            {/* modal editar */}
            <FarmerModal
                show={show}
                onClose={() => { setShow(false); setCurrentFarmer(null); }}
                onSubmit={handleSubmitFarmer}
                currentFarmer={currentFarmer}
                modalMode="edit"
                onChange={(field, value) => setCurrentFarmer(p => p ? { ...p, [field]: value } : p)}
            />
        </div>
    );
};

export default ReportByFarmer;
