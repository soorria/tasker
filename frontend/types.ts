import { FC } from "react";
import moment from "moment";

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  bio?: string;
};

export type ProfileStats = {
  businessThisWeek: number;
  tasksThisWeek: number;
  businessLastWeek: number;
  tasksLastWeek: number;
};

export enum ConnectionStatus {
  UNCONNECTED = "unconnected",
  REQUESTED = "requested",
  CONNECTED = "connected",
}

export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: moment.Moment;
  status: TaskStatus;
  estimated_days: number;
  assignees: User[];
  creator: User;
};

export enum TaskStatus {
  TO_DO = "TO_DO",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
}

export type PropsOf<TComponent extends FC> = Parameters<TComponent>[0];

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<TData = any> =
  | { data: null; error: ApiError }
  | { data: TData; error: null };
