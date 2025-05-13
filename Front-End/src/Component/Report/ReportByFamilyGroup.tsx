import { useFetchItem } from "../../Hook/useFetchItem";
import { FarmerType } from "../../Type/FarmerType";
import { UserType } from "../../Type/UserType";
import { useEffect, useState } from "react";
import FarmerModal from "../FarmerModal";
import { toast } from "react-toastify";
import axiosInstance from "../../axiosInstance";
import FamilyGroupTable from "../FamilyGroupTable";
import { FamilyGroupType } from "../../Type/FamilyGroupType";
import { Button, Form, Modal } from "react-bootstrap";

interface ReportByFamilyGroupProps {
    technician: UserType;
    setTotalItems: (total: number) => void;
}

interface CultivationType {
    canolaArea?: number;
    wheatArea?: number;
    cornSilageArea?: number;
    grainCornArea?: number;
    beanArea?: number;
    soybeanArea?: number;
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
    const [cultivationModalShow, setCultivationModalShow] = useState(false);
    const [editCultivation, setEditCultivation] = useState<CultivationType>({});
    const [selectedFamilyGroup, setSelectedFamilyGroup] = useState<FamilyGroupType | null>(null);
    const [useFamilyGroups, setUseFamilyGroups] = useState<FamilyGroupReport[]>([]);

    useEffect(() => {
        if (familyGroups) {
            setUseFamilyGroups(familyGroups);
        }
    }, [familyGroups]);

    const handleCultivationModalClose = () => {
        setCultivationModalShow(false)
    };

    const handleEditFarmer = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShow(true);
    };

    const handleEditCultivation = async () => {
        try {
            if (!selectedFamilyGroup) return;

            const res = await axiosInstance.put(
                `/family-group/cultivation/${selectedFamilyGroup.id}`,
                editCultivation
            );

            if (res.status === 200 || res.status === 201) {
                // refetch();

                setUseFamilyGroups(prevGroups =>
                    prevGroups.map(fg =>
                        fg.familyGroupId === selectedFamilyGroup.id
                            ? { ...fg, ...editCultivation }
                            : fg
                    )
                );

                setCultivationModalShow(false)
                toast.success("Culturas atualizadas com sucesso");
            }
        } catch (error) {
            toast.error("Erro ao atualizar culturas");
        }
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
                                    onEditCultivation={() => {
                                        setSelectedFamilyGroup(
                                            {
                                                id: f.familyGroupId,
                                                principal: f.principal,
                                                members: f.members,
                                                canolaArea: f.canolaArea,
                                                wheatArea: f.wheatArea,
                                                cornSilageArea: f.cornSilageArea,
                                                grainCornArea: f.grainCornArea,
                                                beanArea: f.beanArea,
                                                soybeanArea: f.soybeanArea,
                                            }
                                        );

                                        setEditCultivation({
                                            canolaArea: f.canolaArea,
                                            wheatArea: f.wheatArea,
                                            cornSilageArea: f.cornSilageArea,
                                            grainCornArea: f.grainCornArea,
                                            beanArea: f.beanArea,
                                            soybeanArea: f.soybeanArea,
                                        });

                                        setCultivationModalShow(true);
                                    }}
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

            <Modal show={cultivationModalShow} onHide={handleCultivationModalClose} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        Alterar área de cultivo
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Label>
                                Canola
                            </Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.canolaArea !== undefined ? editCultivation.canolaArea : ""}
                                onChange={(e) => {
                                    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                    setEditCultivation(prev => ({ ...prev, canolaArea: value }));
                                }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Trigo</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.wheatArea !== undefined ? editCultivation.wheatArea : ""}
                                onChange={e =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        wheatArea: e.target.value === "" ? undefined : parseFloat(e.target.value)
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Milho silagem</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.cornSilageArea !== undefined ? editCultivation.cornSilageArea : ""}
                                onChange={e =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        cornSilageArea: e.target.value === "" ? undefined : parseFloat(e.target.value)
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Milho grão</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.grainCornArea !== undefined ? editCultivation.grainCornArea : ""}
                                onChange={e =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        grainCornArea: e.target.value === "" ? undefined : parseFloat(e.target.value)
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Feijão</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.beanArea !== undefined ? editCultivation.beanArea : ""}
                                onChange={e =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        beanArea: e.target.value === "" ? undefined : parseFloat(e.target.value)
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Soja</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.soybeanArea !== undefined ? editCultivation.soybeanArea : ""}
                                onChange={e =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        soybeanArea: e.target.value === "" ? undefined : parseFloat(e.target.value)
                                    }))
                                }
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleEditCultivation}>
                        Atualizar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default ReportByFamilyGroup;
