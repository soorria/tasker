import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { ConnectionStatus, User } from "../types";
import { useAuthContext } from "../context/AuthContext";
import { api } from "./utils";

const filterConnections = (userId: string) => (connections: User[]) =>
  connections.filter((u) => u.id !== userId);

export const useRequestConnection = () => {
  return useCallback(async (userId: string) => {
    mutate(`/connection/status/${userId}`, ConnectionStatus.REQUESTED, false);
    await api.post("/connection/create", { id: userId });
    mutate(`/connection/status/${userId}`);
    mutate("/connection/outgoingRequests");
  }, []);
};

export const useDeleteConnection = () => {
  return useCallback(async (userId: string) => {
    mutate(`/connection/status/${userId}`, ConnectionStatus.UNCONNECTED, false);
    mutate("/connection/incomingRequests", filterConnections(userId), false);
    mutate("/connection/outgoingRequests", filterConnections(userId), false);
    await api.post("/connection/delete", { id: userId });
    mutate(`/connection/status/${userId}`);
    mutate("/connection/incomingRequests");
    mutate("/connection/outgoingRequests");
    mutateAccepted();
  }, []);
};

export const useAcceptConnection = () => {
  return useCallback(async (userId: string) => {
    mutate(`/connection/status/${userId}`, ConnectionStatus.CONNECTED, false);
    mutate("/connection/incomingRequests", filterConnections(userId), false);
    await api.post("/connection/accept", { id: userId });
    mutate(`/connection/status/${userId}`);
    mutate("/connection/incomingRequests");
    mutateAccepted();
  }, []);
};

export const useDeclineConnection = () => {
  return useCallback(async (userId: string) => {
    mutate(`/connection/status/${userId}`, ConnectionStatus.UNCONNECTED, false);
    mutate("/connection/incomingRequests", filterConnections(userId), false);
    await api.post("/connection/decline", { id: userId });
    mutate(`/connection/status/${userId}`);
    mutate("/connection/incomingRequests");
    mutateAccepted();
  }, []);
};

export const useConnectionStatus = (userId: string) => {
  const { user } = useAuthContext();
  return useSWR<ConnectionStatus>(user ? `/connection/status/${userId}` : null);
};

export const useIncomingConnectionRequests = () => {
  const { user } = useAuthContext();
  return useSWR<User[]>(user ? `/connection/incomingRequests` : null);
};

export const useOutgoingConnectionRequests = () => {
  const { user } = useAuthContext();
  return useSWR<User[]>(user ? `/connection/outgoingRequests` : null);
};

const mutateAccepted = () => mutate("/connection/acceptedConnections");

export const useConnectedUsers = () => {
  const { user } = useAuthContext();
  return useSWR<User[]>(user ? `/connection/acceptedConnections` : null);
};
