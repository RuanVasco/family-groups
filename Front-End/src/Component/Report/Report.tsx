import { useEffect, useState } from "react";
import { UserType } from "../../Type/UserType";
import { toast } from "react-toastify";
import axiosInstance from "../../axiosInstance";
import { StatusEnum, StatusLabels } from "../../Enum/StatusEnum";
import { FarmerType } from "../../Type/FarmerType";
import Select from "react-select";
import { BranchType } from "../../Type/BranchType";
import { FaPen } from "react-icons/fa6";
import { Button, Form, Modal } from "react-bootstrap";
import { FamilyGroupType } from "../../Type/FamilyGroupType";
import ReportFilters from "./ReportFilters";

interface FamilyGroupReport {
    familyGroupId: number;
    principal: FarmerType;
    members: FarmerType[];
    canolaArea: number,
    wheatArea: number,
    cornSilageArea: number,
    grainCornArea: number,
    beanArea: number,
    soybeanArea: number
}

interface OptionType {
    label: string;
    value: string;
}

interface ReportProps {
    branch: BranchType;
}


const Report = ({ branch }: ReportProps) => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<BranchType | null>(null);
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupReport[]>([]);
    const [allFamilyGroups, setAllFamilyGroups] = useState<FamilyGroupType[]>([]);
    const [currentFarmer, setCurrentFarmer] = useState<Partial<FarmerType> | null>(null);
    const [farmers, setFarmers] = useState<FarmerType[]>([]);
    const [branchs, setBranchs] = useState<BranchType[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [reportType, setReportType] = useState<OptionType | null>(null);
    const [reportMode, setReportMode] = useState<OptionType | null>(null);
    const [show, setShow] = useState(false);
    // const [searchValue, setSearchValue] = useState<string>("");

    const fetchBranchs = async () => {
        try {
            const res = await axiosInstance.get(`/branch`);

            if (res.status === 200 || res.status === 201) {
                setBranchs(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar técnicos.")
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get(`/user`);

            if (res.status === 200 || res.status === 201) {
                setUsers(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar técnicos.")
        }
    }

    const fetchFamilyGroups = async () => {
        if (!selectedUser) return;

        try {
            const res = await axiosInstance.get(`/family-group/by-technician/${selectedUser.id}`);
            if (res.status === 200 || res.status === 201) {
                setFamilyGroups(res.data);
                setTotalItems(res.data.length);
            }
        } catch (error) {
            toast.error("Erro ao buscar produtores do técnico.");
        }
    };

    const fetchAllFamilyGroups = async () => {
        try {
            const res = await axiosInstance.get("/family-group/all");
            if (res.status === 200) {
                setAllFamilyGroups(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os grupos familiares");
        }
    }

    const fetchFarmers = async () => {
        try {
            let res;

            if (reportMode?.value === "byBranch") {
                if (!selectedBranch) return;
                res = await axiosInstance.get(`/farmer/by-branch/${selectedBranch.id}`);
            } else {
                res = await axiosInstance.get(`/farmer/by-technician`, {
                    params: selectedUser ? { userId: selectedUser.id } : {},
                });
            }

            if (res.status === 200 || res.status === 201) {
                setFarmers(res.data);
                setTotalItems(res.data.length);
            }
        } catch (error) {
            toast.error("Erro ao buscar produtores do técnico.");
        }
    };

    const openModal = (farmer: FarmerType) => {
        fetchAllFamilyGroups();
        setCurrentFarmer(farmer);
        setShow(true);
    }

    const handleModalClose = () => {
        setCurrentFarmer(null);
        setShow(false)
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
                ownedArea: currentFarmer.ownedArea,
                leasedArea: currentFarmer.leasedArea
            };

            let res;
            let msg: string;
            res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, data);
            msg = "Produtor atualizado com sucesso!";

            if (res.status === 200 || res.status === 201) {
                fetchFarmers();
                toast.success(msg);
            }


        } catch (error) {
            toast.error("Erro ao salvar produtor.");
        } finally {
            handleModalClose();
        }
    };

    // useEffect(() => {
    //     if (!branch) return

    //     fetchFarmers();
    // }, [branch]);

    useEffect(() => {
        if (!reportMode) return

        setFarmers([]);
        setFamilyGroups([]);
        setSelectedUser(null);
        setSelectedBranch(null);
        setReportType(null);

        if (reportMode.value === "byBranch") {
            fetchBranchs();
        } else {
            fetchUsers();
        }
    }, [reportMode?.value]);

    useEffect(() => {
        if (!reportType || reportType.value !== "familyGroup") return;
        if (!selectedUser) return;
        setFarmers([]);
        setFamilyGroups([]);

        fetchFamilyGroups();
    }, [selectedUser, reportType]);

    useEffect(() => {
        if (!reportType || reportType.value !== "farmer") return;
        setFarmers([]);
        setFamilyGroups([]);

        fetchFarmers();
    }, [selectedUser, reportType]);

    useEffect(() => {
        if (!selectedUser && reportMode?.value === "byTechnician") {
            setFarmers([]);
            setFamilyGroups([]);

            fetchFarmers();
        }
    }, [reportMode]);

    return (
        <main className="container-fluid">
            <div className="floating_panel my-3 d-flex align-items-center justify-content-between">
                <ReportFilters
                    reportMode={reportMode}
                    setReportMode={setReportMode}
                    users={users}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    branchs={branchs}
                    selectedBranch={selectedBranch}
                    setSelectedBranch={setSelectedBranch}
                    reportType={reportType}
                    setReportType={setReportType}
                />
                <h4 className="fw-bold m-0 p-0 me-2">Total de itens: {totalItems}</h4>
            </div>

            {farmers.length > 0 && (() => {
                const totalArea = farmers.reduce(
                    (acc, farmer) => acc + (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0),
                    0
                );

                return (
                    <div className="floating_panel">
                        <table className="custom_table">
                            <thead>
                                <tr>
                                    <th>Matrícula</th>
                                    <th>Nome</th>
                                    <th>Situação</th>
                                    <th>Técnico</th>
                                    {!selectedUser && reportMode?.value === "byTechnician" && (
                                        <th>Carteira</th>
                                    )}
                                    <th>Área própria</th>
                                    <th>Área arrendada</th>
                                    <th>Área total</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {farmers.map((farmer) => (
                                    <tr key={Number(farmer.registrationNumber)}>
                                        <td>{farmer.registrationNumber}</td>
                                        <td>{farmer.name}</td>
                                        <td>{StatusLabels[farmer.status]}</td>
                                        <td>{farmer.technician?.name || "Sem técnico vinculado"}</td>
                                        {!selectedUser && reportMode?.value === "byTechnician" && (
                                            <td>{farmer.branch?.name}</td>
                                        )}
                                        <td>{farmer.ownedArea} ha</td>
                                        <td>{farmer.leasedArea} ha</td>
                                        <td>{(farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0)} ha</td>
                                        <td>
                                            <button
                                                className="button_edit"
                                                onClick={() => openModal(farmer)}
                                            >
                                                <FaPen /> Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={7} className="text-end fw-bold">Total da área:</td>
                                    <td className="fw-bold">{totalArea.toFixed(2)} ha</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                );
            })()}

            {familyGroups.length > 0 && familyGroups.map((f) => {
                const farmers = f.members || [];
                const totalArea = farmers.reduce(
                    (acc, farmer) => acc + (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0),
                    0
                );

                return (
                    <div key={f.familyGroupId} className="my-5">
                        <h4 className="fw-bold mb-2">
                            Grupo Familiar #{f.familyGroupId} – Principal: {f.principal.name}
                        </h4>
                        <div className="floating_panel">
                            <table className="custom_table">
                                <thead>
                                    <tr>
                                        <th>Matrícula</th>
                                        <th>Nome</th>
                                        <th>Situação</th>
                                        <th>Técnico</th>
                                        <th>Área própria</th>
                                        <th>Área arrendada</th>
                                        <th>Área total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {farmers.length > 0 ? (
                                        farmers.map((p) => (
                                            <tr key={Number(p.registrationNumber)}>
                                                <td>{p.registrationNumber}</td>
                                                <td>{p.name}</td>
                                                <td>{StatusLabels[p.status]}</td>
                                                <td>{p.technician?.name || "Sem técnico vinculado"} - {p.technician?.branch?.name || ""} </td>
                                                <td>{p.ownedArea} ha</td>
                                                <td>{p.leasedArea} ha</td>
                                                <td>{(p.ownedArea ?? 0) + (p.leasedArea ?? 0)} ha</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6}>Nenhum produtor vinculado.</td>
                                        </tr>
                                    )}
                                </tbody>
                                {farmers.length > 0 && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan={6} className="text-end fw-bold">
                                                Total da área do grupo:
                                            </td>
                                            <td className="fw-bold">{totalArea.toFixed(2)} ha</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                            <table className="custom_table border-top">
                                <thead>
                                    <tr>
                                        <th>Canola</th>
                                        <th>Trigo</th>
                                        <th>Milho Silagem</th>
                                        <th>Milho Grão</th>
                                        <th>Feijão</th>
                                        <th>Soja</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="fw-bold">
                                        <td>{f.canolaArea} ha</td>
                                        <td>{f.wheatArea} ha</td>
                                        <td>{f.cornSilageArea} ha</td>
                                        <td>{f.grainCornArea} ha</td>
                                        <td>{f.beanArea} ha</td>
                                        <td>{f.soybeanArea} ha</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            <Modal show={show} onHide={handleModalClose} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Editar Produtor
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Matrícula</Form.Label>
                            <Form.Control
                                type="text"
                                value={Number(currentFarmer?.registrationNumber) || ""}
                                onChange={(e) => handleChange("registrationNumber", e.target.value)}
                                disabled
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                required
                                type="text"
                                value={currentFarmer?.name || ""}
                                onChange={(e) => handleChange("name", e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Situação</Form.Label>
                            <Form.Select
                                required
                                value={currentFarmer?.status || ""}
                                onChange={(e) => handleChange("status", e.target.value as StatusEnum)}
                            >
                                <option value="">Selecione uma opção</option>
                                {Object.values(StatusEnum).map((status) => (
                                    <option key={status} value={status}>
                                        {StatusLabels[status]}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Área própria (ha)</Form.Label>
                            <Form.Control
                                required
                                type="number"
                                value={currentFarmer?.ownedArea || 0}
                                onChange={(e) => handleChange("ownedArea", parseFloat(e.target.value))}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Área arrendada (ha)</Form.Label>
                            <Form.Control
                                required
                                type="number"
                                value={currentFarmer?.leasedArea || 0}
                                onChange={(e) => handleChange("leasedArea", parseFloat(e.target.value))}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Grupo Familiar</Form.Label>
                            <Form.Select
                                value={currentFarmer?.familyGroup?.id || ""}
                                onChange={(e) => {
                                    const selectedGroup = allFamilyGroups.find(fg => fg.id === Number(e.target.value));
                                    handleChange("familyGroup", selectedGroup || null);
                                }}
                            >
                                <option value="">Selecione uma opção</option>
                                {allFamilyGroups.length > 0 && (
                                    allFamilyGroups.map((familyGroup) => (
                                        <option key={familyGroup.id} value={familyGroup.id}>
                                            {familyGroup.principal.name}
                                        </option>
                                    ))
                                )}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Técnico</Form.Label>
                            <Select
                                options={users.map((user) => ({
                                    value: user,
                                    label: user.name
                                }))}
                                value={users
                                    .map((user) => ({ value: user, label: user.name }))
                                    .find(opt => opt.value.id === currentFarmer?.technician?.id)}
                                onChange={(selectedOption) => handleChange("technician", selectedOption?.value)}
                                placeholder="Selecione um técnico"
                                isClearable
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Salvar
                    </Button>
                </Modal.Footer>
            </Modal>
        </main>

    );
}

export default Report;
