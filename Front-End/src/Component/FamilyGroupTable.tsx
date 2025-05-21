import { FaChessKing, FaMinus, FaPen, FaPlus, FaTractor } from "react-icons/fa6";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import { FarmerType } from "../Type/FarmerType";
import { StatusLabels } from "../Enum/StatusEnum";
import CustomTable from "./Common/CustomTable";
import { memo, useEffect, useState } from "react";
import AssetModal from "./AssetModal";
import axiosInstance from "../axiosInstance";
import { Button, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import FarmerModal from "./FarmerModal";

interface FamilyGroupTableProps {
    familyGroup: FamilyGroupType;
    showActions?: boolean;
    onEditFarmer?: (farmer: FarmerType) => void;
    onMakePrincipal?: (farmer: FarmerType) => void;
    onRemoveFarmer?: (farmer: FarmerType) => void;
    onAddFarmer?: (group: FamilyGroupType) => void;
}

interface CultivationType {
    canolaArea?: number;
    wheatArea?: number;
    cornSilageArea?: number;
    grainCornArea?: number;
    beanArea?: number;
    soybeanArea?: number;
}

const FamilyGroupTable = ({
    familyGroup,
    showActions = false,
    onMakePrincipal,
    onRemoveFarmer,
    onAddFarmer,
}: FamilyGroupTableProps) => {
    const [show, setShow] = useState<boolean>(false);
    const [modalFarmerShow, setModalFarmerShow] = useState<boolean>(false);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);
    const [lessors, setLessors] = useState<FarmerType[]>([]);

    const [currentFamilyGroup, setCurrentFamilyGroup] = useState<FamilyGroupType | null>(null);

    const [loadingUpdateCultivations, setLoadingUpdateCultivations] = useState<boolean>(false);
    const [editCultivation, setEditCultivation] = useState<CultivationType>({});
    const [showCultivationModal, setShowCultivationModal] = useState<boolean>(false);

    const fetchLessors = async () => {
        if (!currentFamilyGroup) return;
        const res = await axiosInstance(`/family-group/lessors/${currentFamilyGroup.id}`);

        if (res.status === 200) {
            setLessors(res.data)
        }
    }

    useEffect(() => {
        if (familyGroup.members) {
            setCurrentFamilyGroup(familyGroup);
            fetchLessors();
        }
    }, [familyGroup]);

    const farmers = currentFamilyGroup?.members || [];
    const totalArea = farmers.reduce(
        (acc, farmer) => acc + (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0),
        0
    );

    const handleEditFarmer = (farmer: FarmerType) => {
        setModalFarmerShow(true);
        setCurrentFarmer(farmer);
    }

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
                ownedArea: currentFarmer.ownedArea ?? 0,
                leasedArea: currentFarmer.leasedArea ?? 0,
                branch: currentFarmer.branch?.id
            }

            const res = await axiosInstance.put(`/farmer/${currentFarmer.registrationNumber}`, data);

            if (res.status === 200 || res.status === 201) {
                if (currentFamilyGroup) {
                    if (currentFamilyGroup.members) {
                        const member = currentFamilyGroup.members.find(m => m.registrationNumber === currentFarmer.registrationNumber);
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
                setModalFarmerShow(false);
            }
        } catch (error) {
            toast.error("Erro ao atualizar o produtor.");
        }
    };

    const openAssetModal = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShow(true);
    }

    const handleFarmerUpdated = (updatedFarmer: FarmerType) => {
        if (!currentFamilyGroup) return;
        const updatedFarmers = (currentFamilyGroup.members ?? []).map(f =>
            f.registrationNumber === updatedFarmer.registrationNumber ? updatedFarmer : f
        );
        currentFamilyGroup.members = updatedFarmers;
        setCurrentFarmer(updatedFarmer);
    };

    const handleCloseCultivationModal = () => {
        setShowCultivationModal(false);
    }

    const handleOpenCultivationModal = () => {
        if (currentFamilyGroup) {
            setEditCultivation({
                canolaArea: currentFamilyGroup.canolaArea,
                wheatArea: currentFamilyGroup.wheatArea,
                cornSilageArea: currentFamilyGroup.cornSilageArea,
                grainCornArea: currentFamilyGroup.grainCornArea,
                beanArea: currentFamilyGroup.beanArea,
                soybeanArea: currentFamilyGroup.soybeanArea,
            });

            setShowCultivationModal(true);
        }
    }

    const handleEditCultivation = async () => {
        try {
            if (!currentFamilyGroup) return;

            setLoadingUpdateCultivations(true);

            const res = await axiosInstance.put(
                `/family-group/cultivation/${currentFamilyGroup.id}`,
                editCultivation
            );

            if (res.status === 200 || res.status === 201) {
                toast.success("Culturas atualizadas com sucesso");
                setCurrentFamilyGroup(prev => prev ? { ...prev, ...editCultivation } : prev);
                handleCloseCultivationModal();
            }
        } catch (error: any) {
            const apiMessage = error.response?.data || "Erro ao atualizar culturas";
            toast.error(apiMessage);
        } finally {
            setLoadingUpdateCultivations(false);
        }
    };

    return (
        <div>
            <div key={currentFamilyGroup?.id}>
                <div className="mb-3">
                    <h5 className="fw-bold d-flex">
                        Grupo Familiar #{currentFamilyGroup?.id} - Principal: {currentFamilyGroup?.principal.name}
                        <span className="ms-auto me-3">
                            Área total do grupo familiar: {(totalArea ?? 0).toFixed(2)} ha
                        </span>
                    </h5>
                </div>
                <CustomTable
                    headers={[
                        "Matrícula",
                        "Tipo",
                        "Nome",
                        "Situação",
                        "Carteira",
                        "Técnico",
                        "SAP Própria",
                        "SAP Arrendada",
                        "SAP Total",
                        "Própria",
                        "Arrendada",
                        "Total",
                        ...showActions ? ["Ações"] : []
                    ]}
                    headerStyles={[
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        { background: "#d0d9d4" },
                        { background: "#d0d9d4" },
                        { background: "#d0d9d4" },
                        { background: "#c9c9c9" },
                        { background: "#c9c9c9" },
                        { background: "#c9c9c9" },
                    ]}
                    columnStyles={[
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        { background: "#dae3de" },
                        { background: "#dae3de" },
                        { background: "#dae3de" },
                        { background: "#dbdbdb" },
                        { background: "#dbdbdb" },
                        { background: "#dbdbdb" },
                    ]}
                >
                    {farmers.map((f) => {
                        const ownedAssetsSum = (
                            f.ownedAssets
                                ?.filter((asset) => asset.assetType.id === 1 || asset.assetType.id === 2)
                                .reduce((sum, asset) => sum + asset.amount, 0) || 0
                        ).toFixed(2);

                        const leasedAssetsSum = (
                            f.leasedAssets
                                ?.filter((asset) => asset.assetType.id === 1 || asset.assetType.id === 2)
                                .reduce((sum, asset) => sum + asset.amount, 0) || 0
                        ).toFixed(2);

                        const totalAssetsArea = (
                            [...(f.ownedAssets || []), ...(f.leasedAssets || [])]
                                .filter((asset) => asset.assetType.id === 1 || asset.assetType.id === 2)
                                .reduce((sum, asset) => sum + asset.amount, 0) || 0
                        ).toFixed(2);

                        const ownedArea = (f.ownedArea ?? 0).toFixed(2);
                        const leasedArea = (f.leasedArea ?? 0).toFixed(2);
                        const totalArea = ((f.ownedArea ?? 0) + (f.leasedArea ?? 0)).toFixed(2);

                        return (
                            <tr key={Number(f.registrationNumber)}>
                                <td>{f.registrationNumber}</td>
                                <td>{f.type?.id ?? "-"}</td>
                                <td>{f.name}</td>
                                <td>{StatusLabels[f.status]}</td>
                                <td className={f.branch?.id !== currentFamilyGroup?.principal.branch?.id ? "text-danger" : ""}>
                                    {f.branch?.name ?? "Sem carteira vinculada"}
                                </td>
                                <td className={f.technician?.id !== currentFamilyGroup?.principal.technician?.id ? "text-danger" : ""}>
                                    {f.technician?.name || "Sem técnico"}
                                </td>
                                <td>{`${ownedAssetsSum} ha`}</td>
                                <td>{`${leasedAssetsSum} ha`}</td>
                                <td>{`${totalAssetsArea} ha`}</td>
                                <td>{`${ownedArea} ha`}</td>
                                <td>{`${leasedArea} ha`}</td>
                                <td className={totalAssetsArea !== totalArea ? 'text-danger' : ''}>
                                    {`${totalArea} ha`}
                                </td>
                                {showActions && (
                                    <td className="d-flex gap-2">
                                        <button
                                            className="button_info btn_sm"
                                            onClick={() => openAssetModal(f)}
                                            title="Editar Bens"
                                        >
                                            <FaTractor />
                                        </button>
                                        <button
                                            className="button_edit btn_sm"
                                            onClick={() => handleEditFarmer(f)}
                                            title="Editar Produtor"
                                        >
                                            <FaPen />
                                        </button>
                                        {f.registrationNumber !== currentFamilyGroup?.principal.registrationNumber && (
                                            <>
                                                <button
                                                    className="button_neutral btn_sm"
                                                    onClick={() => onMakePrincipal && onMakePrincipal(f)}
                                                    title="Tornar Principal"
                                                >
                                                    <FaChessKing />
                                                </button>
                                                <button
                                                    className="button_remove btn_sm"
                                                    onClick={() => onRemoveFarmer && onRemoveFarmer(f)}
                                                    title="Remover Produtor do Grupo Familiar"
                                                >
                                                    <FaMinus />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}

                </CustomTable>
                {lessors.length > 0 && (
                    <><div className="mt-2">
                        <h5 className="fw-bold">
                            Arrendadores
                        </h5>
                    </div>
                        <CustomTable
                            headers={[
                                "Matrícula",
                                "Nome",
                                "Arrendatários",
                                "Carteira",
                                "Técnico"
                            ]}
                        >
                            {lessors.map((lessor) => (
                                <tr key={Number(lessor.registrationNumber)}>
                                    <td>{lessor.registrationNumber}</td>
                                    <td>{lessor.name}</td>
                                    <td>
                                        {lessor.ownedAssets?.some(asset => asset.leasedTo != null) ? (
                                            Object.entries(
                                                lessor.ownedAssets
                                                    .filter(asset =>
                                                        asset.leasedTo != null &&
                                                        currentFamilyGroup?.members?.some(member => member.registrationNumber === asset.leasedTo?.registrationNumber)
                                                    )
                                                    .reduce((result, asset) => {
                                                        const leaser = asset.leasedTo!;
                                                        const key = `${leaser.registrationNumber} - ${leaser.name}`;

                                                        result[key] = (result[key] || 0) + asset.amount;
                                                        return result;
                                                    }, {} as Record<string, number>)
                                            ).map(([leaserInfo, area]) => (
                                                <div key={leaserInfo}>
                                                    {leaserInfo} → {area.toFixed(2)} ha
                                                </div>
                                            ))
                                        ) : "Sem arrendamentos"}
                                    </td>
                                    <td>{lessor.branch?.name ?? "Sem carteira vinculada."}</td>
                                    <td>{lessor.technician?.name}</td>
                                </tr>
                            ))}

                        </CustomTable></>
                )}
                <div className="mt-2">
                    <h5 className="fw-bold">
                        Cultivos
                    </h5>
                </div>
                <CustomTable
                    headers={[
                        "Safra",
                        "Canola",
                        "Trigo",
                        "Milho silagem",
                        "Milho grão",
                        "Feijão",
                        "Soja",
                        "Total"
                    ]}
                >
                    <tr>
                        <td>2025/2026</td>
                        <td>{currentFamilyGroup?.canolaArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{currentFamilyGroup?.wheatArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{currentFamilyGroup?.cornSilageArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{currentFamilyGroup?.grainCornArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{currentFamilyGroup?.beanArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{currentFamilyGroup?.soybeanArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>
                            {`${(
                                (currentFamilyGroup?.canolaArea || 0) +
                                (currentFamilyGroup?.wheatArea || 0) +
                                (currentFamilyGroup?.cornSilageArea || 0) +
                                (currentFamilyGroup?.grainCornArea || 0) +
                                (currentFamilyGroup?.beanArea || 0) +
                                (currentFamilyGroup?.soybeanArea || 0)
                            ).toFixed(2)} ha`}
                        </td>
                    </tr>
                </CustomTable>

                {onAddFarmer && showActions && currentFamilyGroup && (
                    <div className="text-end my-2">
                        <button
                            className="button_agree btn_sm"
                            onClick={() => onAddFarmer(currentFamilyGroup)}
                        >
                            <FaPlus /> Adicionar Participante
                        </button>
                    </div>
                )}

                <div className="text-end my-2">
                    <button
                        className="button_edit btn_sm"
                        onClick={() => handleOpenCultivationModal()}
                    >
                        <FaPen /> Editar Cultivo
                    </button>
                </div>
            </div>
            <AssetModal
                show={show}
                onClose={() => {
                    fetchLessors();
                    setShow(false);
                }}
                farmer={currentFarmer}
                onChange={() => { }}
                onFarmerUpdated={handleFarmerUpdated}
            />

            <FarmerModal
                show={modalFarmerShow}
                onClose={() => {
                    setModalFarmerShow(false)
                    setCurrentFarmer(null);
                }}
                onSubmit={handleSubmitFarmer}
                currentFarmer={currentFarmer}
                modalMode="edit"
                onChange={(field, value) =>
                    setCurrentFarmer(prev => prev ? { ...prev, [field]: value } : prev)
                }
            />

            <Modal show={showCultivationModal} onHide={handleCloseCultivationModal} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        Adicionar área de cultivo
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingUpdateCultivations ? (
                        <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                            <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                        </div>
                    ) : (
                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label>
                                    Canola
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    value={editCultivation.canolaArea ?? 0}
                                    onChange={(e) =>
                                        setEditCultivation(prev => ({
                                            ...prev,
                                            canolaArea: parseFloat(e.target.value) || 0,
                                        }))
                                    }
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
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseCultivationModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleEditCultivation}>
                        Atualizar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default memo(FamilyGroupTable);
