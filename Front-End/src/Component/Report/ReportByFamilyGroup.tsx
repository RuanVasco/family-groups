import { useFetchItem } from "../../Hook/useFetchItem";
import { FarmerType } from "../../Type/FarmerType";
import { UserType } from "../../Type/UserType";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../axiosInstance";
import FamilyGroupTable from "../FamilyGroupTable";

interface ReportByFamilyGroupProps {
    technician: UserType;
    setTotalItems: (total: number) => void;
}


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

const ReportByFamilyGroup = ({ technician, setTotalItems }: ReportByFamilyGroupProps) => {
    const { data: familyGroups, loading } = useFetchItem<FamilyGroupReport[]>(`/family-group/by-technician/${technician.id}`);
    const [useFamilyGroups, setUseFamilyGroups] = useState<FamilyGroupReport[]>([]);

    useEffect(() => {
        if (familyGroups) {
            setUseFamilyGroups(familyGroups);
        }
    }, [familyGroups]);

    const handlePrincipalChange = async (farmer: FarmerType, familyGroup: FamilyGroupReport) => {
        try {
            const res = await axiosInstance.put(`/family-group/change-principal/${familyGroup.familyGroupId}/${farmer.registrationNumber}`);

            if (res.status === 200 || res.status === 201) {
                setUseFamilyGroups(prevGroups =>
                    prevGroups.map(group =>
                        group.familyGroupId === familyGroup.familyGroupId
                            ? { ...group, principal: farmer }
                            : group
                    )
                );

                toast.success("Principal atualizado.");
            }
        } catch (error) {
            toast.error("Erro ao alterar o principal do grupo.");
        }
    };

    const handleRemoveMember = async (farmer: String, familyGroupId: string) => {
        try {
            const res = await axiosInstance.put(
                `/family-group/remove-member/${familyGroupId}/${farmer}`
            );

            if (res.status === 200 || res.status === 201) {
                setUseFamilyGroups(prevGroups =>
                    prevGroups.map(group =>
                        group.familyGroupId === Number(familyGroupId)
                            ? {
                                ...group,
                                members: group.members.filter(member => member.registrationNumber !== farmer)
                            }
                            : group
                    )
                );

                toast.success("Produtor removido com sucesso!");
            }
        } catch (error) {
            toast.error("Erro ao remover o produtor do grupo familiar.");
        }
    };

    useEffect(() => {
        if (useFamilyGroups) {
            setTotalItems(useFamilyGroups.length);
        }
    }, [useFamilyGroups]);

    return (
        <div className="p-4">
            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "100px" }}>
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div style={{ overflowY: "auto", height: "85vh" }}>
                    {
                        useFamilyGroups && useFamilyGroups.map((f) => (
                            <div className="floating_panel my-3">
                                <FamilyGroupTable
                                    key={f.familyGroupId}
                                    familyGroup={{
                                        id: f.familyGroupId,
                                        principal: f.principal,
                                        members: f.members,
                                        canolaArea: f.canolaArea,
                                        wheatArea: f.wheatArea,
                                        cornSilageArea: f.cornSilageArea,
                                        grainCornArea: f.grainCornArea,
                                        beanArea: f.beanArea,
                                        soybeanArea: f.soybeanArea,
                                    }}
                                    showActions={true}
                                    onMakePrincipal={
                                        (farmer) => handlePrincipalChange(farmer, f)
                                    }
                                    onRemoveFarmer={(farmer) => handleRemoveMember(farmer.registrationNumber, String(f.familyGroupId))}
                                />
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    )
}

export default ReportByFamilyGroup;
