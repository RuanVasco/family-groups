import { Button, Form, Modal } from "react-bootstrap";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import { FarmerType } from "../Type/FarmerType";
import { UserType } from "../Type/UserType";
import { StatusEnum, StatusLabels } from "../Enum/StatusEnum";
import Select from "react-select";
import AsyncSelect from 'react-select/async';
import axiosInstance from "../axiosInstance";
import { useFetchData } from "../Hook/useFetchData";
import { useEffect } from "react";
import { BranchType } from "../Type/BranchType";

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
    onChange
}: FarmerModalProps) => {
    const { data: users, fetch } = useFetchData<UserType[]>();

    useEffect(() => {
        fetch("/user/all", "Failed to load users.");
    }, []);

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
                            onChange={(e) => onChange("registrationNumber", e.target.value)}
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
                            onChange={(e) => onChange("status", e.target.value as StatusEnum)}
                        >
                            <option value="">Selecione uma opção</option>
                            {Object.values(StatusEnum).map((status) => (
                                <option key={status} value={status}>
                                    {StatusLabels[status]}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Área própria (ha)</Form.Label>
                        <Form.Control
                            required
                            type="number"
                            value={currentFarmer?.ownedArea || 0}
                            onChange={(e) => onChange("ownedArea", parseFloat(e.target.value))}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Área arrendada (ha)</Form.Label>
                        <Form.Control
                            required
                            type="number"
                            value={currentFarmer?.leasedArea || 0}
                            onChange={(e) => onChange("leasedArea", parseFloat(e.target.value))}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Grupo Familiar</Form.Label>
                        <AsyncSelect
                            cacheOptions
                            loadOptions={async (inputValue) => {
                                try {
                                    const res = await axiosInstance.get(`/family-group`, { params: { search: inputValue, size: 10 } });
                                    return res.data.content.map((group: FamilyGroupType) => ({
                                        value: group,
                                        label: group.principal.name
                                    }));
                                } catch (error) {
                                    return [];
                                }
                            }}
                            defaultOptions
                            value={
                                currentFarmer?.familyGroup
                                    ? { value: currentFarmer.familyGroup, label: currentFarmer.familyGroup.principal.name }
                                    : null
                            }
                            onChange={(selectedOption) => onChange("familyGroup", selectedOption?.value)}
                            placeholder="Buscar grupo familiar..."
                            isClearable
                        />
                    </Form.Group>
                    {users && (
                        <Form.Group>
                            <Form.Label>Técnico</Form.Label>
                            <Select
                                options={users.map((user) => ({
                                    value: user,
                                    label: user.name
                                }))}
                                value={users
                                    .map((user) => ({ value: user, label: user.name }))
                                    .find(opt => opt.value.id === currentFarmer?.technician?.id)}
                                onChange={(selectedOption) => onChange("technician", selectedOption?.value)}
                                placeholder="Selecione um técnico"
                                isClearable
                            />
                        </Form.Group>
                    )}
                    <Form.Group className="mt-3">
                        <Form.Label>Carteira</Form.Label>
                        <AsyncSelect
                            cacheOptions
                            isDisabled={modalMode === "edit"}
                            loadOptions={async (inputValue) => {
                                try {
                                    const res = await axiosInstance.get(`/branch`, { params: { search: inputValue, size: 10 } });
                                    return res.data.map((branch: BranchType) => ({
                                        value: branch,
                                        label: branch.name
                                    }));
                                } catch (error) {
                                    return [];
                                }
                            }}
                            defaultOptions
                            value={
                                currentFarmer?.branch
                                    ? { value: currentFarmer.branch, label: currentFarmer.branch.name }
                                    : null
                            }
                            onChange={(selectedOption) => onChange("branch", selectedOption?.value)}
                            placeholder="Buscar carteira..."
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
    )
}

export default FarmerModal;
