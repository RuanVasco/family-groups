import { Button, Form, Modal } from "react-bootstrap";
import { FarmerType } from "../Type/FarmerType";
import axiosInstance from "../axiosInstance";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaFloppyDisk, FaMinus, FaPencil, FaPlus, FaXmark } from "react-icons/fa6";
import AssetType from "../Type/AssetType";
import CustomTable from "./Common/CustomTable";
import Select from "react-select";
import AsyncSelect from "react-select/async";

interface AssetModalProps {
    show: boolean;
    onClose: () => void;
    farmer: FarmerType | null;
    onFarmerUpdated: (f: FarmerType) => void;
    onChange: (field: keyof FarmerType, value: any) => void;
}

const AssetModal = ({
    show,
    onClose,
    farmer,
    onFarmerUpdated,
}: AssetModalProps) => {
    const [updatedFarmer, setUpdatedFarmer] = useState<FarmerType | null>(null);
    const [mergedAssets, setMergedAssets] = useState<AssetType[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [newAsset, setNewAsset] = useState<AssetType | null>(null);

    const assetOptions = [
        { value: 1, label: "Próprio" },
        { value: 2, label: "Arrendado" },
    ];

    const reFetchUpdatedFarmer = async () => {
        if (!updatedFarmer) return;
        try {
            const res = await axiosInstance.get(
                `/farmer/${updatedFarmer.registrationNumber}`
            );
            if (res.status === 200) {
                setUpdatedFarmer(res.data);
                onFarmerUpdated(res.data);
            }
        } catch {
            toast.error("Erro ao buscar produtor atualizado");
        }
    };

    const loadFarmers = async (input: string) => {
        try {
            const res = await axiosInstance.get("/farmer", {
                params: { value: input, size: 10 },
            });
            return res.data.content.map((f: FarmerType) => ({
                value: f,
                label: `${f.registrationNumber} - ${f.name}`,
            }));
        } catch {
            return [];
        }
    };

    const handleShowFormToggle = () => {
        setShowForm(!showForm);
        if (!showForm) {
            setNewAsset({
                id: undefined,
                description: "",
                address: "",
                amount: 0,
                owner: updatedFarmer ?? undefined,
                leasedTo: undefined,
                assetCategory: { id: 1, description: "Próprio" },
                assetType: { id: 0, description: "" },
            });
        }
    }

    useEffect(() => {
        setMergedAssets([
            ...(updatedFarmer?.ownedAssets ?? []),
            ...(updatedFarmer?.leasedAssets ?? []),
        ]);

    }, [updatedFarmer?.ownedAssets, updatedFarmer?.leasedAssets]);

    useEffect(() => {
        if (!show || !farmer) return;

        const fetchFreshFarmer = async () => {
            try {
                const res = await axiosInstance.get(`/farmer/${farmer.registrationNumber}`);
                setUpdatedFarmer(res.data);
                onFarmerUpdated(res.data);
            } catch {
                toast.error("Erro ao buscar dados do produtor");
            }
        };

        fetchFreshFarmer();
    }, [show, farmer?.registrationNumber]);

    const handleAddNewAsset = () => {
        return;
    };

    const handleUpdateAsset = async (id: number) => {
        return;
    };

    const handleRemoveAsset = async (id: string) => {
        try {
            const cleanId = id.split(" - ")[0].trim();

            await axiosInstance.delete(`/asset/${cleanId}`);
            toast.success("Bem removido");
            reFetchUpdatedFarmer();
        } catch {
            toast.error("Erro ao remover o bem");
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Editar bens do produtor {updatedFarmer?.registrationNumber} - {updatedFarmer?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-between mb-2">
                    <h5 className="fw-bold">Bens</h5>
                    <button className={`button_${showForm ? "edit" : "agree"}`} onClick={handleShowFormToggle}>
                        {showForm ? <><FaMinus /> Fechar formulário</> : <><FaPlus /> Criar bem</>}
                    </button>
                </div>
                {showForm && (
                    <Form>
                        <Form.Group>
                            <Form.Label>
                                Descrição
                            </Form.Label>
                            <Form.Control
                                value={newAsset?.description || ""}
                                onChange={(e) =>
                                    setNewAsset((prev) => prev ? { ...prev, description: e.target.value } : null)
                                }
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>
                                Endereço
                            </Form.Label>
                            <Form.Control
                                value={newAsset?.address || ""}
                                onChange={(e) =>
                                    setNewAsset((prev) => prev ? { ...prev, address: e.target.value } : null)
                                }
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>
                                Área
                            </Form.Label>
                            <Form.Control
                                value={newAsset?.amount || ""}
                                type="number"
                                onChange={(e) =>
                                    setNewAsset((prev) => prev ? { ...prev, amount: parseFloat(e.target.value.replace(",", ".")) || 0 } : null)
                                }
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>
                                Tipo
                            </Form.Label>
                            <Select
                                options={assetOptions}
                                value={
                                    newAsset?.assetCategory?.id
                                        ? assetOptions.find((o) => o.value === newAsset.assetCategory.id)
                                        : null
                                }
                                onChange={(opt) => {
                                    setNewAsset((prev) => prev ? {
                                        ...prev,
                                        assetCategory: {
                                            id: opt?.value ?? 0,
                                            description: opt?.label ?? ""
                                        }
                                    } : null);
                                }}
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                            />
                        </Form.Group>
                        {newAsset && (
                            <Form.Group>
                                <Form.Label>
                                    {newAsset.assetCategory.id === 2 ? "Proprietário" : "Arrendatário"}
                                </Form.Label>
                                <AsyncSelect
                                    loadOptions={loadFarmers}
                                    defaultOptions
                                    value={
                                        newAsset?.assetCategory?.id === 2 && newAsset.owner
                                            ? {
                                                value: newAsset.owner,
                                                label: `${newAsset.owner.registrationNumber} - ${newAsset.owner.name}`,
                                            }
                                            : newAsset?.leasedTo
                                                ? {
                                                    value: newAsset.leasedTo,
                                                    label: `${newAsset.leasedTo.registrationNumber} - ${newAsset.leasedTo.name}`,
                                                }
                                                : null
                                    }
                                    onChange={(opt) => {
                                        setNewAsset((prev) => prev ? {
                                            ...prev,
                                            owner: newAsset.assetCategory.id === 2 ? opt?.value : prev.owner,
                                            leasedTo: newAsset.assetCategory.id !== 2 ? opt?.value : prev.leasedTo,
                                        } : null);
                                    }}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                />
                                <div className="d-flex align-items-center justify-content-end my-3 gap-2">
                                    <button
                                        className="button_info button_sm"
                                    >
                                        <FaFloppyDisk /> Salvar
                                    </button>
                                    <button
                                        className="button_remove button_sm"
                                    >
                                        <FaXmark /> Cancelar
                                    </button>
                                </div>
                            </Form.Group>
                        )}
                    </Form>
                )}
                <CustomTable
                    headers={[
                        "Descrição",
                        "Endereço",
                        "Quantidade",
                        "Tipo",
                        "Proprietário",
                        "Arrendatário",
                        "Ações",
                    ]}
                >
                    {mergedAssets.map((asset) => (
                        <tr key={asset.id}>
                            <td>{asset.description}</td>
                            <td>{asset.address}</td>
                            <td>{asset.amount}</td>
                            <td>{asset.owner?.registrationNumber === updatedFarmer?.registrationNumber ? "Própria" : "Arrendada"}</td>
                            <td>{asset.owner?.registrationNumber} - {asset.owner?.name}</td>
                            <td>{asset.leasedTo?.registrationNumber} - {asset.leasedTo?.name}</td>
                            <td>
                                <div className="d-flex gap-2">
                                    <button className="button_edit button_sm" onClick={() => { }}>
                                        <FaPencil />
                                    </button>
                                    <button
                                        className="button_remove button_sm"
                                        onClick={() => handleRemoveAsset(`${asset.id!} - ${asset.owner?.registrationNumber}`)}
                                    >
                                        <FaMinus />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </CustomTable>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Fechar
                </Button>
            </Modal.Footer>
        </Modal>
    )
};

export default AssetModal;
