import { useEffect, useState } from "react";
import { UserType } from "../Type/UserType";
import { toast } from "react-toastify";
import axiosInstance from "../axiosInstance";
import { StatusLabels } from "../Enum/StatusEnum";
import { FarmerType } from "../Type/FarmerType";
import Select from "react-select";
import { BranchType } from "../Type/BranchType";

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

const Report = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<BranchType | null>(null);
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupReport[]>([]);
    const [farmers, setFarmers] = useState<FarmerType[]>([]);
    const [branchs, setBranchs] = useState<BranchType[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [reportType, setReportType] = useState<OptionType | null>(null);
    const [reportMode, setReportMode] = useState<OptionType | null>({ label: "Por técnico", value: "byTechnician" });

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

    const fetchFarmers = async () => {
        if (reportMode?.value === "byBranch" && !selectedBranch) return;
        if (reportMode?.value === "byTechnician" && !selectedUser) return;

        try {
            let res;

            if (reportMode?.value === "byBranch") {
                res = await axiosInstance.get(`/farmer/by-branch/${selectedBranch.id}`);
            } else {
                res = await axiosInstance.get(`/farmer/by-technician/${selectedUser.id}`);
            }

            if (res.status === 200 || res.status === 201) {
                setFarmers(res.data);
                setTotalItems(res.data.length);
            }
        } catch (error) {
            toast.error("Erro ao buscar produtores do técnico.");
        }
    };

    useEffect(() => {
        if (!reportMode) return

        setFarmers([]);
        setFamilyGroups([]);
        setSelectedUser(null);

        if (reportMode.value === "byBranch") {
            fetchBranchs();
        } else {
            fetchUsers();
        }
    }, [reportMode]);

    useEffect(() => {
        if (!selectedUser || !reportType) return;

        if (reportType.value === "familyGroup") {
            setFarmers([]);
            fetchFamilyGroups();
        } else if (reportType.value === "farmer") {
            setFamilyGroups([]);
            fetchFarmers();
        }
    }, [reportType, selectedUser]);

    useEffect(() => {
        if (!selectedUser || !reportType) return;

        if (reportType.value === "familyGroup") {
            setFarmers([]);
            fetchFamilyGroups();
        } else if (reportType.value === "farmer") {
            setFamilyGroups([]);
            fetchFarmers();
        }
    }, [selectedUser?.id, reportType?.value]);

    return (
        <main className="container-fluid">
            <div className="floating_panel my-3 d-flex align-items-center justify-content-between">
                <div className="d-flex gap-2">
                    <Select
                        placeholder="Selecione o modo"
                        options={[
                            { value: "byTechnician", label: "Por técnico" },
                            { value: "byBranch", label: "Por carteira" }
                        ]}
                        value={reportMode}
                        onChange={(option) => setReportMode(option)}
                        isClearable
                    />
                    {reportMode?.value === "byTechnician" ? (
                        <>
                            <Select
                                placeholder="Selecione um técnico"
                                options={users.map(user => ({
                                    value: user.id,
                                    label: user.name
                                }))}
                                value={
                                    selectedUser
                                        ? { value: selectedUser.id, label: selectedUser.name }
                                        : null
                                }
                                onChange={(option) => {
                                    const user = users.find(u => u.id === option?.value);
                                    setSelectedUser(user || null);
                                }}
                                isClearable
                            />
                            <Select<OptionType>
                                placeholder="Selecione um método"
                                options={[
                                    { value: "farmer", label: "Por produtor" },
                                    { value: "familyGroup", label: "Por grupo familiar" }
                                ]}
                                value={reportType}
                                onChange={(option) => setReportType(option)}
                                isClearable
                            />
                        </>
                    ) : (
                        <Select
                            placeholder="Selecione uma carteira"
                            options={branchs.map(branch => ({
                                value: branch.id,
                                label: branch.name
                            }))}
                            value={
                                selectedBranch
                                    ? { value: selectedBranch.id, label: selectedBranch.name }
                                    : null
                            }
                            onChange={(option) => {
                                const branch = branchs.find(b => b.id === option?.value);
                                setSelectedBranch(branch || null);
                            }}
                            isClearable
                        />
                    )}

                </div>
                <h4 className="fw-bold m-0 p-0 me-2">Total de itens: {totalItems}</h4>
            </div>

            {farmers.length > 0 && (() => {
                const totalArea = farmers.reduce(
                    (acc, farmer) => acc + (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0),
                    0
                );

                return (
                    <table className="striped">
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
                            {farmers.map((farmer) => (
                                <tr key={Number(farmer.registrationNumber)}>
                                    <td>{farmer.registrationNumber}</td>
                                    <td>{farmer.name}</td>
                                    <td>{StatusLabels[farmer.status]}</td>
                                    <td>{farmer.technician?.name || "Sem técnico vinculado"}</td>
                                    <td>{farmer.ownedArea} ha</td>
                                    <td>{farmer.leasedArea} ha</td>
                                    <td>{(farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0)} ha</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={6} className="text-end fw-bold">Total da área:</td>
                                <td className="fw-bold">{totalArea.toFixed(2)} ha</td>
                            </tr>
                        </tfoot>
                    </table>
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
                        <table className="striped">
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
                        <table className="mt-3">
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
                );
            })}
        </main>

    );
}

export default Report;
