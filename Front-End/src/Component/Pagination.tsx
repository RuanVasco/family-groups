import { ReactNode } from "react";

interface PaginationProps {
    children: ReactNode;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}

const Pagination = ({
    children,
    itemsPerPage,
    onItemsPerPageChange,
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) => {
    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <label>
                        Itens por página:{" "}
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="50">50</option>
                            <option value="500">500</option>
                            <option value="1000">1.000</option>
                        </select>
                    </label>
                </div>
                <div>
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </button>
                    <span className="mx-2">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Próxima
                    </button>
                </div>
            </div>

            {children}
        </div>
    );
};

export default Pagination;
