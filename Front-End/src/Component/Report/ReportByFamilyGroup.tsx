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
    const { data: familyGroups, loading, refetch } = useFetchItem<FamilyGroupReport[]>(`/family-group/by-technician/${technician.id}`);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);
    const [show, setShow] = useState(false);
    const [cultivationModalShow, setCultivationModalShow] = useState(false);
    const [editCultivation, setEditCultivation] = useState<CultivationType>({});
    const [selectedFamilyGroup, setSelectedFamilyGroup] = useState<FamilyGroupType | null>(null);

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
                refetch();
                toast.success("Culturas atualizadas com sucesso");
                setShow(false);
            }
        } catch (error) {
            toast.error("Erro ao atualizar culturas");
        } finally {
            setShow(false);
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
                leasedArea: currentFarmer.leasedArea
            }

            const res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, data);

            if (res.status === 200 || res.status === 201) {
                refetch();
                toast.success("Produtor atualizado com sucesso!");
                setShow(false);
            }
        } catch (error) {
            toast.error("Erro ao atualizar o produtor.");
        }
    };

    const handlePrincipalChange = async (farmerId: String, familyGroupId: String) => {
        try {
            const res = await axiosInstance.put(`/family-group/change-principal/${familyGroupId}/${farmerId}`);

            if (res.status === 200 || res.status === 201) {
                refetch();
                toast.success("Principal atualizado.");
            }
        } catch (error) {
            toast.error("Erro ao alterar o principal do grupo.");
        }
    };

    const handleRemoveMember = async (farmer: String, familyGroupId: String) => {
        try {
            const res = await axiosInstance.put(`/family-group/remove-member/${familyGroupId}/${farmer}`);

            if (res.status === 200 || res.status === 201) {
                refetch();
                toast.success("Produtor removido com sucesso!");
            }
        } catch (error) {
            toast.error("Erro ao remover o produtor do grupo familiar.");
        }
    }

    useEffect(() => {
        if (familyGroups) {
            setTotalItems(familyGroups.length);
        }
    }, [familyGroups]);

    return (
        <div className="p-4">
            {loading ? (
                <>...Carregando</>
            ) : (
                familyGroups && familyGroups.map((f) => (
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
                                (farmer) => handlePrincipalChange(farmer.registrationNumber, String(f.familyGroupId))
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
                                setCultivationModalShow(true);
                            }}
                        />
                    </div>
                ))
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
                                value={editCultivation.canolaArea ?? 0}
                                onChange={(e) => {
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        canolaArea: parseFloat(e.target.value)
                                    }))
                                }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Trigo</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.wheatArea ?? 0}
                                onChange={(e) =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        wheatArea: parseFloat(e.target.value) || 0,
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Milho silagem</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.cornSilageArea ?? 0}
                                onChange={(e) =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        cornSilageArea: parseFloat(e.target.value) || 0,
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Milho grão</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.grainCornArea ?? 0}
                                onChange={(e) =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        grainCornArea: parseFloat(e.target.value) || 0,
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Feijão</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.beanArea ?? 0}
                                onChange={(e) =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        beanArea: parseFloat(e.target.value) || 0,
                                    }))
                                }
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Soja</Form.Label>
                            <Form.Control
                                type="number"
                                value={editCultivation.soybeanArea ?? 0}
                                onChange={(e) =>
                                    setEditCultivation(prev => ({
                                        ...prev,
                                        soybeanArea: parseFloat(e.target.value) || 0,
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
