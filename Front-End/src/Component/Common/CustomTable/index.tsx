import { FaChevronUp, FaChevronDown } from "react-icons/fa6";
import "./styles.scss";

interface CustomTableProps {
    headers: string[];
    columnWidths?: (string | number | undefined)[];
    sortField?: string;
    sortDir?: "asc" | "desc";
    onSort?: (field: string) => void;
    children: React.ReactNode;
}

const CustomTable = ({
    headers,
    columnWidths = [],
    sortField,
    sortDir = "asc",
    onSort,
    children,
}: CustomTableProps) => (
    <div className="custom_table_container">
        <table className="custom_table">
            <thead>
                <tr>
                    {headers.map((header, i) => {
                        const isActive = sortField === header;
                        return (
                            <th
                                key={header}
                                style={{ width: columnWidths[i] ?? "auto", cursor: onSort ? "pointer" : "default" }}
                                onClick={() => onSort?.(header)}
                                className={isActive ? "sorted" : ""}
                            >
                                {header}
                                {isActive &&
                                    (sortDir === "asc" ? (
                                        <FaChevronUp className="ms-1" />
                                    ) : (
                                        <FaChevronDown className="ms-1" />
                                    ))}
                            </th>
                        );
                    })}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    </div>
);

export default CustomTable;
