import { Button, Form, Modal } from "react-bootstrap";
import { FarmerType } from "../Type/FarmerType";
import CustomTable from "./Common/CustomTable";
import { useEffect, useState } from "react";
import { FaFloppyDisk, FaMinus, FaPencil, FaPlus } from "react-icons/fa6";
import AssetType from "../Type/AssetType";
import { v4 as uuidv4 } from "uuid";
import "../assets/styles/Components/_button.scss";
import AsyncSelect from "react-select/async";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";

interface AssetModalProps {
    show: boolean;
    onClose: () => void;
    farmer: FarmerType | null;
    onFarmerUpdated: (updatedFarmer: FarmerType) => void;
    onChange: (field: keyof FarmerType, value: any) => void;
}

const AssetModal = ({
    show,
    onClose,
    farmer,
    onFarmerUpdated
}: AssetModalProps) => {
    const [newAssets, setNewAssets] = useState<AssetType[]>([]);
    const [updatedFarmer, setUpdatedFarmer] = useState<FarmerType | null>(null);

    useEffect(() => {
        if (farmer) {
            setUpdatedFarmer(farmer)
        }
    }, [farmer])

    const handleAddNewAsset = () => {
        if (updatedFarmer) {
            const tempId = uuidToNumber(uuidv4());
            setNewAssets([...newAssets, { id: tempId, description: "", owner: updatedFarmer }]);
        }
    };

    const reFetchUpdatedFarmer = async () => {
        if (!updatedFarmer) return;

        try {
            const res = await axiosInstance.get(`/farmer/${updatedFarmer.registrationNumber}`);
            if (res.status === 200) {
                setUpdatedFarmer(res.data);
                onFarmerUpdated(res.data);
            }
        } catch (error) {
            toast.error("Erro ao atualizar dados do produtor.");
        }
    };

    const handleSaveNewAsset = async (tempId: number) => {
        const asset = newAssets.find(a => a.id === tempId);
        if (asset && asset.description.trim() !== "") {
            try {
                const res = await axiosInstance.post("/asset", {
                    description: asset.description,
                    ownerRegistrationNumber: updatedFarmer?.registrationNumber,
                    leasedToRegistrationNumber: asset.leasedTo?.registrationNumber ?? ""
                })

                if (res.status === 200) {
                    reFetchUpdatedFarmer();
                    setNewAssets(prev => prev.filter(a => a.id !== tempId));
                }
            } catch (error) {
                toast.error("Erro ao salvar o bem.")
            }

        } else {
            console.error("Descrição não pode ser vazia.");
        }
    };

    const handleRemoveAsset = async (assetId: number) => {
        try {
            const res = await axiosInstance.delete(`/asset/${assetId}`);

            if (res.status === 200) {
                reFetchUpdatedFarmer();
                setNewAssets(prev => prev.filter(a => a.id !== assetId));
            }
        } catch (error) {
            toast.error("Erro ao remover o bem.")
        }
    };

    const handleDescriptionChange = (tempId: number, value: string) => {
        setNewAssets(newAssets.map(asset =>
            asset.id === tempId ? { ...asset, description: value } : asset
        ));
    };

    const uuidToNumber = (uuid: string): number => {
        const cleanUuid = uuid.replace(/-/g, "").slice(-12);
        return parseInt(cleanUuid, 16);
    };

    return (
        <Modal show={show} onHide={onClose} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>
                    {`Editar bens do produtor ${updatedFarmer?.name}`}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="fw-bold">Áreas Próprias</h5>
                    <button className="button_agree" onClick={handleAddNewAsset}>
                        <FaPlus /> Adicionar Bem
                    </button>
                </div>
                <CustomTable headers={["Id", "Descrição", "Arrendado para", "Ações"]}>
                    {updatedFarmer?.ownedAssets?.map((ownArea) => (
                        <tr key={ownArea.id}>
                            <td>{ownArea.id}</td>
                            <td>{ownArea.description}</td>
                            <td>
                                {ownArea.leasedTo
                                    ? `${ownArea.leasedTo.registrationNumber} - ${ownArea.leasedTo.name}`
                                    : "-"}
                            </td>
                            <td>
                                <div className="d-flex align-items-center justify-content-start gap-2">
                                    <button className="button_edit button_sm">
                                        <FaPencil /> Editar Bem
                                    </button>
                                    {ownArea.id !== undefined && (
                                        <button
                                            className="button_remove button_sm"
                                            onClick={() => handleRemoveAsset(ownArea.id!)}
                                        >
                                            <FaMinus /> Remover Bem
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {newAssets.map((newAsset) => (
                        <tr key={newAsset.id}>
                            <td>-</td>
                            <td>
                                <Form.Control
                                    value={newAsset.description}
                                    onChange={(e) => {
                                        handleDescriptionChange(newAsset.id!, e.target.value);
                                    }}
                                    placeholder="Descrição do bem"
                                />
                            </td>
                            <td>
                                <AsyncSelect
                                    cacheOptions
                                    loadOptions={async (inputValue) => {
                                        try {
                                            const res = await axiosInstance.get(`/farmer`, { params: { value: inputValue, size: 10 } });
                                            return res.data.content.map((farmer: FarmerType) => ({
                                                value: farmer,
                                                label: `${farmer.registrationNumber} - ${farmer.name}`
                                            }));
                                        } catch (error) {
                                            console.error("Erro ao buscar produtores:", error);
                                            return [];
                                        }
                                    }}
                                    defaultOptions
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        control: (base) => ({ ...base, minWidth: '250px' }),
                                    }}
                                    placeholder="Buscar arrendatário..."
                                    isClearable
                                    value={
                                        newAsset.leasedTo
                                            ? { value: newAsset.leasedTo, label: `${newAsset.leasedTo.registrationNumber} - ${newAsset.leasedTo.name}` }
                                            : null
                                    }
                                    onChange={(selectedOption) => {
                                        setNewAssets(prev => prev.map(asset =>
                                            asset.id === newAsset.id
                                                ? { ...asset, leasedTo: selectedOption ? selectedOption.value : undefined }
                                                : asset
                                        ));
                                    }}
                                />
                            </td>
                            <td>
                                <button
                                    onClick={() => newAsset.id !== undefined && handleSaveNewAsset(newAsset.id)}
                                    className="button_info btn_sm"
                                >
                                    <FaFloppyDisk /> Salvar
                                </button>
                            </td>
                        </tr>
                    ))}
                </CustomTable>

                <div className="d-flex align-items-center justify-content-between mt-5 mb-2">
                    <h5 className="fw-bold">Áreas Arrendadas</h5>
                    <button className="button_agree">
                        <FaPlus /> Adicionar Bem
                    </button>
                </div>
                <CustomTable headers={["Id", "Descrição", "Arrendador", "Ações"]}>
                    {updatedFarmer?.leasedAssets?.map((leaArea) => (
                        <tr key={leaArea.id}>
                            <td>{leaArea.id}</td>
                            <td>{leaArea.description}</td>
                            <td>{`${leaArea.owner.registrationNumber} - ${leaArea.owner.name}`}</td>
                            <td>
                                <button>Encerrar o arrendamento</button>
                            </td>
                        </tr>
                    ))}
                </CustomTable>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Fechar
                </Button>
                {/* <Button variant="primary" onClick={handleSubmit}>
                    Salvar
                </Button> */}
            </Modal.Footer>
        </Modal>
    );
};

export default AssetModal;
