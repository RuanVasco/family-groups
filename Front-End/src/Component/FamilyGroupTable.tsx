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
                        "Própria",
                        "Arrendada",
                        "Total",
                        ...showActions ? ["Ações"] : []
                    ]}
                    columnWidths={[
                        "90px",
                        "90px",
                        "230px",
                        "90px",
                        undefined,
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
                            <td>{f.type?.id ?? "-"}</td>
                            <td>{f.name}</td>
                            <td>{StatusLabels[f.status]}</td>
                            <td>{f.branch?.name ?? "Sem carteira vinculada"}</td>
                            <td>{f.technician?.name || "Sem técnico"}</td>
                            <td>{f.ownedArea} ha</td>
                            <td>{f.leasedArea} ha</td>
                            <td>{(f.ownedArea ?? 0) + (f.leasedArea ?? 0)} ha</td>
                            {showActions && (
                                <td className="d-flex gap-2">
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
