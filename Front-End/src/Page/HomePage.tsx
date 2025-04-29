import { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import Farmer from '../Component/Farmer';
import logo from '../assets/logo.png';
import FamilyGroup from '../Component/FamilyGroup';

const HomePage = () => {
    const { logout } = useAuth();

    const [viewType, setViewType] = useState<string>("familyGroup");

    return (
        <div className="d-flex">
            <div className="sidebar d-flex flex-column">
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
                </ul>

                <div className="logout_box mt-auto">
                    <button className="btn_logout w-100" onClick={logout}>
                        Sair
                    </button>
                </div>
            </div>

            <div className="content p-4">
                {viewType === "familyGroup" && <FamilyGroup />}
                {viewType === "farmer" && <Farmer />}
            </div>
        </div>

    );
};

export default HomePage;
