import { FaChessKing, FaMinus, FaPen, FaPlus } from "react-icons/fa6";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import { FarmerType } from "../Type/FarmerType";
import { StatusLabels } from "../Enum/StatusEnum";
import CustomTable from "./Common/CustomTable";

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
    const farmers = familyGroup.members || [];
    const totalArea = farmers.reduce(
        (acc, farmer) => acc + (farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0),
        0
    );

    return (
        <div>
            <div key={familyGroup.id}>
                <div className="mb-4">
                    <h4 className="fw-bold d-flex">
                        Grupo Familiar #{familyGroup.id} - Principal: {familyGroup.principal.name}
                        <span className="ms-auto me-3">Área total do grupo familiar: {totalArea} ha</span>
                    </h4>
                </div>
                <CustomTable
                    headers={[
                        "Matrícula",
                        "Nome",
                        "Situação",
                        "Tipo",
                        "Técnico",
                        "Área própria",
                        "Área arrendada",
                        "Área total",
                        ...showActions ? ["Ações"] : []
                    ]}
                    columnWidths={[
                        "90px",
                        "230px",
                        "90px",
                        "90px",
                        "230px",
                        "140px",
                        "170px",
                        "120px",
                        undefined
                    ]}
                >
                    {farmers.map((f) => (
                        <tr key={Number(f.registrationNumber)}>
                            <td>{f.registrationNumber}</td>
                            <td>{f.name}</td>
                            <td>{StatusLabels[f.status]}</td>
                            <td>{f.type?.description || "-"}</td>
                            <td>{f.technician?.name || "Sem técnico"}</td>
                            <td>{f.ownedArea} ha</td>
                            <td>{f.leasedArea} ha</td>
                            <td>{(f.ownedArea ?? 0) + (f.leasedArea ?? 0)} ha</td>
                            {showActions && (
                                <td className="d-flex gap-2">
                                    <button
                                        className="button_edit btn_sm"
                                        onClick={() => onEditFarmer && onEditFarmer(f)}
                                    >
                                        <FaPen /> Editar
                                    </button>
                                    {f.registrationNumber !== familyGroup.principal.registrationNumber && (
                                        <>
                                            <button
                                                className="button_neutral btn_sm"
                                                onClick={() => onMakePrincipal && onMakePrincipal(f)}
                                            >
                                                <FaChessKing /> Principal
                                            </button>
                                            <button
                                                className="button_remove btn_sm"
                                                onClick={() => onRemoveFarmer && onRemoveFarmer(f)}
                                            >
                                                <FaMinus /> Remover
                                            </button>
                                        </>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </CustomTable>
                <div className="mt-5">
                    <h4 className="fw-bold border-top pt-3">
                        Cultivos
                    </h4>
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
                        <td>{familyGroup.canolaArea} ha</td>
                        <td>{familyGroup.wheatArea} ha</td>
                        <td>{familyGroup.cornSilageArea} ha</td>
                        <td>{familyGroup.grainCornArea} ha</td>
                        <td>{familyGroup.beanArea} ha</td>
                        <td>{familyGroup.soybeanArea} ha</td>
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


        </div>
    );
};

export default FamilyGroupTable;
