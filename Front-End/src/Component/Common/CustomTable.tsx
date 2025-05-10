import "./styles.scss";

interface CustomTableProps {
    headers: string[];
    columnWidths?: (string | number | undefined)[];
    children: React.ReactNode;
}

const CustomTable = ({ headers, columnWidths = [], children }: CustomTableProps) => (
    <table className="custom_table">
        <thead>
            <tr>
                {headers.map((header, index) => (
                    <th
                        key={header}
                        style={{ width: columnWidths[index] ?? 'auto' }}
                    >
                        {header}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>{children}</tbody>
    </table>
);

export default CustomTable;
