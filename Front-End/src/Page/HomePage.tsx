import { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useAuthorization } from '../Context/AuthorizationContext';
import Farmer from '../Component/Farmer';
import logo from '../assets/logo.png';
import FamilyGroup from '../Component/CRUD/FamilyGroup';
import User from '../Component/CRUD/User';
import "../assets/styles/_sidebar.scss";
import Branch from '../Component/Branch';
import { Button, Form, Modal } from 'react-bootstrap';
import { FaArrowRightFromBracket, FaChartColumn, FaChevronLeft, FaChevronRight, FaTable, FaUpload, FaUser, FaUserGroup, FaWallet, FaWheatAwn } from 'react-icons/fa6';
import { toast } from 'react-toastify';
import axiosInstance from '../axiosInstance';
import { BranchType } from '../Type/BranchType';
import { usePaginatedFetchData } from '../Hook/usePaginatedFetchData';
import { UserType } from '../Type/UserType';
import ReportByFarmer from '../Component/Report/ReportByFarmer';
import ReportByFamilyGroup from '../Component/Report/ReportByFamilyGroup';
import ButtonCollapse from '../Component/Common/Buttons/ButtonColapse';
import Dashboard from '../Component/Dashboard';

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
    const [collapsed, setCollapsed] = useState(false);
    const [fileLoading, setFileLoading] = useState<boolean>(false);

    const {
        data: branchs,
        currentPage: branchPage,
        totalPages: branchTotalPages,
        fetchPage: fetchBranchs,
    } = usePaginatedFetchData<BranchType>("/branch", pageSize);

    const {
        data: users,
        currentPage: userPage,
        totalPages: userTotalPages,
        fetchPage: fetchUsers,
    } = usePaginatedFetchData<UserType>("/user", pageSize, { "sort": "name" });

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
            setFileLoading(true)
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
            setFileLoading(false);
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
        <div className="layout d-flex">
            <aside className={`${collapsed ? "sidebar collapsed" : "sidebar"} d-flex flex-column`}>
                <div className="logo_box">
                    <ButtonCollapse collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
                    {!collapsed && (
                        <img src={logo} alt="Logo" className="logo" />
                    )}
                </div>
                {menuContext !== "default" && (
                    <div className="back_header d-flex flex-column gap-3 ms-2">
                        <div className="d-flex justify-content-start align-items-center fw-bold">
                            {menuContext === "reports" && (
                                <span className="d-flex align-items-center gap-2 report-title">
                                    <>
                                        <FaTable />
                                        {!collapsed && "Relatórios"}
                                    </>

                                </span>
                            )}
                            {(menuContext === "reportType" || menuContext === "reportDetailUser") && (
                                <>
                                    <span className="d-flex align-items-center gap-2 report-title">
                                        {reportType === "byBranch" && (
                                            <>
                                                <FaWallet />
                                                {!collapsed && <span>Por carteira</span>}
                                            </>
                                        )}
                                        {reportType === "byTechnician" && (
                                            <>
                                                <FaUser />
                                                {!collapsed && <span>Por técnico</span>}

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
                                <FaChevronLeft />
                                {!collapsed && <span>Voltar</span>}
                            </button>

                            {menuContext === "reportType" && !collapsed && (
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
                <ul>
                    {menuContext === "default" && (
                        <>
                            <li
                                onClick={() => setViewType("familyGroup")}
                                className={
                                    "d-flex align-items-center gap-2" +
                                    (viewType === "familyGroup" ? " active" : "")
                                }
                            >
                                <FaUserGroup />
                                {!collapsed && "Grupo Familiar"}
                            </li>
                            <li
                                onClick={() => setViewType("farmer")}
                                className={
                                    "d-flex align-items-center gap-2" +
                                    (viewType === "farmer" ? " active" : "")
                                }
                            >
                                <FaWheatAwn />
                                {!collapsed && "Produtores"}
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
                                        <FaUser />
                                        {!collapsed && "Usuários"}
                                    </li>
                                    <li
                                        onClick={() => setViewType("branch")}
                                        className={
                                            "d-flex align-items-center gap-2" +
                                            (viewType === "branch" ? " active" : "")
                                        }
                                    >
                                        <FaWallet />
                                        {!collapsed && "Carteiras"}
                                    </li>
                                    <li
                                        onClick={() => {
                                            setViewType(null);
                                            setMenuContext("reports");
                                        }}
                                        className={
                                            "d-flex align-items-center gap-2"
                                        }
                                    >
                                        <FaTable />
                                        {!collapsed && (
                                            <>Relatórios <span className="ms-auto"><FaChevronRight /></span></>
                                        )}
                                    </li>
                                    <li
                                        onClick={() => {
                                            setViewType("dashboard");
                                        }}
                                        className={
                                            "d-flex align-items-center gap-2" +
                                            (viewType === "dashboard" ? " active" : "")
                                        }
                                    >
                                        <FaChartColumn />
                                        {!collapsed && (
                                            <>Gerencial</>
                                        )}
                                    </li>
                                    <li
                                        onClick={() => setShow(true)}
                                        className="d-flex align-items-center gap-2"
                                    >
                                        <FaUpload />
                                        {!collapsed && "Enviar Dados"}
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
                                    setCollapsed(false);
                                }}
                                className="d-flex align-items-center gap-2"
                            >
                                <FaWallet />
                                {!collapsed && "Por Carteira"}
                            </li>
                            <li
                                onClick={() => {
                                    setReportType("byTechnician");
                                    setMenuContext("reportType");
                                    fetchUsers(1);
                                    setCollapsed(false);
                                }}
                                className="d-flex align-items-center gap-2"
                            >
                                <FaUser />
                                {!collapsed && "Por Técnico"}
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
                            {userPage === 1 && (
                                <li
                                    onClick={() => {
                                        setSelectedUser(null);
                                        setMenuContext("reportDetailUser");
                                    }}
                                    className={
                                        "d-flex align-items-center gap-2" +
                                        (selectedUser === null ? " active" : "")
                                    }
                                >
                                    Sem Técnico Vinculado
                                </li>
                            )}
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
                                <FaWheatAwn />
                                {!collapsed && "Por produtor"}
                            </li>
                            {selectedUser && (
                                <li
                                    onClick={() => {
                                        setViewType("report_by_technician_familyGroup");
                                    }}
                                    className={
                                        "d-flex align-items-center gap-2" +
                                        (viewType === "report_by_technician_familyGroup" ? " active" : "")
                                    }
                                >
                                    <FaUserGroup />
                                    {!collapsed && "Por grupo familiar"}

                                </li>
                            )}

                        </>
                    )}
                </ul>

                <div className="logout_box mt-auto">
                    <button className="btn_logout w-100 d-flex gap-2 align-items-center justify-content-center" onClick={logout}>
                        <FaArrowRightFromBracket />
                        {!collapsed && "Sair"}
                    </button>
                </div>
            </aside>

            <main className="content flex-grow-1">
                {(viewType === "report_by_technician_farmer" ||
                    viewType === "report_by_technician_familyGroup" ||
                    selectedUser) && (
                        <div className="d-flex justify-content-between report-header">
                            <h4 className="fw-bold m-0 p-0">
                                Técnico:&nbsp;
                                {selectedUser ? selectedUser.name : "Sem técnico vinculado"}
                            </h4>

                            {totalItems != null && (
                                <h4 className="fw-bold m-0 p-0">
                                    Total de itens:&nbsp;{totalItems}
                                </h4>
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
                    {viewType === "dashboard" && <Dashboard />}
                    {canViewUsers && (
                        <>
                            {viewType === "user" && <User />}
                            {viewType === "branch" && <Branch />}
                            {viewType === "report_by_branch" && selectedBranch && (
                                <ReportByFarmer branch={selectedBranch} setTotalItems={setTotalItems} />
                            )}
                            {viewType === "report_by_technician_farmer" && (
                                <ReportByFarmer
                                    technician={selectedUser ?? undefined}
                                    setTotalItems={setTotalItems}
                                />
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
                            {fileLoading ? (
                                <div className="d-flex justify-content-center align-items-center py-5" style={{ height: 100 }}>
                                    <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                                </div>
                            ) : (
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
                            )}

                        </Form>
                    </Modal.Body>
                    {!fileLoading && (
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShow(false)}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleUpload}>
                                Enviar
                            </Button>
                        </Modal.Footer>
                    )}
                </Modal>
            </main>
        </div >
    );
};

export default HomePage;
