import { FaChevronUp, FaChevronDown } from "react-icons/fa6";
import "./styles.scss";
import React from "react";

interface CustomTableProps {
    headers: string[];
    columnWidths?: (string | number | undefined)[];
    columnStyles?: (React.CSSProperties | undefined)[];
    headerStyles?: (React.CSSProperties | undefined)[];
    sortField?: string;
    sortDir?: "asc" | "desc";
    onSort?: (field: string) => void;
    children: React.ReactNode;
}

const CustomTable = ({
    headers,
    columnWidths = [],
    columnStyles = [],
    headerStyles = [],
    sortField,
    sortDir = "asc",
    onSort,
    children,
}: CustomTableProps) => {

    const decoratedBody = React.Children.map(
        children,
        (row): React.ReactNode => {
            if (!React.isValidElement<React.HTMLAttributes<HTMLTableRowElement>>(row))
                return row;

            const cells = React.Children.map(
                row.props.children,
                (cell, idx): React.ReactNode => {
                    if (
                        !React.isValidElement<React.HTMLAttributes<HTMLTableCellElement>>(
                            cell
                        )
                    )
                        return cell;

                    const extra = columnStyles[idx];
                    if (!extra) return cell;

                    return React.cloneElement<React.HTMLAttributes<HTMLTableCellElement>>(
                        cell,
                        {
                            style: { ...(cell.props.style ?? {}), ...extra },
                        }
                    );
                }
            );

            return React.cloneElement<
                React.HTMLAttributes<HTMLTableRowElement>
            >(row, {}, cells);
        }
    );

    return (
        <div className="custom_table_container">
            <table className="custom_table">
                <thead>
                    <tr>
                        {headers.map((header, i) => {
                            const isActive = sortField === header;
                            return (
                                <th
                                    key={header}
                                    style={{ width: columnWidths[i] ?? "auto", cursor: onSort ? "pointer" : "default", ...headerStyles[i], }}
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
                <tbody>{decoratedBody}</tbody>
            </table>
        </div>
    );
};

export default CustomTable;
