import { FaChessKing, FaMinus, FaPen, FaPlus, FaTractor } from "react-icons/fa6";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import { FarmerType } from "../Type/FarmerType";
import { StatusLabels } from "../Enum/StatusEnum";
import CustomTable from "./Common/CustomTable";
import { memo, useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { Button, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import FarmerModal from "./FarmerModal";
import { NumericFormat } from "react-number-format";

interface FamilyGroupTableProps {
    familyGroup: FamilyGroupType;
    showActions?: boolean;
    onEditFarmer?: (farmer: FarmerType) => void;
    onMakePrincipal?: (farmer: FarmerType) => void;
    onRemoveFarmer?: (farmer: FarmerType) => void;
    onAddFarmer?: (group: FamilyGroupType) => void;
    onEditAssets?: (farmer: FarmerType) => void;
    groupToRefresh?: number | null;
    onRefreshComplete?: () => void;
}

interface CultivationType {
    canolaArea?: number;
    wheatArea?: number;
    cornSilageArea?: number;
    grainCornArea?: number;
    beanArea?: number;
    soybeanArea?: number;

    canolaAreaParticipation?: number;
    wheatAreaParticipation?: number;
    cornSilageAreaParticipation?: number;
    grainCornAreaParticipation?: number;
    beanAreaParticipation?: number;
    soybeanAreaParticipation?: number;
}

type CultivationKey =
    | "canola"
    | "wheat"
    | "cornSilage"
    | "grainCorn"
    | "bean"
    | "soybean";

const FamilyGroupTable = ({
    familyGroup,
    showActions = false,
    onMakePrincipal,
    onRemoveFarmer,
    onAddFarmer,
    onEditAssets,
    groupToRefresh,
    onRefreshComplete
}: FamilyGroupTableProps) => {
    const [modalFarmerShow, setModalFarmerShow] = useState<boolean>(false);
    const [modalConfirmRemove, setModalConfirmRemove] = useState<boolean>(false);

    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);

    const [currentFamilyGroup, setCurrentFamilyGroup] = useState<FamilyGroupType | null>(null);

    const [loadingUpdateCultivations, setLoadingUpdateCultivations] = useState<boolean>(false);
    const [editCultivation, setEditCultivation] = useState<CultivationType>({});
    const [showCultivationModal, setShowCultivationModal] = useState<boolean>(false);

    const [loadingRemoveFarmer, setLoadingRemoveFarmer] = useState<boolean>(false);
    const [loadingPrincipalUpdate, setLoadingPrincipalUpdate] = useState<boolean>(false);

    const [updatingPrincipal, setUpdatingPrincial] = useState<FarmerType | null>(null);

    const [lessors, setLessors] = useState<FarmerType[]>([]);
    const [loadingLessors, setLoadingLessors] = useState<boolean>(false);

    function findInvalidParticipation(
        obj: CultivationType
    ): CultivationKey | undefined {
        const cultivations: CultivationKey[] = [
            "canola", "wheat", "cornSilage",
            "grainCorn", "bean", "soybean",
        ];

        return cultivations.find((c) => {
            const area = obj[`${c}Area`];
            const part = obj[`${c}AreaParticipation`];
            return area !== undefined && part !== undefined && part > area;
        });
    }

    useEffect(() => {
        if (familyGroup.members) {
            setCurrentFamilyGroup(familyGroup);
            fetchLessors(familyGroup.id);
        }
    }, [familyGroup.id, familyGroup.members, familyGroup.principal]);

    const farmers = currentFamilyGroup?.members || [];
    const totalArea = farmers.reduce(
        (acc, farmer) => acc + (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0),
        0
    );

    const fetchLessors = async (id: number) => {
        setLoadingLessors(true);

        const res = await axiosInstance(`/family-group/lessors/${id}`);

        if (res.status === 200) {
            setLessors(res.data)
        }

        setLoadingLessors(false);
    }

    useEffect(() => {
        if (groupToRefresh === familyGroup.id) {
            fetchLessors(groupToRefresh);
            onRefreshComplete?.();
        }
    }, [groupToRefresh]);

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

    const handleOpenRemoveModal = async (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setModalConfirmRemove(true);
    }

    const handleCloseConfirmRemove = () => {
        setModalConfirmRemove(false);
        setCurrentFarmer(null);
    }

    const handleFarmerRemove = async () => {
        if (!onRemoveFarmer || !currentFarmer) return;
        setLoadingRemoveFarmer(true);
        try {
            await onRemoveFarmer(currentFarmer);
        } finally {
            setLoadingRemoveFarmer(false);
            setModalConfirmRemove(false);
            setCurrentFarmer(null);
        }
    }

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

                canolaAreaParticipation: currentFamilyGroup.canolaAreaParticipation,
                wheatAreaParticipation: currentFamilyGroup.wheatAreaParticipation,
                cornSilageAreaParticipation: currentFamilyGroup.cornSilageAreaParticipation,
                grainCornAreaParticipation: currentFamilyGroup.grainCornAreaParticipation,
                beanAreaParticipation: currentFamilyGroup.beanAreaParticipation,
                soybeanAreaParticipation: currentFamilyGroup.soybeanAreaParticipation,
            });

            setShowCultivationModal(true);
        }
    }

    const handleEditCultivation = async () => {
        try {
            if (!currentFamilyGroup || currentFamilyGroup === undefined) return;

            setLoadingUpdateCultivations(true);

            const invalid = findInvalidParticipation(editCultivation);
            if (invalid) {
                toast.error(`Participação de ${invalid} não pode ser maior que a área total`);
                return;
            }

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
                        ...showActions ? ["Editar SAP"] : [],
                        "Própria",
                        "Arrendada",
                        "Total",
                        ...showActions ? ["Editar"] : [],
                        ...(showActions && currentFamilyGroup?.members && currentFamilyGroup?.members?.length > 1) ? ["Ações"] : []
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
                        { background: "#d0d9d4" },
                        { background: "#c9c9c9" },
                        { background: "#c9c9c9" },
                        { background: "#c9c9c9" },
                        { background: "#c9c9c9" }
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
                        { background: "#dae3de" },
                        { background: "#dbdbdb" },
                        { background: "#dbdbdb" },
                        { background: "#dbdbdb" },
                        { background: "#dbdbdb" }
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
                                <td>
                                    <button
                                        className="button_info btn_sm"
                                        onClick={() => {
                                            onEditAssets && onEditAssets(f)
                                        }}
                                        title="Editar Bens"
                                    >
                                        <FaTractor />
                                    </button>
                                </td>
                                <td>{`${ownedArea} ha`}</td>
                                <td>{`${leasedArea} ha`}</td>
                                <td className={totalAssetsArea !== totalArea ? 'text-danger' : ''}>
                                    {`${totalArea} ha`}
                                </td>
                                <td>
                                    <button
                                        className="button_edit btn_sm"
                                        onClick={() => handleEditFarmer(f)}
                                        title="Editar Produtor"
                                    >
                                        <FaPen />
                                    </button>
                                </td>
                                {(showActions && f.registrationNumber !== currentFamilyGroup?.principal.registrationNumber) && (
                                    <td className="d-flex gap-2">
                                        {(loadingPrincipalUpdate && updatingPrincipal?.registrationNumber === f.registrationNumber) ? (
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        ) : (
                                            <button
                                                className="button_neutral btn_sm"
                                                title="Tornar Principal"
                                                onClick={async () => {
                                                    if (!onMakePrincipal) return;
                                                    setLoadingPrincipalUpdate(true);
                                                    setUpdatingPrincial(f);
                                                    try {
                                                        await onMakePrincipal(f);
                                                    } finally {
                                                        setLoadingPrincipalUpdate(false);
                                                        setUpdatingPrincial(null);
                                                    }
                                                }}
                                            >
                                                <FaChessKing />
                                            </button>
                                        )}
                                        <button
                                            className="button_remove btn_sm"
                                            onClick={() => {
                                                handleOpenRemoveModal(f)
                                            }}
                                            title="Remover Produtor do Grupo Familiar"
                                        >
                                            <FaMinus />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}

                </CustomTable>
                {lessors && lessors.length > 0 && (
                    <>
                        {loadingLessors ? (
                            <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                                <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                            </div>
                        ) : (
                            <>
                                <div className="mt-2">
                                    <h5 className="fw-bold">
                                        Arrendadores
                                    </h5>
                                </div>

                                <CustomTable
                                    headers={
                                        [
                                            "Matrícula",
                                            "Nome",
                                            "Arrendatários",
                                            "Carteira",
                                            "Técnico"
                                        ]
                                    }
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
                                </CustomTable>
                            </>
                        )}
                    </>
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
                        "Participação",
                        "Trigo",
                        "Participação",
                        "Milho silagem",
                        "Participação",
                        "Milho grão",
                        "Participação",
                        "Feijão",
                        "Participação",
                        "Soja",
                        "Participação"
                    ]}
                    headerStyles={[
                        undefined,
                        { background: "#8bb1cc" },
                        { background: "#8bb1cc" },
                        { background: "#bf6f6f" },
                        { background: "#bf6f6f" },
                        { background: "#8fba9b" },
                        { background: "#8fba9b" },
                        { background: "#c9c591" },
                        { background: "#c9c591" },
                        { background: "#ad8c7d" },
                        { background: "#ad8c7d" },
                        { background: "#babf71" },
                        { background: "#babf71" }
                    ]}
                    columnStyles={[
                        undefined,
                        { background: "#98bbd4" },
                        { background: "#98bbd4" },
                        { background: "#c78585" },
                        { background: "#c78585" },
                        { background: "#a5c2ac" },
                        { background: "#a5c2ac" },
                        { background: "#d4d0a7" },
                        { background: "#d4d0a7" },
                        { background: "#bfa69b" },
                        { background: "#bfa69b" },
                        { background: "#bcbf88" },
                        { background: "#bcbf88" }
                    ]}
                >

                    <tr>
                        <td>2025/2026</td>

                        <td>{(currentFamilyGroup?.canolaArea ?? 0).toFixed(2)} ha</td>
                        <td>{(currentFamilyGroup?.canolaAreaParticipation ?? 0).toFixed(2)} ha</td>

                        <td>{(currentFamilyGroup?.wheatArea ?? 0).toFixed(2)} ha</td>
                        <td>{(currentFamilyGroup?.wheatAreaParticipation ?? 0).toFixed(2)} ha</td>

                        <td>{(currentFamilyGroup?.cornSilageArea ?? 0).toFixed(2)} ha</td>
                        <td>{(currentFamilyGroup?.cornSilageAreaParticipation ?? 0).toFixed(2)} ha</td>

                        <td>{(currentFamilyGroup?.grainCornArea ?? 0).toFixed(2)} ha</td>
                        <td>{(currentFamilyGroup?.grainCornAreaParticipation ?? 0).toFixed(2)} ha</td>

                        <td>{(currentFamilyGroup?.beanArea ?? 0).toFixed(2)} ha</td>
                        <td>{(currentFamilyGroup?.beanAreaParticipation ?? 0).toFixed(2)} ha</td>

                        <td>{(currentFamilyGroup?.soybeanArea ?? 0).toFixed(2)} ha</td>
                        <td>{(currentFamilyGroup?.soybeanAreaParticipation ?? 0).toFixed(2)} ha</td>
                    </tr>
                </CustomTable>

                {
                    onAddFarmer && showActions && currentFamilyGroup && (
                        <div className="text-end my-2">
                            <button
                                className="button_agree btn_sm"
                                onClick={() => onAddFarmer(currentFamilyGroup)}
                            >
                                <FaPlus /> Adicionar Participante
                            </button>
                        </div>
                    )
                }

                <div className="text-end my-2">
                    <button
                        className="button_edit btn_sm"
                        onClick={() => handleOpenCultivationModal()}
                    >
                        <FaPen /> Editar Cultivo
                    </button>
                </div>
            </div >

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

            <Modal show={modalConfirmRemove} onHide={handleCloseConfirmRemove}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Remover o produtor
                        <span className="fw-bold"> {currentFarmer?.registrationNumber} - {currentFarmer?.name} </span>
                        do grupo familiar
                        <span className="fw-bold"> {currentFamilyGroup?.principal.name}</span>?
                    </Modal.Title>
                </Modal.Header>
                <Modal.Footer>
                    {(loadingRemoveFarmer && currentFarmer) ? (
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        <button className="button_remove" onClick={handleFarmerRemove}>
                            Confirmar
                        </button>
                    )}
                    <button className="button_agree" onClick={handleCloseConfirmRemove}>
                        Cancelar
                    </button>
                </Modal.Footer>
            </Modal>

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
                            <Form.Group className="mb-2 d-flex gap-3">
                                <div>
                                    <Form.Label>Canola (ha)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editCultivation.canolaArea ?? ""}
                                        onChange={(e) => {
                                            const area = parseFloat(e.target.value);
                                            setEditCultivation((p) => ({
                                                ...p,
                                                canolaArea: isNaN(area) ? undefined : area,
                                                canolaAreaParticipation:
                                                    isNaN(area) || p.canolaAreaParticipation === undefined
                                                        ? undefined
                                                        : (p.canolaAreaParticipation / (p.canolaArea || 1)) * area,
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    {/*<Form.Label>Participação (%)</Form.Label>
                                     <NumericFormat
                                        value={
                                            editCultivation.canolaAreaParticipation !== undefined &&
                                                editCultivation.canolaArea
                                                ? (
                                                    (editCultivation.canolaAreaParticipation /
                                                        editCultivation.canolaArea) *
                                                    100
                                                ).toFixed(2)
                                                : ""
                                        }
                                        onValueChange={({ floatValue }) => {
                                            setEditCultivation((p) => ({
                                                ...p,
                                                canolaAreaParticipation:
                                                    floatValue === undefined || p.canolaArea === undefined
                                                        ? undefined
                                                        : (floatValue / 100) * p.canolaArea,
                                            }));
                                        }}
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        suffix="%"
                                        inputMode="decimal"
                                        placeholder="0,00%"
                                        className="form-control"
                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
                                        }
                                    /> */}
                                    <Form.Label>Participação Cotrisoja (ha)</Form.Label>
                                    <NumericFormat
                                        value={editCultivation.canolaAreaParticipation ?? ""}

                                        onValueChange={({ floatValue }) =>
                                            setEditCultivation((p) => {
                                                const total = p.canolaArea ?? Infinity;
                                                const v = floatValue ?? undefined;
                                                return {
                                                    ...p, canolaAreaParticipation: v !== undefined
                                                        ? Math.min(v, total)
                                                        : undefined
                                                };
                                            })
                                        }

                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="form-control"

                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined ||
                                            (floatValue >= 0 &&
                                                (editCultivation.canolaArea === undefined || floatValue <= editCultivation.canolaArea))
                                        }
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-2 d-flex gap-3">
                                <div>
                                    <Form.Label>Trigo (ha)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editCultivation.wheatArea ?? ""}
                                        onChange={(e) => {
                                            const area = parseFloat(e.target.value);
                                            setEditCultivation((p) => ({
                                                ...p,
                                                wheatArea: isNaN(area) ? undefined : area,
                                                wheatAreaParticipation:
                                                    isNaN(area) || p.wheatAreaParticipation === undefined
                                                        ? undefined
                                                        : (p.wheatAreaParticipation / (p.wheatArea || 1)) * area,
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    {/* <Form.Label>Participação (%)</Form.Label>
                                    <NumericFormat
                                        value={
                                            editCultivation.wheatAreaParticipation !== undefined &&
                                                editCultivation.wheatArea
                                                ? (
                                                    (editCultivation.wheatAreaParticipation /
                                                        editCultivation.wheatArea) *
                                                    100
                                                ).toFixed(2)
                                                : ""
                                        }
                                        onValueChange={({ floatValue }) => {
                                            setEditCultivation((p) => ({
                                                ...p,
                                                wheatAreaParticipation:
                                                    floatValue === undefined || p.wheatArea === undefined
                                                        ? undefined
                                                        : (floatValue / 100) * p.wheatArea,
                                            }));
                                        }}
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        suffix="%"
                                        inputMode="decimal"
                                        placeholder="0,00%"
                                        className="form-control"
                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
                                        }
                                    /> */}
                                    <Form.Label>Participação Cotrisoja (ha)</Form.Label>
                                    <NumericFormat
                                        value={editCultivation.wheatAreaParticipation ?? ""}

                                        onValueChange={({ floatValue }) =>
                                            setEditCultivation((p) => {
                                                const total = p.wheatArea ?? Infinity;
                                                const v = floatValue ?? undefined;
                                                return {
                                                    ...p, wheatAreaParticipation: v !== undefined
                                                        ? Math.min(v, total)
                                                        : undefined
                                                };
                                            })
                                        }

                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="form-control"

                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined ||
                                            (floatValue >= 0 &&
                                                (editCultivation.wheatArea === undefined || floatValue <= editCultivation.wheatArea))
                                        }
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-2 d-flex gap-3">
                                <div>
                                    <Form.Label>Milho Silagem (ha)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editCultivation.cornSilageArea ?? ""}
                                        onChange={(e) => {
                                            const area = parseFloat(e.target.value);
                                            setEditCultivation((p) => ({
                                                ...p,
                                                cornSilageArea: isNaN(area) ? undefined : area,
                                                cornSilageAreaParticipation:
                                                    isNaN(area) || p.cornSilageAreaParticipation === undefined
                                                        ? undefined
                                                        : (p.cornSilageAreaParticipation / (p.cornSilageArea || 1)) *
                                                        area,
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    {/* <Form.Label>Participação (%)</Form.Label>
                                    <NumericFormat
                                        value={
                                            editCultivation.cornSilageAreaParticipation !== undefined &&
                                                editCultivation.cornSilageArea
                                                ? (
                                                    (editCultivation.cornSilageAreaParticipation /
                                                        editCultivation.cornSilageArea) *
                                                    100
                                                ).toFixed(2)
                                                : ""
                                        }
                                        onValueChange={({ floatValue }) => {
                                            setEditCultivation((p) => ({
                                                ...p,
                                                cornSilageAreaParticipation:
                                                    floatValue === undefined || p.cornSilageArea === undefined
                                                        ? undefined
                                                        : (floatValue / 100) * p.cornSilageArea,
                                            }));
                                        }}
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        suffix="%"
                                        inputMode="decimal"
                                        placeholder="0,00%"
                                        className="form-control"
                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
                                        }
                                    /> */}
                                    <Form.Label>Participação Cotrisoja (ha)</Form.Label>
                                    <NumericFormat
                                        value={editCultivation.cornSilageAreaParticipation ?? ""}

                                        onValueChange={({ floatValue }) =>
                                            setEditCultivation((p) => {
                                                const total = p.cornSilageArea ?? Infinity;
                                                const v = floatValue ?? undefined;
                                                return {
                                                    ...p, cornSilageAreaParticipation: v !== undefined
                                                        ? Math.min(v, total)
                                                        : undefined
                                                };
                                            })
                                        }

                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="form-control"

                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined ||
                                            (floatValue >= 0 &&
                                                (editCultivation.cornSilageArea === undefined || floatValue <= editCultivation.cornSilageArea))
                                        }
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-2 d-flex gap-3">
                                <div>
                                    <Form.Label>Milho Grão (ha)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editCultivation.grainCornArea ?? ""}
                                        onChange={(e) => {
                                            const area = parseFloat(e.target.value);
                                            setEditCultivation((p) => ({
                                                ...p,
                                                grainCornArea: isNaN(area) ? undefined : area,
                                                grainCornAreaParticipation:
                                                    isNaN(area) || p.grainCornAreaParticipation === undefined
                                                        ? undefined
                                                        : (p.grainCornAreaParticipation / (p.grainCornArea || 1)) *
                                                        area,
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    {/* <Form.Label>Participação (%)</Form.Label>
                                    <NumericFormat
                                        value={
                                            editCultivation.grainCornAreaParticipation !== undefined &&
                                                editCultivation.grainCornArea
                                                ? (
                                                    (editCultivation.grainCornAreaParticipation /
                                                        editCultivation.grainCornArea) *
                                                    100
                                                ).toFixed(2)
                                                : ""
                                        }
                                        onValueChange={({ floatValue }) => {
                                            setEditCultivation((p) => ({
                                                ...p,
                                                grainCornAreaParticipation:
                                                    floatValue === undefined || p.grainCornArea === undefined
                                                        ? undefined
                                                        : (floatValue / 100) * p.grainCornArea,
                                            }));
                                        }}
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        suffix="%"
                                        inputMode="decimal"
                                        placeholder="0,00%"
                                        className="form-control"
                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
                                        }
                                    /> */}
                                    <Form.Label>Participação Cotrisoja (ha)</Form.Label>
                                    <NumericFormat
                                        value={editCultivation.grainCornAreaParticipation ?? ""}

                                        onValueChange={({ floatValue }) =>
                                            setEditCultivation((p) => {
                                                const total = p.grainCornArea ?? Infinity;
                                                const v = floatValue ?? undefined;
                                                return {
                                                    ...p, grainCornAreaParticipation: v !== undefined
                                                        ? Math.min(v, total)
                                                        : undefined
                                                };
                                            })
                                        }

                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="form-control"

                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined ||
                                            (floatValue >= 0 &&
                                                (editCultivation.grainCornArea === undefined || floatValue <= editCultivation.grainCornArea))
                                        }
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-2 d-flex gap-3">
                                <div>
                                    <Form.Label>Feijão (ha)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editCultivation.beanArea ?? ""}
                                        onChange={(e) => {
                                            const area = parseFloat(e.target.value);
                                            setEditCultivation((p) => ({
                                                ...p,
                                                beanArea: isNaN(area) ? undefined : area,
                                                beanAreaParticipation:
                                                    isNaN(area) || p.beanAreaParticipation === undefined
                                                        ? undefined
                                                        : (p.beanAreaParticipation / (p.beanArea || 1)) * area,
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    {/* <Form.Label>Participação (%)</Form.Label>
                                    <NumericFormat
                                        value={
                                            editCultivation.beanAreaParticipation !== undefined &&
                                                editCultivation.beanArea
                                                ? (
                                                    (editCultivation.beanAreaParticipation /
                                                        editCultivation.beanArea) *
                                                    100
                                                ).toFixed(2)
                                                : ""
                                        }
                                        onValueChange={({ floatValue }) => {
                                            setEditCultivation((p) => ({
                                                ...p,
                                                beanAreaParticipation:
                                                    floatValue === undefined || p.beanArea === undefined
                                                        ? undefined
                                                        : (floatValue / 100) * p.beanArea,
                                            }));
                                        }}
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        suffix="%"
                                        inputMode="decimal"
                                        placeholder="0,00%"
                                        className="form-control"
                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
                                        }
                                    /> */}
                                    <Form.Label>Participação Cotrisoja (ha)</Form.Label>
                                    <NumericFormat
                                        value={editCultivation.beanAreaParticipation ?? ""}

                                        onValueChange={({ floatValue }) =>
                                            setEditCultivation((p) => {
                                                const total = p.beanArea ?? Infinity;
                                                const v = floatValue ?? undefined;
                                                return {
                                                    ...p, beanAreaParticipation: v !== undefined
                                                        ? Math.min(v, total)
                                                        : undefined
                                                };
                                            })
                                        }

                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="form-control"

                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined ||
                                            (floatValue >= 0 &&
                                                (editCultivation.beanArea === undefined || floatValue <= editCultivation.beanArea))
                                        }
                                    />
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-2 d-flex gap-3">
                                <div>
                                    <Form.Label>Soja (ha)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editCultivation.soybeanArea ?? ""}
                                        onChange={(e) => {
                                            const area = parseFloat(e.target.value);
                                            setEditCultivation((p) => ({
                                                ...p,
                                                soybeanArea: isNaN(area) ? undefined : area,
                                                soybeanAreaParticipation:
                                                    isNaN(area) || p.soybeanAreaParticipation === undefined
                                                        ? undefined
                                                        : (p.soybeanAreaParticipation / (p.soybeanArea || 1)) * area,
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    {/* <Form.Label>Participação (%)</Form.Label>
                                    <NumericFormat
                                        value={
                                            editCultivation.soybeanAreaParticipation !== undefined &&
                                                editCultivation.soybeanArea
                                                ? (
                                                    (editCultivation.soybeanAreaParticipation /
                                                        editCultivation.soybeanArea) *
                                                    100
                                                ).toFixed(2)
                                                : ""
                                        }
                                        onValueChange={({ floatValue }) => {
                                            setEditCultivation((p) => ({
                                                ...p,
                                                soybeanAreaParticipation:
                                                    floatValue === undefined || p.soybeanArea === undefined
                                                        ? undefined
                                                        : (floatValue / 100) * p.soybeanArea,
                                            }));
                                        }}
                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        suffix="%"
                                        inputMode="decimal"
                                        placeholder="0,00%"
                                        className="form-control"
                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined || (floatValue >= 0 && floatValue <= 100)
                                        }
                                    /> */}
                                    <Form.Label>Participação Cotrisoja (ha)</Form.Label>
                                    <NumericFormat
                                        value={editCultivation.soybeanAreaParticipation ?? ""}

                                        onValueChange={({ floatValue }) =>
                                            setEditCultivation((p) => {
                                                const total = p.soybeanArea ?? Infinity;
                                                const v = floatValue ?? undefined;
                                                return {
                                                    ...p, soybeanAreaParticipation: v !== undefined
                                                        ? Math.min(v, total)
                                                        : undefined
                                                };
                                            })
                                        }

                                        decimalSeparator=","
                                        thousandSeparator="."
                                        decimalScale={2}
                                        fixedDecimalScale
                                        allowNegative={false}
                                        inputMode="decimal"
                                        placeholder="0,00"
                                        className="form-control"

                                        isAllowed={({ floatValue }) =>
                                            floatValue === undefined ||
                                            (floatValue >= 0 &&
                                                (editCultivation.soybeanArea === undefined || floatValue <= editCultivation.soybeanArea))
                                        }
                                    />
                                </div>
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
        </div >
    );
};

export default memo(FamilyGroupTable);
