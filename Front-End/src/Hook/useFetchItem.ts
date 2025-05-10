import { toast } from "react-toastify";
import axiosInstance from "../axiosInstance";
import { useEffect, useState } from "react";

export function useFetchItem<T>(
  endpoint: string,
  params?: Record<string, string | number | null>,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!enabled || !endpoint) return;
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }

      const url = searchParams.toString()
        ? `${endpoint}?${searchParams.toString()}`
        : endpoint;

      const res = await axiosInstance.get(url);
      if (res.status === 200) {
        setData(res.data);
      }
    } catch (err) {
      const message = "Erro ao buscar item.";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint, JSON.stringify(params), enabled]);

  return { data, loading, error, refetch: fetchData };
}
