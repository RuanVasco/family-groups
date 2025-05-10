import { useEffect, useState } from "react";
import { FaPen, FaPlus } from "react-icons/fa6";
import { toast } from "react-toastify";
import { FarmerType } from "../Type/FarmerType";
import axiosInstance from "../axiosInstance";
import { StatusLabels } from "../Enum/StatusEnum";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import { UserType } from "../Type/UserType";
import Pagination from "./Pagination";
import FarmerModal from "./FarmerModal";

const Farmer = () => {
    const [farmers, setFarmers] = useState<FarmerType[]>([]);
    const [currentFarmer, setCurrentFarmer] = useState<Partial<FarmerType> | null>(null);
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupType[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [show, setShow] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchValue, setSearchValue] = useState<string>("");

    const fetchFarmers = async (page = 1, size = 10) => {
        try {
            const res = await axiosInstance.get(`/farmer?page=${page - 1}&size=${size}`);
            if (res.status === 200) {
                setFarmers(res.data.content);
                setTotalPages(res.data.totalPages);
                setCurrentPage(res.data.number + 1);
                setTotalItems(res.data.totalElements);
            }
        } catch (error) {
            toast.error("Erro ao buscar os produtores");
        }
    };

    useEffect(() => {
        fetchFarmers(currentPage, itemsPerPage);
    }, [currentPage, itemsPerPage]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axiosInstance.get("/farmer", {
                    params: {
                        search: searchValue.length >= 3 ? searchValue : undefined,
                        page: currentPage - 1,
                        size: itemsPerPage,
                    },
                });

                if (res.status === 200) {
                    setFarmers(res.data.content);
                    setTotalPages(res.data.totalPages);
                    setCurrentPage(res.data.number + 1);
                    setTotalItems(res.data.totalElements);
                }
            } catch (error) {
                toast.error("Erro ao buscar produtores");
            }
        };

        fetch();
    }, [searchValue, currentPage, itemsPerPage]);


    const fetchFamilyGroups = async () => {
        try {
            const res = await axiosInstance.get("/family-group/all");
            if (res.status === 200) {
                setFamilyGroups(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os grupos familiares");
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get("/user");
            if (res.status === 200 || res.status === 201) {
                setUsers(res.data);
            }
        } catch (error) {
            toast.error('Erro ao buscar usuários');
        }
    }

    const handleModalClose = () => setShow(false);

    const openModal = (mode: "create" | "edit", farmer?: FarmerType) => {
        setModalMode(mode);
        setCurrentFarmer(mode === "edit" ? { ...farmer } : null);
        setShow(true);
        fetchFamilyGroups();
        fetchUsers();
    };

    const handleChange = (field: keyof FarmerType, value: any) => {
        setCurrentFarmer(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {
        try {

            if (!currentFarmer?.name || !currentFarmer?.registrationNumber) {
                toast.warn("Preencha todos os campos obrigatórios.");
                return;
            }

            const data = {
                registrationNumber: currentFarmer.registrationNumber,
                name: currentFarmer.name,
                status: currentFarmer.status,
                familyGroupId: currentFarmer.familyGroup?.id,
                technicianId: currentFarmer.technician?.id,
                ownedArea: currentFarmer.ownedArea
            };

            let res;
            let msg: string;

            if (modalMode === "create") {
                res = await axiosInstance.post("/farmer", data);
                msg = "Produtor criado com sucesso!";
            } else {
                res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, data);
                msg = "Produtor atualizado com sucesso!";
            }

            if (res.status === 200 || res.status === 201) {
                toast.success(msg);
                fetchFarmers(currentPage, itemsPerPage);
            }


        } catch (error) {
            toast.error("Erro ao salvar produtor.");
        } finally {
            handleModalClose();
        }
    };

    return (
        <div>
            <div className="my-3 floating_panel d-flex align-items-center justify-content-between">
                <button
                    type="button"
                    className="button_agree"
                    onClick={() => openModal("create")}
                >
                    <FaPlus /> Criar Produtor
                </button>
                <input
                    className="w-50"
                    placeholder="Pesquisar"
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
                <h4 className="fw-bold p-0 m-0">Total de items: {totalItems}</h4>
            </div>

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
                <div className="my-3 floating_panel">
                    <table className="custom_table">
                        <thead>
                            <tr>
                                <th>Ações</th>
                                <th>Matrícula</th>
                                <th>Nome</th>
                                <th>Situação</th>
                                <th>Técnico</th>
                                <th>Grupo familiar</th>
                                <th>Terra própria</th>
                                <th>Terra arrendada</th>
                                <th>Terra total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {farmers.map(farmer => (
                                <tr key={Number(farmer.registrationNumber)}>
                                    <td>
                                        <button
                                            className="button_edit"
                                            onClick={() => openModal("edit", farmer)}
                                        >
                                            <FaPen /> Editar
                                        </button>
                                    </td>
                                    <td>{farmer.registrationNumber}</td>
                                    <td>{farmer.name}</td>
                                    <td>{StatusLabels[farmer.status]}</td>
                                    <td>{farmer.technician?.name || "Sem técnico vinculado"}</td>
                                    <td>{farmer.familyGroup ? (farmer.familyGroup?.principal.name) : ("Sem grupo familiar")}</td>
                                    <td>{farmer.ownedArea || 0} ha</td>
                                    <td>{farmer.leasedArea || 0} ha</td>
                                    <td>
                                        {(farmer.ownedArea || farmer.leasedArea)
                                            ? (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0)
                                            : 0} ha
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Pagination>
            <FarmerModal
                show={show}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
                currentFarmer={currentFarmer}
                familyGroups={familyGroups}
                users={users}
                modalMode={modalMode}
                onChange={handleChange}
            />
        </div>
    );
};

export default Farmer;
