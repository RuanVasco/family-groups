import { FaBars } from "react-icons/fa6";
import "./styles.scss";

interface ButtonCollapseProps {
    collapsed: boolean;
    onToggle: () => void;
}

const ButtonCollapse = ({ onToggle }: ButtonCollapseProps) => {
    return (
        <button className="button_collapse" onClick={onToggle}>
            <FaBars />
        </button>
    );
}

export default ButtonCollapse;
