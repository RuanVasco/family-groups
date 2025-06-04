import { Button, Form, Modal } from "react-bootstrap";
import { useEffect, useMemo } from "react";
import Select, { SingleValue } from "react-select";
import AsyncSelect from "react-select/async";
import axiosInstance from "../axiosInstance";
import { useFetchData } from "../Hook/useFetchData";

import { FamilyGroupType } from "../Type/FamilyGroupType";
import { FarmerType } from "../Type/FarmerType";
import { UserType } from "../Type/UserType";
import { StatusEnum, StatusLabels } from "../Enum/StatusEnum";


type TechnicianOption = {
    value: UserType | null;
    label: string;
};

interface FarmerModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: () => void;
    currentFarmer: Partial<FarmerType> | null;
    modalMode: "create" | "edit";
    onChange: (field: keyof FarmerType, value: any) => void;
}


const FarmerModal = ({
    show,
    onClose,
    onSubmit,
    currentFarmer,
    modalMode,
    onChange,
}: FarmerModalProps) => {
    const { data: users = [], fetch } = useFetchData<UserType[]>();

    useEffect(() => {
        if (!fetch) return;
        fetch("/user/all", "Failed to load users.");
    }, [show]);

    const technicianOptions: TechnicianOption[] = [
        { value: null, label: "Sem técnico" },
        ...(users ?? []).map<TechnicianOption>((u) => ({
            value: u,
            label: u.name,
        })),
    ];

    const selectedTechnician: TechnicianOption | null = useMemo(() => {
        if (!currentFarmer?.technician) return null;
        return technicianOptions.find(
            (opt) => opt.value?.id === currentFarmer.technician?.id,
        ) ?? null;
    }, [technicianOptions, currentFarmer?.technician]);

    const toPositiveNumberOrUndefined = (raw: string) => {
        if (raw === "") return undefined;
        const n = Number(raw);
        return Number.isFinite(n) && n >= 0 ? n : undefined;
    };

    const loadBranch27 = async () => {
        try {
            const { data } = await axiosInstance.get("/branch/27");
            return data ? [{ value: data, label: data.name }] : [];
        } catch {
            return [];
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>
                    {modalMode === "create" ? "Criar Produtor" : "Editar Produtor"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Matrícula</Form.Label>
                        <Form.Control
                            type="text"
                            value={Number(currentFarmer?.registrationNumber) || ""}
                            onChange={(e) =>
                                onChange("registrationNumber", e.target.value)
                            }
                            disabled={modalMode === "edit"}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Nome</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            value={currentFarmer?.name || ""}
                            onChange={(e) => onChange("name", e.target.value)}
                            disabled={modalMode === "edit"}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Situação</Form.Label>
                        <Form.Select
                            required
                            value={currentFarmer?.status || ""}
                            onChange={(e) =>
                                onChange("status", e.target.value as StatusEnum)
                            }
                        >
                            <option value="">Selecione uma opção</option>
                            {Object.values(StatusEnum).map((s) => (
                                <option key={s} value={s}>
                                    {StatusLabels[s]}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Área própria (ha)</Form.Label>
                        <Form.Control
                            required
                            type="number"
                            min={0}
                            step="any"
                            value={currentFarmer?.ownedArea ?? ""}
                            onChange={(e) =>
                                onChange("ownedArea", toPositiveNumberOrUndefined(e.target.value))
                            }
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Área arrendada (ha)</Form.Label>
                        <Form.Control
                            required
                            type="number"
                            min={0}
                            step="any"
                            value={currentFarmer?.leasedArea ?? ""}
                            onChange={(e) =>
                                onChange("leasedArea", toPositiveNumberOrUndefined(e.target.value))
                            }
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Grupo Familiar</Form.Label>
                        <AsyncSelect
                            cacheOptions
                            loadOptions={async (inputValue) => {
                                try {
                                    const res = await axiosInstance.get("/family-group", {
                                        params: { search: inputValue, size: 10 },
                                    });
                                    return res.data.content.map((group: FamilyGroupType) => ({
                                        value: group,
                                        label: group.principal.name,
                                    }));
                                } catch {
                                    return [];
                                }
                            }}
                            value={
                                currentFarmer?.familyGroup
                                    ? {
                                        value: currentFarmer.familyGroup,
                                        label: currentFarmer.familyGroup.principal.name,
                                    }
                                    : null
                            }
                            onChange={(opt) => onChange("familyGroup", opt?.value)}
                            placeholder="Buscar grupo familiar..."
                            isClearable
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Técnico</Form.Label>
                        <Select<TechnicianOption, false>
                            options={technicianOptions}
                            value={selectedTechnician}
                            onChange={(opt: SingleValue<TechnicianOption>) =>
                                onChange("technician", opt?.value ?? null)
                            }
                            placeholder="Selecione um técnico"
                            isClearable
                            getOptionValue={(opt) => opt.value?.id?.toString() ?? "none"}
                        />
                    </Form.Group>

                    <Form.Group className="mt-3">
                        <Form.Label>Carteira</Form.Label>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadBranch27}
                            value={
                                currentFarmer?.branch
                                    ? { value: currentFarmer.branch, label: currentFarmer.branch.name }
                                    : null
                            }
                            onChange={(opt) => onChange("branch", opt?.value)}
                            placeholder="Carteira 27"
                            isClearable
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={onSubmit}>
                    {modalMode === "create" ? "Criar" : "Salvar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FarmerModal;
