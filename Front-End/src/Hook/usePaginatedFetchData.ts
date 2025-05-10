import { useState } from "react";
import axiosInstance from "../axiosInstance";
import { toast } from "react-toastify";

interface PaginationResult<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  pageSize: number;
  fetchPage: (page: number, filters?: Record<string, any>) => void;
  setPageSize: (size: number) => void;
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

  const fetchPage = async (
    page: number,
    filters: Record<string, any> = initialFilters
  ) => {
    setIsLoading(true);

    try {
      const params = {
        page: page - 1,
        size: pageSize,
        ...filters,
      };

      const res = await axiosInstance.get(endpoint, { params });

      if (res.status === 200) {
        const { content, totalPages, totalElements } = res.data;
        setData(content);
        setCurrentPage(page);
        setTotalPages(totalPages);
        setTotalItems(totalElements);
      }
    } catch (error) {
      toast.error("Erro ao buscar dados paginados.");
    } finally {
      setIsLoading(false);
    }
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    fetchPage(1);
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
  };
}
