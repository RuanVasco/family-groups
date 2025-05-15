import { useEffect, useState } from "react";
import {
    FaFloppyDisk,
    FaMinus,
    FaPencil,
    FaPlus,
    FaXmark,
} from "react-icons/fa6";
import { Button, Form, Modal } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";

import { FarmerType } from "../Type/FarmerType";
import AssetType from "../Type/AssetType";
import { AssetEnum, AssetLabels } from "../Enum/AssetEnum";
import CustomTable from "./Common/CustomTable";

import "../assets/styles/Components/_button.scss";
import { v4 as uuidv4 } from "uuid";

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

    const [newAssets, setNewAssets] = useState<AssetType[]>([]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [draftAssets, setDraftAssets] = useState<Record<number, AssetType>>({});

    const assetOptions = [
        { value: AssetEnum.OWNED, label: AssetLabels[AssetEnum.OWNED] },
        { value: AssetEnum.LEASED, label: AssetLabels[AssetEnum.LEASED] },
    ];

    const uuidToNumber = (uuid: string) =>
        parseInt(uuid.replace(/-/g, "").slice(-12), 16);

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

    useEffect(() => {
        setMergedAssets([
            ...(updatedFarmer?.ownedAssets ?? []),
            ...(updatedFarmer?.leasedAssets ?? []),
        ]);
    }, [updatedFarmer?.ownedAssets, updatedFarmer?.leasedAssets]);

    const handleAddNewAsset = () => {
        if (!updatedFarmer) return;
        const tmpId = uuidToNumber(uuidv4());
        setNewAssets((prev) => [
            ...prev,
            { id: tmpId, description: "", owner: updatedFarmer },
        ]);
    };

    const handleSaveNewAsset = async (tmpId: number) => {
        const asset = newAssets.find((a) => a.id === tmpId);
        if (!asset || !asset.description.trim()) {
            toast.warn("Descrição é obrigatória");
            return;
        }
        try {
            await axiosInstance.post("/asset", {
                description: asset.description,
                ownerRegistrationNumber:
                    asset.owner?.registrationNumber ?? "",
                leasedToRegistrationNumber: asset.leasedTo?.registrationNumber ?? "",
            });
            toast.success("Bem cadastrado");
            setNewAssets((prev) => prev.filter((a) => a.id !== tmpId));
            reFetchUpdatedFarmer();
        } catch {
            toast.error("Erro ao salvar o bem");
        }
    };

    const handleRemoveAsset = async (id: number) => {
        try {
            await axiosInstance.delete(`/asset/${id}`);
            toast.success("Bem removido");
            reFetchUpdatedFarmer();
        } catch {
            toast.error("Erro ao remover o bem");
        }
    };

    const startEdit = (asset: AssetType) => {
        setEditingId(asset.id!);
        setDraftAssets((d) => ({ ...d, [asset.id!]: { ...asset } }));
    };

    const cancelEdit = (id: number) => {
        setEditingId(null);
        setDraftAssets((d) => {
            const { [id]: _, ...rest } = d;
            return rest;
        });
    };

    const handleUpdateAsset = async (id: number) => {
        const asset = draftAssets[id];
        if (!asset || !asset.description.trim()) {
            toast.warn("Descrição é obrigatória");
            return;
        }
        try {
            await axiosInstance.put(`/asset/${id}`, {
                description: asset.description,
                ownerRegistrationNumber: asset.owner?.registrationNumber ?? "",
                leasedToRegistrationNumber: asset.leasedTo?.registrationNumber ?? "",
            });
            toast.success("Bem atualizado");
            setEditingId(null);
            reFetchUpdatedFarmer();
        } catch {
            toast.error("Erro ao atualizar o bem");
        }
    };

    const commonSelectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any) => ({ ...base, minWidth: "250px" }),
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

    return (
        <Modal show={show} onHide={onClose} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Editar bens do produtor {updatedFarmer?.name}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex justify-content-between mb-2">
                    <h5 className="fw-bold">Bens</h5>
                    <button className="button_agree" onClick={handleAddNewAsset}>
                        <FaPlus /> Adicionar bem
                    </button>
                </div>

                <CustomTable
                    headers={[
                        "Id",
                        "Descrição",
                        "Tipo",
                        "Arrendador",
                        "Arrendatário",
                        "Ações",
                    ]}
                >
                    {mergedAssets.map(asset => {
                        const isEditing = editingId === asset.id;

                        const row = isEditing ? draftAssets[asset.id!] : asset;

                        const isOwnedByMe = row.owner?.registrationNumber === updatedFarmer?.registrationNumber;
                        const currentType = isOwnedByMe ? AssetEnum.OWNED : AssetEnum.LEASED;
                        const typeValue = assetOptions.find(o => o.value === currentType) ?? null;

                        if (isEditing) {
                            return (
                                <tr key={asset.id}>
                                    <td>{asset.id}</td>

                                    <td>
                                        <Form.Control
                                            value={row.description}
                                            onChange={e =>
                                                setDraftAssets(d => ({
                                                    ...d,
                                                    [asset.id!]: { ...d[asset.id!], description: e.target.value },
                                                }))
                                            }
                                        />
                                    </td>

                                    <td>
                                        <Select
                                            options={assetOptions}
                                            value={typeValue}
                                            onChange={opt =>
                                                setDraftAssets(d => {
                                                    const type = opt?.value as AssetEnum;
                                                    const cur = d[asset.id!];
                                                    return {
                                                        ...d,
                                                        [asset.id!]: {
                                                            ...cur,
                                                            assetType: type,
                                                            owner: type === AssetEnum.OWNED ? updatedFarmer ?? undefined : undefined,
                                                            leasedTo: type === AssetEnum.LEASED ? updatedFarmer ?? undefined : undefined,
                                                        },
                                                    };
                                                })
                                            }
                                            styles={commonSelectStyles}
                                            menuPortalTarget={document.body}
                                        />
                                    </td>

                                    <td>
                                        <AsyncSelect
                                            isDisabled={row.assetType !== AssetEnum.LEASED}
                                            loadOptions={loadFarmers}
                                            defaultOptions
                                            value={
                                                row.owner
                                                    ? { value: row.owner, label: `${row.owner.registrationNumber} - ${row.owner.name}` }
                                                    : null
                                            }
                                            onChange={opt =>
                                                setDraftAssets(d => ({
                                                    ...d,
                                                    [asset.id!]: { ...d[asset.id!], owner: opt?.value },
                                                }))
                                            }
                                            styles={commonSelectStyles}
                                            menuPortalTarget={document.body}
                                        />
                                    </td>

                                    <td>
                                        <AsyncSelect
                                            isDisabled={row.assetType !== AssetEnum.OWNED}
                                            loadOptions={loadFarmers}
                                            defaultOptions
                                            value={
                                                row.leasedTo
                                                    ? { value: row.leasedTo, label: `${row.leasedTo.registrationNumber} - ${row.leasedTo.name}` }
                                                    : null
                                            }
                                            onChange={opt =>
                                                setDraftAssets(d => ({
                                                    ...d,
                                                    [asset.id!]: { ...d[asset.id!], leasedTo: opt?.value },
                                                }))
                                            }
                                            styles={commonSelectStyles}
                                            menuPortalTarget={document.body}
                                        />
                                    </td>

                                    <td className="d-flex gap-2">
                                        <button
                                            className="button_info button_sm"
                                            onClick={() => handleUpdateAsset(asset.id!)}
                                        >
                                            <FaFloppyDisk /> Salvar
                                        </button>
                                        <button
                                            className="button_remove button_sm"
                                            onClick={() => cancelEdit(asset.id!)}
                                        >
                                            <FaXmark /> Cancelar
                                        </button>
                                    </td>
                                </tr>
                            );
                        }

                        return (
                            <tr key={asset.id}>
                                <td>{asset.id}</td>
                                <td>{asset.description}</td>
                                <td>{asset.owner?.registrationNumber === updatedFarmer?.registrationNumber ? "Própria" : "Arrendado"} </td>
                                <td>
                                    {asset.owner
                                        ? `${asset.owner.registrationNumber} - ${asset.owner.name}`
                                        : "-"}
                                </td>
                                <td>
                                    {asset.leasedTo
                                        ? `${asset.leasedTo.registrationNumber} - ${asset.leasedTo.name}`
                                        : "-"}
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <button className="button_edit button_sm" onClick={() => startEdit(asset)}>
                                            <FaPencil />
                                        </button>
                                        <button
                                            className="button_remove button_sm"
                                            onClick={() => handleRemoveAsset(asset.id!)}
                                        >
                                            <FaMinus />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}

                    {/* linhas de novos bens */}
                    {newAssets.map((a) => (
                        <tr key={a.id}>
                            <td>-</td>

                            {/* descrição */}
                            <td>
                                <Form.Control
                                    value={a.description}
                                    onChange={(e) =>
                                        setNewAssets((prev) =>
                                            prev.map((x) =>
                                                x.id === a.id ? { ...x, description: e.target.value } : x
                                            )
                                        )
                                    }
                                />
                            </td>

                            {/* tipo */}
                            <td>
                                <Select
                                    options={assetOptions}
                                    value={
                                        a.assetType
                                            ? assetOptions.find((o) => o.value === a.assetType)
                                            : null
                                    }
                                    onChange={(opt) =>
                                        setNewAssets((prev) =>
                                            prev.map((x) =>
                                                x.id === a.id
                                                    ? {
                                                        ...x,
                                                        assetType: opt?.value as AssetEnum,
                                                        owner:
                                                            opt?.value === AssetEnum.OWNED
                                                                ? updatedFarmer ?? undefined
                                                                : undefined,
                                                        leasedTo:
                                                            opt?.value === AssetEnum.LEASED
                                                                ? updatedFarmer ?? undefined
                                                                : undefined,
                                                    }
                                                    : x
                                            )
                                        )
                                    }
                                    styles={commonSelectStyles}
                                    menuPortalTarget={document.body}
                                />
                            </td>

                            {/* arrendador */}
                            <td>
                                <AsyncSelect
                                    isDisabled={a.assetType !== AssetEnum.LEASED}
                                    loadOptions={loadFarmers}
                                    defaultOptions
                                    value={
                                        a.owner
                                            ? {
                                                value: a.owner,
                                                label: `${a.owner.registrationNumber} - ${a.owner.name}`,
                                            }
                                            : null
                                    }
                                    onChange={(opt) =>
                                        setNewAssets((prev) =>
                                            prev.map((x) =>
                                                x.id === a.id ? { ...x, owner: opt?.value } : x
                                            )
                                        )
                                    }
                                    styles={commonSelectStyles}
                                    menuPortalTarget={document.body}
                                />
                            </td>

                            {/* arrendatário */}
                            <td>
                                <AsyncSelect
                                    isDisabled={a.assetType !== AssetEnum.OWNED}
                                    loadOptions={loadFarmers}
                                    defaultOptions
                                    value={
                                        a.leasedTo
                                            ? {
                                                value: a.leasedTo,
                                                label: `${a.leasedTo.registrationNumber} - ${a.leasedTo.name}`,
                                            }
                                            : null
                                    }
                                    onChange={(opt) =>
                                        setNewAssets((prev) =>
                                            prev.map((x) =>
                                                x.id === a.id ? { ...x, leasedTo: opt?.value } : x
                                            )
                                        )
                                    }
                                    styles={commonSelectStyles}
                                    menuPortalTarget={document.body}
                                />
                            </td>

                            <td className="d-flex gap-2">
                                <button
                                    className="button_info button_sm"
                                    onClick={() => handleSaveNewAsset(a.id!)}
                                >
                                    <FaFloppyDisk />
                                </button>
                                <button
                                    className="button_remove button_sm"
                                    onClick={() =>
                                        setNewAssets((prev) => prev.filter((x) => x.id !== a.id))
                                    }
                                >
                                    <FaXmark />
                                </button>
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
    );
};

export default AssetModal;
