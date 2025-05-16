import { useFetchItem } from "../../Hook/useFetchItem";
import { FarmerType } from "../../Type/FarmerType";
import { UserType } from "../../Type/UserType";
import { useEffect, useState } from "react";
import FarmerModal from "../FarmerModal";
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
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);
    const [show, setShow] = useState(false);
    const [useFamilyGroups, setUseFamilyGroups] = useState<FamilyGroupReport[]>([]);

    useEffect(() => {
        if (familyGroups) {
            setUseFamilyGroups(familyGroups);
        }
    }, [familyGroups]);

    const handleEditFarmer = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShow(true);
    };

    const handleSubmitFarmer = async () => {
        try {
            if (!currentFarmer?.registrationNumber || !currentFarmer.name) {
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
                leasedArea: currentFarmer.leasedArea,
                branch: currentFarmer.branch?.id
            }

            const res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, data);

            if (res.status === 200 || res.status === 201) {

                if (useFamilyGroups) {
                    const group = useFamilyGroups.find(fg =>
                        fg.members.some(member => member.registrationNumber === currentFarmer.registrationNumber)
                    );

                    if (group) {
                        const member = group.members.find(m => m.registrationNumber === currentFarmer.registrationNumber);
                        if (member) {
                            member.registrationNumber = currentFarmer.registrationNumber;
                            member.name = currentFarmer.name;
                            member.status = currentFarmer.status;
                            member.familyGroup = currentFarmer.familyGroup;
                            member.technician = currentFarmer.technician;
                            member.ownedArea = currentFarmer.ownedArea;
                            member.leasedArea = currentFarmer.leasedArea;
                            member.branch = currentFarmer.branch;
                        }
                    }
                }

                toast.success("Produtor atualizado com sucesso!");
                setShow(false);
            }
        } catch (error) {
            toast.error("Erro ao atualizar o produtor.");
        }
    };

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
                                    onEditFarmer={handleEditFarmer}
                                />
                            </div>
                        ))
                    }
                </div>
            )}

            <FarmerModal
                show={show}
                onClose={() => {
                    setShow(false)
                    setCurrentFarmer(null);
                }}
                onSubmit={handleSubmitFarmer}
                currentFarmer={currentFarmer}
                modalMode="edit"
                onChange={(field, value) =>
                    setCurrentFarmer(prev => prev ? { ...prev, [field]: value } : prev)
                }
            />
        </div>
    )
}

export default ReportByFamilyGroup;
