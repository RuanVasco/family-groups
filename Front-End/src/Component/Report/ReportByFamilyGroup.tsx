import { useFetchItem } from "../../Hook/useFetchItem";
import { FarmerType } from "../../Type/FarmerType";
import { UserType } from "../../Type/UserType";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../axiosInstance";
import FamilyGroupTable from "../FamilyGroupTable";
import AssetModal from "../AssetModal";

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

    const [showAssets, setShowAssets] = useState<boolean>(false);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);

    const [groupToRefresh, setGroupToRefresh] = useState<number | null>(null);

    // const [searchTerm, setSearchTerm] = useState("");
    // const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

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

                fetchFamilyGroupByMember(farmer);

                toast.success("Produtor removido com sucesso!");
            }
        } catch (error) {
            toast.error("Erro ao remover o produtor do grupo familiar.");
        }
    };

    const handleOpenAssetModal = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShowAssets(true);
    }

    const handleCloseAssetModal = () => {
        setCurrentFarmer(null);
        setShowAssets(false);
    }

    const fetchFamilyGroupByMember = async (farmerId: String) => {
        try {
            const res = await axiosInstance.get<FamilyGroupReport>(`/family-group/member/${farmerId}`);
            if (res.status === 200 && res.data) {
                const report = res.data;

                setUseFamilyGroups(prev => {
                    let found = false;
                    const updated = prev.map(g => {
                        if (g.familyGroupId === report.familyGroupId) {
                            found = true;
                            return report;
                        }
                        return g;
                    });
                    if (!found) {
                        updated.push(report);
                    }
                    return updated;
                });
            }
        } catch {
            toast.error("Erro ao buscar grupo familiar.");
        }
    };

    useEffect(() => {
        if (useFamilyGroups) {
            setTotalItems(useFamilyGroups.length);
        }
    }, [useFamilyGroups]);

    // useEffect(() => {
    //     const handler = setTimeout(() => {
    //         setDebouncedTerm(searchTerm);
    //     }, 300);

    //     return () => {
    //         clearTimeout(handler);
    //     };
    // }, [searchTerm]);

    // useEffect(() => {
    //     if (!debouncedTerm.trim()) {
    //         setUseFamilyGroups(familyGroups ?? []);
    //         return;
    //     }

    //     const lowerSearch = debouncedTerm.toLowerCase();

    //     const filtered = (familyGroups ?? []).filter(group => {
    //         const principalMatch = group.principal.name.toLowerCase().includes(lowerSearch);
    //         const memberMatch = group.members.some(member =>
    //             member.name.toLowerCase().includes(lowerSearch) ||
    //             member.registrationNumber.toString().includes(lowerSearch)
    //         );
    //         return principalMatch || memberMatch;
    //     });

    //     setUseFamilyGroups(filtered);
    // }, [debouncedTerm, familyGroups]);

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
                    {/* <div className="w-25">
                        <input
                            type="text"
                            placeholder="Pesquisar"
                            className="form-control mb-3"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div> */}
                    {
                        useFamilyGroups && useFamilyGroups.map((f) => (
                            <div key={f.familyGroupId} className="floating_panel my-3">
                                <FamilyGroupTable
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
                                    onMakePrincipal={(farmer) => handlePrincipalChange(farmer, f)}
                                    onRemoveFarmer={(farmer) => handleRemoveMember(farmer.registrationNumber, String(f.familyGroupId))}
                                    onEditAssets={(farmer) => handleOpenAssetModal(farmer)}
                                    groupToRefresh={groupToRefresh}
                                    onRefreshComplete={() => setGroupToRefresh(null)}
                                />
                            </div>
                        ))
                    }

                    <AssetModal
                        show={showAssets}
                        onClose={handleCloseAssetModal}
                        currentFarmer={currentFarmer}
                        setCurrentFarmer={setCurrentFarmer}
                        onChange={() => { }}
                        onFarmerUpdated={(updatedFarmer) => {
                            setUseFamilyGroups(prevGroups =>
                                prevGroups.map(group => {
                                    if (group.familyGroupId === updatedFarmer.familyGroup?.id) {
                                        const members = group.members.map(member =>
                                            member.registrationNumber === updatedFarmer.registrationNumber ? updatedFarmer : member
                                        );
                                        return { ...group, members };
                                    }
                                    return group;
                                })
                            );
                        }}
                        onOtherFarmerUpdated={(farmer) => {
                            fetchFamilyGroupByMember(farmer?.registrationNumber);
                            if (farmer.familyGroup) setGroupToRefresh(farmer.familyGroup?.id);
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default ReportByFamilyGroup;
