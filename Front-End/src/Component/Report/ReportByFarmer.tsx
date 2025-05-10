import { StatusLabels } from "../../Enum/StatusEnum";
import { useFetchItem } from "../../Hook/useFetchItem";
import { BranchType } from "../../Type/BranchType";
import { FarmerType } from "../../Type/FarmerType";
import { UserType } from "../../Type/UserType";
import { useEffect, useState } from "react";
import CustomTable from "../Common/CustomTable";
import { FaPen } from "react-icons/fa6";
import FarmerModal from "../FarmerModal";
import axiosInstance from "../../axiosInstance";
import { toast } from "react-toastify";

interface ReportByFarmerProps {
    branch?: BranchType;
    technician?: UserType;
    setTotalItems?: (total: number) => void;
}

const ReportByFarmer = ({ branch, technician, setTotalItems }: ReportByFarmerProps) => {
    const endpoint = branch ? `/farmer/by-branch/${branch.id}` : "/farmer/by-technician";
    const params = branch
        ? undefined
        : technician
            ? { userId: technician.id }
            : undefined;

    const { data: farmers, loading, refetch } = useFetchItem<FarmerType[]>(endpoint, params);
    const [show, setShow] = useState(false);
    const [currentFarmer, setCurrentFarmer] = useState<FarmerType | null>(null);

    useEffect(() => {
        if (!farmers || !setTotalItems) return;
        setTotalItems(farmers.length);
    }, [farmers])

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

    if (loading) return <p>Carregando...</p>;
    if (!farmers || farmers.length === 0) return <p>Nenhum dado encontrado.</p>;

    return (
        <>
            {farmers && farmers.length > 0 && (() => {
                return (
                    <>
                        <div className="me-4 px-4 my-4">
                            <div className="floating_panel">
                                <CustomTable
                                    headers={[
                                        "Matrícula",
                                        "Nome",
                                        "Situação",
                                        "Técnico",
                                        "Área própria",
                                        "Área arrendada",
                                        "Área total",
                                        "Ações"
                                    ]}
                                >
                                    {farmers.map((farmer) => (
                                        <tr key={Number(farmer.registrationNumber)}>
                                            <td>{farmer.registrationNumber}</td>
                                            <td>{farmer.name}</td>
                                            <td>{StatusLabels[farmer.status]}</td>
                                            <td>{farmer.technician?.name || "Sem técnico vinculado"}</td>
                                            <td>{farmer.ownedArea} ha</td>
                                            <td>{farmer.leasedArea} ha</td>
                                            <td>{(farmer.ownedArea ?? 0) + (farmer.leasedArea ?? 0)} ha</td>
                                            <td>
                                                <button
                                                    className="button_edit"
                                                    onClick={() => handleEditFarmer(farmer)}
                                                >
                                                    <FaPen /> Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </CustomTable>
                            </div>
                        </div>

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
                    </>
                );
            })()}
        </>
    )


}

export default ReportByFarmer;
