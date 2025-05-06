import { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useAuthorization } from '../Context/AuthorizationContext';
import Farmer from '../Component/Farmer';
import Report from '../Component/Report';
import logo from '../assets/logo.png';
import FamilyGroup from '../Component/FamilyGroup';
import User from '../Component/User';
import "../assets/styles/_sidebar.scss";
import Branch from '../Component/Branch';
import { Button, Form, Modal } from 'react-bootstrap';
import { FaUpload } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import axiosInstance from '../axiosInstance';

const HomePage = () => {
    const { logout } = useAuth();
    const { hasPermission } = useAuthorization();

    const [viewType, setViewType] = useState<string>("familyGroup");
    const [canViewUsers, setCanViewUsers] = useState<boolean>(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            const allowed = await hasPermission("User");
            setCanViewUsers(allowed);
        };

        checkPermission();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
        } else {
            setCsvFile(null);
        }
    };

    const handleUpload = async () => {
        if (!csvFile) return;

        const formData = new FormData();
        formData.append('file', csvFile);

        try {
            const res = await axiosInstance.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.status === 200 || res.status === 201) {
                toast.success("Arquivo enviado com sucesso.");
            }

            if (res.status === 202) {
                toast.success("Arquivo está sendo carregado.");
            }
        } catch (error) {
            toast.error("Erro ao enviar arquivo.")
        } finally {
            setShow(false);
        }
    };

    return (
        <div className="row">
            <div className="col-2 sidebar d-flex flex-column">
                <div className="logo_box">
                    <img src={logo} alt="Logo" className="logo" />
                </div>

                <ul className="sidebar_menu flex-grow-1">
                    <li
                        onClick={() => setViewType("familyGroup")}
                        className={viewType === "familyGroup" ? "active" : ""}
                    >
                        Grupo Familiar
                    </li>
                    <li
                        onClick={() => setViewType("farmer")}
                        className={viewType === "farmer" ? "active" : ""}
                    >
                        Produtores
                    </li>
                    {canViewUsers && (
                        <>
                            <li
                                onClick={() => setViewType("user")}
                                className={viewType === "user" ? "active" : ""}
                            >
                                Usuários
                            </li>
                            <li
                                onClick={() => setViewType("branch")}
                                className={viewType === "branch" ? "active" : ""}
                            >
                                Carteiras
                            </li>
                            <li
                                onClick={() => setViewType("report")}
                                className={viewType === "report" ? "active" : ""}
                            >
                                Relatório
                            </li>
                            <li
                                onClick={() => setShow(true)}
                                className="d-flex align-items-center gap-2"
                            >
                                Enviar Dados <FaUpload />
                            </li>
                        </>
                    )}

                </ul>

                <div className="logout_box mt-auto">
                    <button className="btn_logout w-100" onClick={logout}>
                        Sair
                    </button>
                </div>
            </div>

            <div className="content col">
                {viewType === "familyGroup" && <FamilyGroup />}
                {viewType === "farmer" && <Farmer />}
                {canViewUsers && (
                    <>
                        {viewType === "user" && <User />}
                        {viewType === "branch" && <Branch />}
                        {viewType === "report" && <Report />}
                    </>
                )}
            </div>
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Enviar arquivos
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>
                                Selecionar um arquivo
                            </Form.Label>
                            <Form.Control
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleUpload}>
                        Enviar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default HomePage;
