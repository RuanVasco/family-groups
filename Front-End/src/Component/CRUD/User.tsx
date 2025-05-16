import { useState, useEffect } from "react";
import axiosInstance from "../../axiosInstance";
import { toast } from "react-toastify";
import { UserType } from "../../Type/UserType";
import { BranchType } from "../../Type/BranchType";
import { FaPen, FaPlus } from "react-icons/fa6";
import { Modal, Button, Form } from "react-bootstrap";
import Select from "react-select";
import Pagination from "../Common/Pagination";
import { usePaginatedFetchData } from "../../Hook/usePaginatedFetchData";
import CustomTable from "../Common/CustomTable";

const roleOptions = [
    { value: "ROLE_ADMIN", label: "Administrador" },
    { value: "ROLE_TECHNICIAN", label: "Técnico" },
];

const User = () => {
    /** ────────── filtros locais ────────── */
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(10);

    /** ────────── modal ────────── */
    const [branchs, setBranchs] = useState<BranchType[]>([]);
    const [currentUser, setCurrentUser] =
        useState<Partial<UserType> | null>(null);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [show, setShow] = useState(false);

    /** ────────── hook paginado ────────── */
    const {
        data: users,
        currentPage,
        totalPages,
        totalItems,
        isLoading,
        fetchPage,
        setPageSize: hookSetPageSize,
    } = usePaginatedFetchData<UserType>("/user", pageSize);

    /** 1ª carga + filtros */
    useEffect(() => {
        fetchPage(1);
    }, []);

    /** pesquisa (debounce 300 ms) */
    useEffect(() => {
        const id = setTimeout(() => {
            const filters = search.length >= 3 ? { value: search.trim() } : {};
            fetchPage(1, filters);
        }, 300);
        return () => clearTimeout(id);
    }, [search]);

    /** ─────── carteiras para select ─────── */
    const fetchBranchs = async () => {
        try {
            const { data } = await axiosInstance.get("/branch");
            setBranchs(data);
        } catch {
            toast.error("Erro ao buscar carteiras");
        }
    };

    /** ────────── modal helpers ────────── */
    const openModal = (mode: "create" | "edit", user?: UserType) => {
        fetchBranchs();
        setModalMode(mode);
        setCurrentUser(mode === "edit" ? { ...user, password: "" } : null);
        setShow(true);
    };
    const closeModal = () => setShow(false);
    const handleChange = (field: keyof UserType, val: any) =>
        setCurrentUser((p) => ({ ...p, [field]: val }));

    /** ────────── salvar usuário ────────── */
    const handleSubmit = async () => {
        if (!currentUser?.username || !currentUser.roles?.length || !currentUser.name) {
            toast.warn("Preencha usuário, nome e perfis.");
            return;
        }

        const body = {
            username: currentUser.username,
            name: currentUser.name,
            password: currentUser.password,
            roles: currentUser.roles,
            branchId: currentUser.branch?.id ?? "",
        };

        try {
            const res =
                modalMode === "create"
                    ? await axiosInstance.post("/auth/register", body)
                    : await axiosInstance.put(`/user/${currentUser.id}`, body);

            if (res.status === 200 || res.status === 201) {
                toast.success(
                    modalMode === "create" ? "Usuário criado com sucesso!" : "Usuário atualizado com sucesso!"
                );
                fetchPage(currentPage); // mantém filtros
            }
        } catch {
            toast.error("Erro ao salvar usuário");
        } finally {
            closeModal();
        }
    };

    /* ─────────────────────── UI ─────────────────────── */
    return (
        <div className="pt-3 px-4 pb-5">
            {/* barra superior */}
            <div className="my-3 floating_panel d-flex align-items-center justify-content-between">
                <button className="button_agree" onClick={() => openModal("create")}>
                    <FaPlus /> Criar Usuário
                </button>

                <input
                    className="w-50"
                    placeholder="Pesquisar (mín. 3 letras)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <h4 className="fw-bold m-0">Total: {totalItems}</h4>
            </div>

            {/* tabela + paginação */}
            <Pagination
                itemsPerPage={pageSize}
                onItemsPerPageChange={(val) => {
                    setPageSize(val);
                    hookSetPageSize(val);            // já chama fetchPage(1)
                }}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) =>
                    fetchPage(p, search.length >= 3 ? { value: search } : {})
                }
            >
                <div className="my-3 floating_panel">
                    {isLoading ? (
                        <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                            <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                        </div>
                    ) : users.length === 0 ? (
                        <p className="p-3">Nenhum usuário encontrado.</p>
                    ) : (
                        <CustomTable
                            headers={["Ações", "ID", "Usuário", "Nome", "Perfis", "Carteira"]}
                        >

                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <button
                                            className="button_edit"
                                            onClick={() => openModal("edit", u)}
                                        >
                                            <FaPen /> Editar
                                        </button>
                                    </td>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.name}</td>
                                    <td>{u.roles.join(", ")}</td>
                                    <td>{u.branch?.name ?? "Sem carteira"}</td>
                                </tr>
                            ))}
                        </CustomTable>
                    )}
                </div>
            </Pagination>

            {/* modal criar/editar */}
            <Modal show={show} onHide={closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === "create" ? "Criar Usuário" : "Editar Usuário"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>
                            Usuário <span className="required-asterisk">*</span>
                        </Form.Label>
                        <Form.Control
                            value={currentUser?.username ?? ""}
                            onChange={(e) => handleChange("username", e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>
                            Nome <span className="required-asterisk">*</span>
                        </Form.Label>
                        <Form.Control
                            value={currentUser?.name ?? ""}
                            onChange={(e) => handleChange("name", e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Senha</Form.Label>
                        <Form.Control
                            type="password"
                            value={currentUser?.password ?? ""}
                            onChange={(e) => handleChange("password", e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>
                            Perfis <span className="required-asterisk">*</span>
                        </Form.Label>
                        <Select
                            isMulti
                            options={roleOptions}
                            value={roleOptions.filter((o) =>
                                currentUser?.roles?.includes(o.value)
                            )}
                            onChange={(opts) =>
                                handleChange(
                                    "roles",
                                    opts.map((o) => o.value)
                                )
                            }
                            placeholder="Selecione perfis"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Carteira</Form.Label>
                        <Form.Select
                            value={currentUser?.branch?.id ?? ""}
                            onChange={(e) =>
                                handleChange("branch", {
                                    id: Number(e.target.value) || undefined,
                                    name: branchs.find((b) => b.id === Number(e.target.value))
                                        ?.name,
                                })
                            }
                        >
                            <option value="">Nenhuma</option>
                            {branchs.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {modalMode === "create" ? "Criar" : "Atualizar"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default User;
