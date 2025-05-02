import { useEffect, useState } from "react";
import { UserType } from "../Type/UserType";
import { toast } from "react-toastify";
import axiosInstance from "../axiosInstance";
import { StatusLabels } from "../Enum/StatusEnum";
import { FarmerType } from "../Type/FarmerType";
import Select from "react-select";

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

const Report = () => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupReport[]>([]);

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
                console.log(res.data)
                setFamilyGroups(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar produtores do técnico.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchFamilyGroups();
    }, [selectedUser]);

    return (
        <main className="container-fluid">
            <div className="floating_panel my-3 d-flex align-items-center">
                <Select
                    placeholder="Selecione um técnico"
                    options={users.map(user => ({
                        value: user.id,
                        label: user.username
                    }))}
                    value={
                        selectedUser
                            ? { value: selectedUser.id, label: selectedUser.username }
                            : null
                    }
                    onChange={(option) => {
                        const user = users.find(u => u.id === option?.value);
                        setSelectedUser(user || null);
                    }}
                    isClearable
                />
            </div>

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
                                            <td>{p.technician?.username || "Sem técnico vinculado"} - {p.technician?.branch?.name || ""} </td>
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
