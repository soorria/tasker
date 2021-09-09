import axios from "axios";
import Router from "next/router";
import { mutate } from "swr";
import { LOCALSTORAGE_TOKEN_KEY } from "../context/AuthContext";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Automatically add jwt header to request
api.interceptors.request.use((request) => {
  if (!request.headers.jwt && typeof window !== "undefined") {
    try {
      request.headers.jwt = JSON.parse(
        localStorage.getItem(LOCALSTORAGE_TOKEN_KEY) ?? "null"
      );
    } catch (err) {
      localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
    }
  }
  return request;
});

export const swrFetcher = async (url: string) => {
  const response = await api.get(url);
  if (response.data.data) {
    return response.data.data;
  }

  if (response.data?.error.code === "auth/not_logged_in") {
    await mutate("/users/me");
    Router.push("/login");
  }

  throw response.data.error;
};

export const mkQueryString = (params: { [key: string]: any }) => {
  return Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    )
    .join("&");
};
