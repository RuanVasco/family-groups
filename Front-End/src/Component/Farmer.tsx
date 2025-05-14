// Farmer.tsx
import { useEffect, useState } from "react";
import { FaPen, FaPlus } from "react-icons/fa6";
import { toast } from "react-toastify";
import { FarmerType } from "../Type/FarmerType";
import axiosInstance from "../axiosInstance";
import { StatusLabels } from "../Enum/StatusEnum";
import Pagination from "./Common/Pagination";
import FarmerModal from "./FarmerModal";
import { usePaginatedFetchData } from "../Hook/usePaginatedFetchData";
import CustomTable from "./Common/CustomTable";

const Farmer = () => {
    /** ───────────────────────   estados de filtro  ─────────────────────── */
    const [searchValue, setSearchValue] = useState("");
    const [pageSize, setPageSize] = useState(10);        // tamanho do select
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [show, setShow] = useState(false);
    const [currentFarmer, setCurrentFarmer] =
        useState<Partial<FarmerType> | null>(null);

    /** ──────────────────── hook de paginação reutilizável ────────────────── */
    const {
        data: farmers,
        currentPage,
        totalPages,
        totalItems,
        isLoading,
        fetchPage,
        setPageSize: hookSetPageSize,
    } = usePaginatedFetchData<FarmerType>("/farmer", pageSize);

    /** ────────── 1ª carga (page 1, sem filtro) ────────── */
    useEffect(() => {
        fetchPage(1);
    }, []);

    /** ────────── quando o usuário digita a pesquisa ────────── */
    useEffect(() => {
        // Debounce simples (300 ms) para não bater na API a cada tecla
        const id = setTimeout(() => {
            const filters =
                searchValue.length >= 3 ? { value: searchValue.trim() } : {};
            fetchPage(1, filters);
        }, 300);

        return () => clearTimeout(id);
    }, [searchValue]);

    /** ────────── callbacks auxiliares ────────── */
    const openModal = (mode: "create" | "edit", farmer?: FarmerType) => {
        setModalMode(mode);
        setCurrentFarmer(mode === "edit" ? { ...farmer } : null);
        setShow(true);
    };

    const handleModalClose = () => setShow(false);

    const handleChange = (field: keyof FarmerType, value: any) =>
        setCurrentFarmer((prev) => ({ ...prev, [field]: value }));

    /** ────────── cria / edita produtor ────────── */
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

    /** ───────────────────────  UI ─────────────────────── */
    return (
        <div className="pt-3 px-4 pb-5">
            {/* Barra de ações */}
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

            {/* Tabela com paginação */}
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
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : farmers.length === 0 ? (
                        <h4 className="py-3 text-center fw-bold">Nenhum produtor encontrado.</h4>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <CustomTable
                                headers={[
                                    "Ações", "Matrícula", "Nome", "Situação", "Técnico", "Carteira", "Grupo familiar", "Terra própria", "Terra arrendada", "Terra total"
                                ]}
                            >
                                {farmers.map((f) => (
                                    <tr key={Number(f.registrationNumber)}>
                                        <td>
                                            <button
                                                className="button_edit"
                                                onClick={() => openModal("edit", f)}
                                            >
                                                <FaPen /> Editar
                                            </button>
                                        </td>
                                        <td>{f.registrationNumber}</td>
                                        <td>{f.name}</td>
                                        <td>{StatusLabels[f.status]}</td>
                                        <td>{f.technician?.name ?? "Sem técnico vinculado"}</td>
                                        <td>{f.branch?.name ?? "Sem carteira vinculada"}</td>
                                        <td>
                                            {f.familyGroup
                                                ? f.familyGroup.principal.name
                                                : "Sem grupo familiar"}
                                        </td>
                                        <td>{f.ownedArea ?? 0} ha</td>
                                        <td>{f.leasedArea ?? 0} ha</td>
                                        <td>{(f.ownedArea ?? 0) + (f.leasedArea ?? 0)} ha</td>
                                    </tr>
                                ))}
                            </CustomTable>
                        </div>
                        // <table className="custom_table">
                        //     <thead>
                        //         <tr>
                        //             <th>Ações</th>
                        //             <th>Matrícula</th>
                        //             <th>Nome</th>
                        //             <th>Situação</th>
                        //             <th>Técnico</th>
                        //             <th>Carteira</th>
                        //             <th>Grupo familiar</th>
                        //             <th>Terra própria</th>
                        //             <th>Terra arrendada</th>
                        //             <th>Terra total</th>
                        //         </tr>
                        //     </thead>
                        //     <tbody>

                        //     </tbody>
                        // </table>
                    )}
                </div>
            </Pagination>

            {/* Modal de criar/editar */}
            <FarmerModal
                show={show}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
                currentFarmer={currentFarmer}
                modalMode={modalMode}
                onChange={handleChange}
            />
        </div>
    );
};

export default Farmer;
