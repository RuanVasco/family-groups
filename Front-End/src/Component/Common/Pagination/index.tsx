import { ReactNode } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import "./style.scss";

interface PaginationProps {
    children: ReactNode;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;

    currentPage: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;

    showTopControls?: boolean;
}

const Pagination = ({
    children,
    itemsPerPage,
    onItemsPerPageChange,
    currentPage,
    totalPages,
    onPageChange,
    showTopControls = true,
}: PaginationProps) => {
    const handlePrev = () => onPageChange(currentPage - 1);
    const handleNext = () => onPageChange(currentPage + 1);

    const Controls = () => (
        <div className="pagination__controls">
            <div className="pagination__per-page">
                <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                >
                    {[5, 10, 50, 500, 1000].map((v) => (
                        <option key={v} value={v}>
                            {v.toLocaleString("pt-BR")}
                        </option>
                    ))}
                </select>
            </div>

            <div className="pagination__nav">
                <button onClick={handlePrev} disabled={currentPage <= 1}>
                    <FaChevronLeft />
                </button>

                <span>
                    {currentPage} / {totalPages || 1}
                </span>

                <button onClick={handleNext} disabled={currentPage >= totalPages}>
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );

    return (
        <div className="pagination">
            {showTopControls && <Controls />}
            {children}
            <Controls />
        </div>
    );
};

export default Pagination;
