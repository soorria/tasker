import { useCallback } from "react";
import { mutate } from "swr";
import { User } from "../types";
import { api } from "./utils";

export const useSearchUserByEmail = () => {
  return useCallback(async (email: string): Promise<User | null> => {
    const { data: response } = await api.post("/users/by-email", { email });
    if ("data" in response) {
      const user = response.data;

      if (user) {
        mutate(`/profile/${user.id}`, user);
      }

      return user;
    }
    throw response.error;
  }, []);
};
