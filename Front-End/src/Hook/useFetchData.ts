import { useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../axiosInstance";

export const useFetchData = <T>() => {
  const [data, setData] = useState<T | null>(null);

  const fetch = async (url: string, errorMessage: string) => {
    try {
      const res = await axiosInstance.get(url);
      if (res.status === 200) {
        setData(res.data);
      }
    } catch (error) {
      toast.error(errorMessage);
    }
  };

  return { data, fetch };
};
