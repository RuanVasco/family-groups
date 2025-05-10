import { FaSearch } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import "./styles.scss";

interface SelectOrAddBarProps {
    value: string;
    onSelectClick: () => void;
    onCreateClick: () => void;
}

const SelectOrAddBar = ({ value, onSelectClick, onCreateClick }: SelectOrAddBarProps) => {
    return (
        <div className="select-or-add-bar">
            <input
                type="text"
                readOnly
                className="input_readonly"
                value={value || "Selecione um grupo familiar"}
            />
            <button
                type="button"
                className="btn_select_openmodal"
                onClick={onSelectClick}
            >
                <FaSearch /> Selecionar
            </button>
            <button
                type="button"
                className="btn_create"
                onClick={onCreateClick}
            >
                <FaPlus /> Criar
            </button>
        </div>
    );
};

export default SelectOrAddBar;
