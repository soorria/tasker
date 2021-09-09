import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuthContext } from "../context/AuthContext";
import { ApiResponse, User } from "../types";
import { api } from "./utils";

export const login = async (
  email: string,
  password: string
): Promise<ApiResponse<{ token: string }>> => {
  const { data: response } = await api.post("/users/login", {
    email,
    password,
  });
  mutate("/users/me");
  return response;
};

export type SignupInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  bio?: string;
};

export const signup = async (
  args: SignupInput
): Promise<ApiResponse<{ token: string }>> => {
  if (!args.bio) {
    args.bio = "";
  }

  const { data: response } = await api.post("/users/signup", args);

  return response;
};

export const useMe = (runQuery: boolean) => {
  return useSWR<User | null>(runQuery ? "/users/me" : null);
};

export const useLogout = () => {
  const { setToken } = useAuthContext();
  return useCallback(() => {
    setToken(null);
    mutate("/users/me", null, false);
  }, [setToken]);
};
