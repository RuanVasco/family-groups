import { useState } from "react";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";

interface PaginationResult<T> {
  /* dados / paginação */
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  pageSize: number;

  fetchPage: (page: number, filters?: Record<string, any>) => void;
  setPageSize: (size: number) => void;

  sortField?: string;
  sortDir?: "asc" | "desc";
  setSortField: (field?: string) => void;
  setSortDir: (dir: "asc" | "desc") => void;
}

export function usePaginatedFetchData<T>(
  endpoint: string,
  initialPageSize: number = 10,
  initialFilters: Record<string, any> = {}
): PaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>();
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchPage = async (
    page: number,
    extraFilters: Record<string, any> = {}
  ) => {
    setIsLoading(true);
    try {
      const params = {
        page: page - 1,
        size: extraFilters.size ?? pageSize,
        // sort: sortField ? `${sortField},${sortDir}` : undefined,
        ...initialFilters,
        ...extraFilters,
      };

      const { data } = await axiosInstance.get(endpoint, { params });
      const { content, totalPages, totalElements } = data;

      setData(content);
      setCurrentPage(page);
      setTotalPages(totalPages);
      setTotalItems(totalElements);
    } catch (err) {
      toast.error("Erro ao buscar dados paginados.");
    } finally {
      setIsLoading(false);
    }
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    fetchPage(1, { size });
  };

  return {
    data,
    currentPage,
    totalPages,
    totalItems,
    isLoading,
    pageSize,
    fetchPage,
    setPageSize,
    setSortField,
    setSortDir,
    sortField,
    sortDir,
  };
}
