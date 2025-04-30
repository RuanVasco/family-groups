import { useEffect, useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useAuthorization } from '../Context/AuthorizationContext';
import Farmer from '../Component/Farmer';
import logo from '../assets/logo.png';
import FamilyGroup from '../Component/FamilyGroup';
import User from '../Component/User';
import "../assets/styles/_sidebar.scss";
import Branch from '../Component/Branch';

const HomePage = () => {
    const { logout } = useAuth();
    const { hasPermission } = useAuthorization();

    const [viewType, setViewType] = useState<string>("familyGroup");
    const [canViewUsers, setCanViewUsers] = useState<boolean>(false);

    useEffect(() => {
        const checkPermission = async () => {
            const allowed = await hasPermission("User");
            setCanViewUsers(allowed);
        };

        checkPermission();
    }, []);

    return (
        <div className="row">
            <div className="col-3 sidebar d-flex flex-column">
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
                    </>
                )}
            </div>
        </div>

    );
};

export default HomePage;
