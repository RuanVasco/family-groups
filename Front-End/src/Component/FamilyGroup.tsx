import { FaPlus } from "react-icons/fa6";
import "../assets/styles/_familygroup.scss";
import "../assets/styles/Components/_button.scss";
import { FaSearch } from "react-icons/fa";
import { Modal } from "react-bootstrap";
import { useState } from "react";
import { FamilyGroupType } from "../Type/FamilyGroupType";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";
import { FarmerType } from "../Type/FarmerType";

const FamilyGroup = () => {
    const [modalMode, setModalMode] = useState<string>("");
    const [familyGroups, setFamilyGroups] = useState<FamilyGroupType[]>([]);
    const [farmers, setFarmers] = useState<FarmerType[]>([]);
    const [show, setShow] = useState(false);

    const fetchFarmers = async () => {
        try {
            const res = await axiosInstance.get("/farmer");

            if (res.status === 200 || res.status === 201) {
                setFarmers(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os produtores");
            handleClose();
        }
    }

    const fetchFamilyGroups = async () => {
        try {
            const res = await axiosInstance.get("/family-group");

            if (res.status === 200 || res.status === 201) {
                setFamilyGroups(res.data);
            }
        } catch (error) {
            toast.error("Erro ao buscar os grupos familiares");
            handleClose();
        }
    }

    const handleClose = () => setShow(false);

    const handleModalShow = (mode: string) => {
        if (mode === "select") {
            fetchFamilyGroups();
        } else if (mode === "create") {
            fetchFarmers();
        }

        setModalMode(mode);
        setShow(true);
    };

    return (
        <div className="container-fluid pt-4">
            <div className="family-group-header">
                <input type="text" readOnly className="input-readonly" />
                <button
                    type="button"
                    className="btn-select"
                    onClick={() => handleModalShow("select")}
                ><FaSearch /> Selecionar</button>
                <button
                    type="button"
                    className="btn-create"
                    onClick={() => handleModalShow("create")}
                >
                    <FaPlus />Criar
                </button>
            </div>
            <h2>Participantes</h2>
            <div>
                <button>Adicionar Participante</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>Situação</th>
                    </tr>
                </thead>
            </table>

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {modalMode === "create" ? "Criar um grupo familiar" : "Selecione um grupo familiar"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalMode === "select" ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Ações</th>
                                    <th>ID</th>
                                    <th>Principal</th>
                                    <th>Técnico</th>
                                </tr>
                            </thead>
                            <tbody>
                                {familyGroups.map((group) => (
                                    <tr key={group.id}>
                                        <td>Selecionar</td>
                                        <td>{group.id}</td>
                                        <td>{group.principal.name}</td>
                                        <td>{group.technician?.username}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <>
                            <label>Principal</label>
                            <select>
                                {farmers.map((farmer) => (
                                    <option key={Number(farmer.registrationNumber)}>{farmer.name}</option>
                                ))}
                            </select>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {/* <Button variant="secondary" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                    >
                        {modalMode === "create" ? "Criar" : "Atualizar"}
                    </Button> */}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FamilyGroup;
