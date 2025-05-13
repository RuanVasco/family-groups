import { useEffect, useState } from "react";
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

interface Props {
    branch?: BranchType;
    technician?: UserType;
    setTotalItems?: (total: number) => void;
}

const ReportByFarmer = ({ branch, technician, setTotalItems }: Props) => {
    /* paginação */
    const [pageSize, setPageSize] = useState(10);

    /* ordenação (UI) */
    const [sortFieldUi, setSortFieldUi] = useState<string>();
    const [sortDirUi, setSortDirUi] = useState<"asc" | "desc">("asc");

    /* endpoint + filtros base */
    const endpoint = branch
        ? `/farmer/by-branch/${branch.id}`
        : "/farmer/by-technician";

    const baseParams =
        !branch && technician           // technician = null quando “sem técnico”
            ? { userId: technician.id }   // só envia se houver técnico
            : undefined;

    /* modal */
    const [show, setShow] = useState(false);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);

    /* hook paginado */
    const {
        data: farmers,
        currentPage,
        totalPages,
        totalItems,
        isLoading,
        fetchPage,
        setPageSize: updatePageSize,
    } = usePaginatedFetchData<FarmerType>(endpoint, pageSize, baseParams);

    const [selectedType, setSelectedType] = useState<{ label: string; value: string } | null>({
        label: "Todos",
        value: "",
    });


    /* mapeia header → campo da API */
    const fieldMap: Record<string, string> = {
        "Matrícula": "registrationNumber",
        "Tipo": "type",
        "Nome": "name",
        "Situação": "status",
        "Técnico": "technician.name",
        "Carteira": "branch",
        "Área própria": "ownedArea",
        "Área arrendada": "leasedArea",
        "Área total": "totalArea",
    };

    /* primeira carga */
    useEffect(() => {
        setSelectedType({
            label: "Todos",
            value: "",
        });
        fetchPage(1);
    }, [endpoint]);

    /* quando sort muda → recarrega página 1 */
    useEffect(() => {
        if (!sortFieldUi) return;
        const apiField = fieldMap[sortFieldUi];
        fetchPage(1, {
            sort: `${apiField},${sortDirUi}`,
            typeId: selectedType?.value || undefined,
        });
    }, [sortFieldUi, sortDirUi, selectedType]);

    useEffect(() => {
        if (setTotalItems && totalItems) {
            setTotalItems(totalItems);
        }
    }, [setTotalItems, totalItems]);

    /* clique no cabeçalho */
    const handleSort = (header: string) => {
        const nextDir = sortFieldUi === header && sortDirUi === "asc" ? "desc" : "asc";
        setSortFieldUi(header);
        setSortDirUi(nextDir);

        const apiField = fieldMap[header];
        fetchPage(1, {
            sort: `${apiField},${nextDir}`,
            typeId: selectedType?.value || undefined,
        });
    };


    const handleType = (selectedOption: any) => {
        setSelectedType(selectedOption);
        const typeFilter = selectedOption?.value || undefined;
        fetchPage(1, { typeId: typeFilter });
    };

    /* editar produtor */
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
            const res = await axiosInstance.put(
                `/farmer/${currentFarmer.registrationNumber}`, body
            );
            if (res.status === 200 || res.status === 201) {
                toast.success("Produtor atualizado com sucesso!");
                fetchPage(currentPage);
                setShow(false);
            }
        } catch {
            toast.error("Erro ao atualizar o produtor.");
        }
    };

    /* loading / vazio */
    if (isLoading)
        return (
            <div className="d-flex justify-content-center align-items-center py-5" style={{ height: "100px" }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );


    /* tabela + paginação */
    return (
        <div className="pt-3 px-4 pb-5">
            <div className="floating_panel my-4 px-4">
                <Select
                    className="my-2 w-25"
                    options={[
                        { label: "Todos", value: "" },
                        { label: "1 - Pessoa Física Associado", value: "1" },
                        { label: "2 - Pessoa Física Terceiro", value: "2" },
                        { label: "3 - Pessoa Juridica Associado", value: "3" },
                        { label: "4 - Pessoa Juridica Terceiro", value: "4" },
                    ]}
                    onChange={handleType}
                    value={selectedType}
                />
                <Pagination
                    itemsPerPage={pageSize}
                    onItemsPerPageChange={(val) => { setPageSize(val); updatePageSize(val); }}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={fetchPage}
                >
                    {!farmers.length ? (
                        <h5 className="fw-bold mx-auto my-3">Nenhum dado encontrado.</h5>
                    ) : (
                        <CustomTable
                            headers={[
                                "Matrícula", "Tipo", "Nome", "Situação", "Carteira", "Técnico",
                                "Área própria", "Área arrendada", "Área total", "Ações",
                            ]}
                            columnWidths={[
                                "100px",
                                "90px",
                                "undefined",
                                "100px"
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
                                    <td>{f.ownedArea} ha</td>
                                    <td>{f.leasedArea} ha</td>
                                    <td>{(f.ownedArea ?? 0) + (f.leasedArea ?? 0)} ha</td>
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

            {/* modal */}
            <FarmerModal
                show={show}
                onClose={() => { setShow(false); setCurrentFarmer(null); }}
                onSubmit={handleSubmitFarmer}
                currentFarmer={currentFarmer}
                modalMode="edit"
                onChange={(field, value) =>
                    setCurrentFarmer(p => p ? { ...p, [field]: value } : p)
                }
            />
        </div>
    );
};

export default ReportByFarmer;
