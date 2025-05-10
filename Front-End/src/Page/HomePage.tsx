import { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useAuthorization } from '../Context/AuthorizationContext';
import Farmer from '../Component/Farmer';
import logo from '../assets/logo.png';
import FamilyGroup from '../Component/CRUD/FamilyGroup';
import User from '../Component/User';
import "../assets/styles/_sidebar.scss";
import Branch from '../Component/Branch';
import { Button, Form, Modal } from 'react-bootstrap';
import { FaChartColumn, FaChevronLeft, FaChevronRight, FaUpload, FaUser, FaUserGroup, FaWallet, FaWheatAwn } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import axiosInstance from '../axiosInstance';
import { BranchType } from '../Type/BranchType';
import { usePaginatedFetchData } from '../Hook/usePaginatedFetchData';
import { UserType } from '../Type/UserType';
import ReportByFarmer from '../Component/Report/ReportByFarmer';
import ReportByFamilyGroup from '../Component/Report/ReportByFamilyGroup';

interface SideBarPagenableProps {
    className?: string;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}


const HomePage = () => {
    const { logout } = useAuth();
    const { hasPermission } = useAuthorization();

    const pageSize = 9;
    const [viewType, setViewType] = useState<string | null>("familyGroup");
    const [canViewUsers, setCanViewUsers] = useState<boolean>(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [show, setShow] = useState(false);
    const [menuContext, setMenuContext] = useState<"default" | "reports" | "reportType" | "reportDetailUser">("default");
    const [reportType, setReportType] = useState<"byBranch" | "byTechnician" | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<BranchType | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [totalItems, setTotalItems] = useState<number | null>(null);

    const {
        data: branchs,
        currentPage: branchPage,
        totalPages: branchTotalPages,
        totalItems: branchTotalItems,
        isLoading: branchLoading,
        fetchPage: fetchBranchs,
        setPageSize: setBranchPageSize,
    } = usePaginatedFetchData<BranchType>("/branch", pageSize);

    const {
        data: users,
        currentPage: userPage,
        totalPages: userTotalPages,
        totalItems: userTotalItems,
        isLoading: userLoading,
        fetchPage: fetchUsers,
        setPageSize: setUserPageSize,
    } = usePaginatedFetchData<UserType>("/user", pageSize);

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

    const SideBarPagenable = ({ currentPage, totalPages, onPageChange }: SideBarPagenableProps) => {
        return (
            <div className="d-flex justify-content-center align-items-center pageable">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <FaChevronLeft />
                </button>
                <div className="current_page">{currentPage} / {totalPages}</div>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <FaChevronRight />
                </button>
            </div>
        );
    };

    return (
        <div className="row g-0">
            <div className="col-2">
                <div className="sidebar d-flex flex-column">
                    <div className="logo_box">
                        <img src={logo} alt="Logo" className="logo" />
                    </div>
                    {menuContext !== "default" && (
                        <div className="back_header d-flex flex-column gap-3 ms-2">
                            <div className="d-flex justify-content-start align-items-center fw-bold">
                                {menuContext === "reports" && (
                                    <span className="d-flex align-items-center gap-2 report-title">
                                        <>
                                            <FaChartColumn />Relatórios
                                        </>

                                    </span>
                                )}
                                {(menuContext === "reportType" || menuContext === "reportDetailUser") && (
                                    <>
                                        <span className="d-flex align-items-center gap-2 report-title">
                                            {reportType === "byBranch" && (
                                                <>
                                                    <FaWallet /> <span>Por carteira</span>
                                                </>
                                            )}
                                            {reportType === "byTechnician" && (
                                                <>
                                                    <FaUser />Por técnico
                                                </>
                                            )}
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="d-flex align-items-center justify-content-between">
                                <button className="back_button" onClick={() => {
                                    setTotalItems(null);
                                    setSelectedBranch(null);
                                    setSelectedUser(null);
                                    setViewType(null);

                                    setMenuContext(prev =>
                                        prev === "reportDetailUser" ? "reportType" :
                                            prev === "reportType" ? "reports" :
                                                "default"
                                    );
                                }}>
                                    <FaChevronLeft /> <span>Voltar</span>
                                </button>

                                {menuContext === "reportType" && (
                                    <SideBarPagenable
                                        currentPage={reportType === "byBranch" ? branchPage : userPage}
                                        totalPages={reportType === "byBranch" ? branchTotalPages : userTotalPages}
                                        onPageChange={(page) =>
                                            reportType === "byBranch"
                                                ? fetchBranchs(page)
                                                : fetchUsers(page)
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    <ul className="sidebar_menu flex-grow-1">
                        {menuContext === "default" && (
                            <>
                                <li
                                    onClick={() => setViewType("familyGroup")}
                                    className={
                                        "d-flex align-items-center gap-2" +
                                        (viewType === "familyGroup" ? " active" : "")
                                    }
                                >
                                    <FaUserGroup />Grupo Familiar
                                </li>
                                <li
                                    onClick={() => setViewType("farmer")}
                                    className={
                                        "d-flex align-items-center gap-2" +
                                        (viewType === "farmer" ? " active" : "")
                                    }
                                >
                                    <FaWheatAwn />Produtores
                                </li>
                                {canViewUsers && (
                                    <>
                                        <li
                                            onClick={() => setViewType("user")}
                                            className={
                                                "d-flex align-items-center gap-2" +
                                                (viewType === "user" ? " active" : "")
                                            }
                                        >
                                            <FaUser />Usuários
                                        </li>
                                        <li
                                            onClick={() => setViewType("branch")}
                                            className={
                                                "d-flex align-items-center gap-2" +
                                                (viewType === "branch" ? " active" : "")
                                            }
                                        >
                                            <FaWallet />Carteiras
                                        </li>
                                        <li
                                            // onClick={() => setViewType("report")}
                                            onClick={() => setMenuContext("reports")}
                                            className={
                                                "d-flex align-items-center gap-2"
                                            }
                                        >
                                            <FaChartColumn />Relatórios <span className="ms-auto"><FaChevronRight /></span>
                                        </li>
                                        <li
                                            onClick={() => setShow(true)}
                                            className="d-flex align-items-center gap-2"
                                        >
                                            <FaUpload />Enviar Dados
                                        </li>
                                    </>
                                )}
                            </>
                        )}

                        {menuContext === "reports" && (
                            <>
                                <li
                                    onClick={() => {
                                        setReportType("byBranch");
                                        setMenuContext("reportType");
                                        fetchBranchs(1);
                                    }}
                                    className="d-flex align-items-center gap-2"
                                >
                                    <FaWallet /> Por Carteira
                                </li>
                                <li
                                    onClick={() => {
                                        setReportType("byTechnician");
                                        setMenuContext("reportType");
                                        fetchUsers(1);
                                    }}
                                    className="d-flex align-items-center gap-2"
                                >
                                    <FaUser /> Por Técnico
                                </li>
                            </>
                        )}

                        {menuContext === "reportType" && reportType === "byBranch" && branchs && (
                            <>
                                {branchs.map((branch) => (
                                    <li
                                        key={branch.id}
                                        onClick={() => {
                                            setSelectedBranch(branch);
                                            setViewType("report_by_branch");
                                        }}
                                        className={
                                            "d-flex align-items-center gap-2" +
                                            (selectedBranch?.id === branch.id ? " active" : "")
                                        }
                                    >
                                        {branch.name}
                                    </li>
                                ))}

                            </>
                        )}

                        {menuContext === "reportType" && reportType === "byTechnician" && users && (
                            <>
                                {users.map((user) => (
                                    <li
                                        key={user.id}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setMenuContext("reportDetailUser");
                                        }}
                                        className={
                                            "d-flex align-items-center gap-2" +
                                            (selectedUser?.id === user.id ? " active" : "")
                                        }
                                    >
                                        {user.name}
                                    </li>
                                ))}

                            </>
                        )}

                        {menuContext === "reportDetailUser" && reportType === "byTechnician" && (
                            <>
                                <li
                                    onClick={() => {
                                        setViewType("report_by_technician_farmer");
                                    }}
                                    className={
                                        "d-flex align-items-center gap-2" +
                                        (viewType === "report_by_technician_farmer" ? " active" : "")
                                    }
                                >
                                    <FaWheatAwn /> Por produtor
                                </li>
                                <li
                                    onClick={() => {
                                        setViewType("report_by_technician_familyGroup");
                                    }}
                                    className={
                                        "d-flex align-items-center gap-2" +
                                        (viewType === "report_by_technician_familyGroup" ? " active" : "")
                                    }
                                >

                                    <FaUserGroup /> Por grupo familiar
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
            </div>

            <div className="col">
                {selectedUser && (
                    <div className="d-flex justify-content-between report-header">
                        <h4 className="fw-bold m-0 p-0">Técnico: {selectedUser.name}</h4>
                        {totalItems && (
                            <h4 className="fw-bold m-0 p-0">Total de itens: {totalItems}</h4>
                        )}
                    </div>
                )}
                {selectedBranch && (
                    <div className="d-flex justify-content-between report-header">
                        <h4 className="fw-bold m-0 p-0">Carteira: {selectedBranch.name}</h4>
                        {totalItems && (
                            <h4 className="fw-bold m-0 p-0">Total de itens: {totalItems}</h4>
                        )}
                    </div>
                )}
                <div className="content">

                    {!viewType && (<></>)}
                    {viewType === "familyGroup" && <FamilyGroup />}
                    {viewType === "farmer" && <Farmer />}
                    {canViewUsers && (
                        <>
                            {viewType === "user" && <User />}
                            {viewType === "branch" && <Branch />}
                            {viewType === "report_by_branch" && selectedBranch && (
                                <ReportByFarmer branch={selectedBranch} setTotalItems={setTotalItems} />
                            )}
                            {viewType === "report_by_technician_farmer" && selectedUser && (
                                <ReportByFarmer technician={selectedUser} setTotalItems={setTotalItems} />
                            )}
                            {viewType === "report_by_technician_familyGroup" && selectedUser && (
                                <ReportByFamilyGroup technician={selectedUser} setTotalItems={setTotalItems} />
                            )}
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
        </div >
    );
};

export default HomePage;
