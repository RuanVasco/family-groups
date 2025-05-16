import { FaChessKing, FaMinus, FaPen, FaPlus, FaTractor } from "react-icons/fa6";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import { FarmerType } from "../Type/FarmerType";
import { StatusLabels } from "../Enum/StatusEnum";
import CustomTable from "./Common/CustomTable";
import { useEffect, useState } from "react";
import AssetModal from "./AssetModal";
import axiosInstance from "../axiosInstance";

interface FamilyGroupTableProps {
    familyGroup: FamilyGroupType;
    showActions?: boolean;
    onEditFarmer?: (farmer: FarmerType) => void;
    onMakePrincipal?: (farmer: FarmerType) => void;
    onRemoveFarmer?: (farmer: FarmerType) => void;
    onAddFarmer?: (group: FamilyGroupType) => void;
    onEditCultivation?: () => void;
}

const FamilyGroupTable = ({
    familyGroup,
    showActions = false,
    onEditFarmer,
    onMakePrincipal,
    onRemoveFarmer,
    onAddFarmer,
    onEditCultivation
}: FamilyGroupTableProps) => {
    const [show, setShow] = useState<boolean>(false);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);
    const [lessors, setLessors] = useState<FarmerType[]>([]);

    const fetchLessors = async () => {
        const res = await axiosInstance(`/family-group/lessors/${familyGroup.id}`);

        if (res.status === 200) {
            setLessors(res.data)
        }
    }

    useEffect(() => {
        fetchLessors();
    }, [])

    const farmers = familyGroup.members || [];
    const totalArea = farmers.reduce(
        (acc, farmer) => acc + (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0),
        0
    );

    const openAssetModal = (farmer: FarmerType) => {
        setCurrentFarmer(farmer);
        setShow(true);
    }

    const handleFarmerUpdated = (updatedFarmer: FarmerType) => {
        const updatedFarmers = (familyGroup.members ?? []).map(f =>
            f.registrationNumber === updatedFarmer.registrationNumber ? updatedFarmer : f
        );
        familyGroup.members = updatedFarmers;
        setCurrentFarmer(updatedFarmer);
    };


    return (
        <div>
            <div key={familyGroup.id}>
                <div className="mb-3">
                    <h5 className="fw-bold d-flex">
                        Grupo Familiar #{familyGroup.id} - Principal: {familyGroup.principal.name}
                        <span className="ms-auto me-3">Área total do grupo familiar: {totalArea} ha</span>
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
                        "Própria",
                        "Arrendada",
                        "Total",
                        ...showActions ? ["Ações"] : []
                    ]}
                >
                    {farmers.map((f) => (
                        <tr key={Number(f.registrationNumber)}>
                            <td>{f.registrationNumber}</td>
                            <td>{f.type?.id ?? "-"}</td>
                            <td>{f.name}</td>
                            <td>{StatusLabels[f.status]}</td>
                            <td
                                className={f.branch?.id != familyGroup.principal.branch?.id ? "text-danger" : ""}
                            >
                                {f.branch?.name ?? "Sem carteira vinculada"}
                            </td>
                            <td
                                className={f.technician?.id != familyGroup.principal.technician?.id ? "text-danger" : ""}
                            >
                                {f.technician?.name || "Sem técnico"}
                            </td>
                            <td>56 ha</td>
                            <td>32 ha</td>
                            <td>{(f.ownedArea ?? 0).toFixed(2)} ha</td>
                            <td>{(f.leasedArea ?? 0).toFixed(2)} ha</td>
                            <td>{((f.ownedArea ?? 0) + (f.leasedArea ?? 0)).toFixed(2)} ha</td>
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
                                        onClick={() => onEditFarmer && onEditFarmer(f)}
                                        title="Editar Produtor"
                                    >
                                        <FaPen />
                                    </button>
                                    {f.registrationNumber !== familyGroup.principal.registrationNumber && (
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
                    ))}
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
                                "Carteira",
                                "Técnico",
                                "Própria",
                            ]}
                        >
                            {lessors.map((lessor) => (
                                <tr key={Number(lessor.registrationNumber)}>
                                    <td>{lessor.registrationNumber}</td>
                                    <td>{lessor.name}</td>
                                    <td>{lessor.branch?.name ?? "Sem carteira vinculada."}</td>
                                    <td>{lessor.technician?.name}</td>
                                    <td>43 h</td>
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
                        "Soja"
                    ]}
                >
                    <tr>
                        <td>2025/2026</td>
                        <td>{familyGroup.canolaArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{familyGroup.wheatArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{familyGroup.cornSilageArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{familyGroup.grainCornArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{familyGroup.beanArea?.toFixed(2) ?? "0.00"} ha</td>
                        <td>{familyGroup.soybeanArea?.toFixed(2) ?? "0.00"} ha</td>
                    </tr>
                </CustomTable>

                {onAddFarmer && showActions && (
                    <div className="text-end my-2">
                        <button
                            className="button_agree btn_sm"
                            onClick={() => onAddFarmer(familyGroup)}
                        >
                            <FaPlus /> Adicionar Participante
                        </button>
                    </div>
                )}

                {onEditCultivation && (
                    <div className="text-end my-2">
                        <button
                            className="button_edit btn_sm"
                            onClick={onEditCultivation}
                        >
                            <FaPen /> Editar Cultivo
                        </button>
                    </div>
                )}
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
        </div>
    );
};

export default FamilyGroupTable;
