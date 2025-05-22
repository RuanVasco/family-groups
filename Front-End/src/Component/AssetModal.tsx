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
    currentFarmer: FarmerType | null;
    setCurrentFarmer: (farmer: FarmerType | null) => void;
    onFarmerUpdated: (f: FarmerType) => void;
    onChange: (field: keyof FarmerType, value: any) => void;
    onOtherFarmerUpdated?: (farmer: FarmerType) => void;
    onGroupUpdated?: () => void;
}

const AssetModal = ({
    show,
    onClose,
    currentFarmer,
    setCurrentFarmer,
    onFarmerUpdated,
    onOtherFarmerUpdated,
    onGroupUpdated
}: AssetModalProps) => {
    const [mergedAssets, setMergedAssets] = useState<AssetType[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [formMode, setFormMode] = useState<"create" | "update" | null>(null);
    const [newAsset, setNewAsset] = useState<AssetType | null>(null);
    const [isOwned, setIsOwner] = useState<boolean | null>(null);

    const [removeConfirmation, setRemoveConfirmation] = useState<boolean>(false);
    const [assetToRemove, setAssetToRemove] = useState<AssetType | null>(null);

    const [loading, setLoading] = useState<boolean>(false);

    const assetOptions = [
        { value: null, label: "Selecione" },
        { value: 1, label: "Próprio" },
        { value: 2, label: "Arrendado" },
    ];

    const reloadFarmer = async (
        registrationNumber: String,
        onlyNotify: boolean
    ) => {
        if (!registrationNumber) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get<FarmerType>(
                `/farmer/${registrationNumber}`
            );

            if (res.status === 200) {
                if (!onlyNotify && registrationNumber === currentFarmer?.registrationNumber) {
                    setCurrentFarmer(res.data);
                }

                onFarmerUpdated(res.data);
            }
        } catch {
            toast.error("Erro ao buscar dados do produtor");
        } finally {
            setLoading(false);
        }
    };

    const loadFarmers = async (input: string) => {
        try {
            const res = await axiosInstance.get("/farmer", {
                params: { value: input, size: 10 },
            });
            return res.data.content
                .filter((f: FarmerType) => f.registrationNumber !== currentFarmer?.registrationNumber)
                .map((f: FarmerType) => ({
                    value: f,
                    label: `${f.registrationNumber} - ${f.name}`,
                }));
        } catch {
            return [];
        }
    };

    const handleShowFormToggle = () => {
        setShowForm(!showForm);
    }

    useEffect(() => {
        setMergedAssets([
            ...(currentFarmer?.ownedAssets ?? []),
            ...(currentFarmer?.leasedAssets ?? []),
        ]);
    }, [currentFarmer?.ownedAssets, currentFarmer?.leasedAssets]);

    const handleSubmit = async () => {
        if (!newAsset || !currentFarmer) return;

        if (isOwned === undefined || isOwned === null) {
            toast.error("Por favor preencher os campos obrigatórios.");
            return;
        }

        const data = {
            description: newAsset.description,
            address: newAsset.address,
            amount: newAsset.amount,
            ownerRegistrationNumber: isOwned
                ? currentFarmer.registrationNumber
                : newAsset.owner?.registrationNumber,
            leasedToRegistrationNumber: isOwned
                ? newAsset.leasedTo?.registrationNumber
                : currentFarmer.registrationNumber,
            assetTypeId: 1
        };

        let res;
        let msg_success = "";
        let msg_error = "";

        try {
            switch (formMode) {
                case "create":
                    res = await axiosInstance.post("/asset", data);
                    msg_success = "Bem adicionado";
                    msg_error = "Erro ao adicionar o bem";
                    break;
                case "update":
                    res = await axiosInstance.put(`/asset/${newAsset.id}`, data);
                    msg_success = "Bem atualizado";
                    msg_error = "Erro ao atualizar o bem";
                    break;
                default:
                    return;
            }

            if (res.status === 200 || res.status === 201) {
                toast.success(msg_success);

                await reloadFarmer(currentFarmer!.registrationNumber, false);
                setShowForm(false);

                onGroupUpdated?.();

                if (isOwned && newAsset.leasedTo) {
                    await reloadFarmer(newAsset.leasedTo.registrationNumber, true);
                    onOtherFarmerUpdated?.(newAsset.leasedTo);
                } else if (!isOwned && newAsset.owner) {
                    await reloadFarmer(newAsset.owner.registrationNumber, true);
                    onOtherFarmerUpdated?.(newAsset.owner);
                }
            }

        } catch (error: any) {
            const apiMessage = error.response?.data || msg_error;
            toast.error(apiMessage);
        }
    };

    const handleAddNewAsset = async () => {
        setFormMode("create");
        if (!showForm) {
            setIsOwner(null);
            setNewAsset({
                id: undefined,
                description: "",
                address: "",
                amount: 0,
                owner: undefined,
                leasedTo: undefined,
                assetType: { id: 0, description: "" },
            });
        }
        handleShowFormToggle();
    };

    const handleUpdateAsset = async (asset: AssetType) => {
        (asset.owner?.registrationNumber === currentFarmer?.registrationNumber) ? setIsOwner(true) : false;
        setFormMode("update");
        setNewAsset(asset);
        handleShowFormToggle();
    };

    const handleRemoveAsset = async (asset: AssetType) => {
        try {
            const id = `${asset.id!} - ${asset.owner?.registrationNumber}`;
            const cleanId = id.split(" - ")[0].trim();

            await axiosInstance.delete(`/asset/${cleanId}`);
            toast.success("Bem removido");

            if (currentFarmer) {
                await reloadFarmer(currentFarmer.registrationNumber, false);
            }

            onGroupUpdated?.();

            const relatedFarmers = [asset.owner, asset.leasedTo]
                .filter(f => f?.registrationNumber && f.registrationNumber !== currentFarmer?.registrationNumber);

            for (const farmer of relatedFarmers) {
                await reloadFarmer(farmer!.registrationNumber, true);
                onOtherFarmerUpdated?.(farmer!);
            }

            setRemoveConfirmation(false);
            setAssetToRemove(null);
        } catch {
            toast.error("Erro ao remover o bem");
        }
    };


    const handleCloseModal = () => {
        setRemoveConfirmation(false);
        setAssetToRemove(null);
        setShowForm(false);
        setNewAsset(null);
        onClose();
    }

    return (
        <Modal show={show} onHide={handleCloseModal} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Editar bens do produtor {currentFarmer?.registrationNumber} - {currentFarmer?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                    </div>
                ) : (
                    <>
                        {(removeConfirmation && assetToRemove) ? (
                            <>
                                <h4 className="text-center fw-bold">Tem certeza que deseja remover o bem {assetToRemove.id}?</h4>
                                <div className="d-flex justify-content-center align-itens-center mt-3 gap-3">
                                    <button
                                        className="button_remove button_sm"
                                        onClick={() => handleRemoveAsset(assetToRemove)}
                                    >
                                        <FaMinus /> Remover
                                    </button>
                                    <button
                                        className="button_agree button_sm"
                                        onClick={() => {
                                            setAssetToRemove(null);
                                            setRemoveConfirmation(false);
                                        }}
                                    >
                                        <FaXmark /> Cancelar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <><div className="d-flex justify-content-between mb-2">
                                <h5 className="fw-bold">Bens</h5>
                                <button className={`button_${showForm ? "edit" : "agree"}`} onClick={handleAddNewAsset}>
                                    {showForm ? <><FaMinus /> Fechar formulário</> : <><FaPlus /> Criar bem</>}
                                </button>
                            </div>
                                {showForm && (
                                    <div>
                                        <Form.Group className="mt-2">
                                            <Form.Label>
                                                Área (ha)
                                            </Form.Label>
                                            <Form.Control
                                                value={newAsset?.amount || ""}
                                                type="number"
                                                onChange={(e) =>
                                                    setNewAsset((prev) => prev ? { ...prev, amount: parseFloat(e.target.value.replace(",", ".")) || 0 } : null)
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mt-2">
                                            <Form.Label>
                                                Tipo *
                                            </Form.Label>
                                            <Select
                                                options={assetOptions}
                                                required
                                                value={isOwned == null ? null : assetOptions[isOwned ? 1 : 2]}
                                                onChange={(opt) => {
                                                    setIsOwner(opt?.value === 1);
                                                    setNewAsset((prev) => prev ? {
                                                        ...prev,
                                                        assetCategory: {
                                                            id: opt?.value ?? 0,
                                                            description: opt?.label ?? ""
                                                        },
                                                        owner: null,
                                                        leasedTo: null,
                                                    } : null);
                                                }}
                                                menuPortalTarget={document.body}
                                                styles={{
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                }}
                                            />
                                        </Form.Group>
                                        {newAsset && (
                                            <Form.Group className="mt-2">
                                                <Form.Label>
                                                    {isOwned ? "Arrendatário" : "Proprietário"}
                                                </Form.Label>
                                                <AsyncSelect
                                                    isClearable
                                                    loadOptions={loadFarmers}
                                                    defaultOptions
                                                    value={
                                                        isOwned === null
                                                            ? null
                                                            : isOwned
                                                                ? newAsset.leasedTo
                                                                    ? { value: newAsset.leasedTo, label: `${newAsset.leasedTo.registrationNumber} - ${newAsset.leasedTo.name}` }
                                                                    : null
                                                                : newAsset.owner
                                                                    ? { value: newAsset.owner, label: `${newAsset.owner.registrationNumber} - ${newAsset.owner.name}` }
                                                                    : null
                                                    }

                                                    onChange={(opt) => {
                                                        setNewAsset((prev) => prev ? {
                                                            ...prev,
                                                            leasedTo: isOwned ? opt?.value ?? null : prev.leasedTo,
                                                            owner: !isOwned ? opt?.value ?? null : prev.owner,
                                                        } : null);
                                                    }}
                                                    menuPortalTarget={document.body}
                                                    styles={{
                                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    }}
                                                />
                                            </Form.Group>
                                        )}
                                        <Form.Group className="mt-2">
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
                                        <Form.Group className="mt-2">
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
                                        <div className="d-flex align-items-center justify-content-end my-3 gap-2">
                                            <button
                                                className="button_info button_sm"
                                                onClick={handleSubmit}
                                            >
                                                <FaFloppyDisk /> Salvar
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <CustomTable
                                    headers={[
                                        "Tipo",
                                        "Descrição",
                                        "Endereço",
                                        "Quantidade",
                                        "Proprietário",
                                        "Arrendatário",
                                        "Ações",
                                    ]}
                                >
                                    {mergedAssets.map((asset) => (
                                        (asset.assetType.id === 1 || asset.assetType.id === 2) && (
                                            <tr key={asset.id}>
                                                <td>{asset.owner?.registrationNumber === currentFarmer?.registrationNumber ? "Própria" : "Arrendada"}</td>
                                                <td>{asset.description}</td>
                                                <td>{asset.address}</td>
                                                <td>{asset.amount} ha</td>
                                                <td>{asset.owner?.registrationNumber} - {asset.owner?.name}</td>
                                                <td>{asset.leasedTo?.registrationNumber} - {asset.leasedTo?.name}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="button_edit button_sm"
                                                            onClick={() => handleUpdateAsset(asset)}
                                                        >
                                                            <FaPencil />
                                                        </button>
                                                        <button
                                                            className="button_remove button_sm"
                                                            onClick={() => {
                                                                setAssetToRemove(asset);
                                                                setRemoveConfirmation(true);
                                                            }}
                                                        >
                                                            <FaMinus />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </CustomTable></>
                        )}
                    </>
                )}


            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>
                    Fechar
                </Button>
            </Modal.Footer>
        </Modal>
    )
};

export default AssetModal;
