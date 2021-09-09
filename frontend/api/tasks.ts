import useSWR, { mutate } from "swr";
import { useAuthContext } from "../context/AuthContext";
import { ApiResponse, Task } from "../types";
import { useCallback, useEffect, useRef } from "react";
import { api, mkQueryString, swrFetcher } from "./utils";
import { debounce } from "../utils";

const debouncedMutate = debounce(mutate, 100);

export const useTasks = (filters: { [key: string]: any }) => {
  const queryString = mkQueryString(filters);
  const { user } = useAuthContext();
  const fetcherRef = useRef<() => Promise<Task[]>>(() =>
    swrFetcher(`/tasks?${queryString}`)
  );

  useEffect(() => {
    debouncedMutate("/tasks");
    fetcherRef.current = () => swrFetcher(`/tasks?${queryString}`);
  }, [queryString]);

  return useSWR<Task[]>(user ? `/tasks` : null, () => fetcherRef.current());
};

export const useUserTasks = (userId?: string) => {
  const { user } = useAuthContext();
  let key = null;

  if (user?.id && userId) {
    if (user.id === userId) {
      key = "/tasks";
    } else {
      key = `/users/tasks/${userId}`;
    }
  }

  return useSWR<Task[]>(key);
};

export const useCreateTask = () => {
  return useCallback(async (task: Task): Promise<ApiResponse> => {
    mutate(
      `/tasks`,
      (existingTasks: Task[] | null) =>
        existingTasks ? [...existingTasks, task] : [task],
      false
    );
    const { data } = await api.post("/task/create", task);
    mutate(`/tasks`);
    return data;
  }, []);
};

export const useEditTask = () => {
  return useCallback(
    async (
      taskId: string,
      taskUpdates: Partial<Task>
    ): Promise<ApiResponse> => {
      mutate(
        `/tasks`,
        (existingTasks: Task[]) =>
          existingTasks?.map((task) => {
            if (task.id === taskId) {
              return { ...task, taskUpdates };
            }
            return task;
          }),
        false
      );
      const { data } = await api.post(`/task/edit/${taskId}`, taskUpdates);
      mutate(`/tasks`);
      return data;
    },
    []
  );
};

export const useDeleteTask = () => {
  return useCallback(async (taskId: string): Promise<ApiResponse> => {
    mutate(
      `/tasks`,
      (existingTasks: Task[]) =>
        existingTasks.filter((task) => task.id !== taskId),
      false
    );
    const { data } = await api.delete(`/task/delete/${taskId}`);
    mutate(`/tasks`);
    return data;
  }, []);
};

export const useSaveToCalendar = () => {
  return useCallback(async (taskId: string): Promise<void> => {
    await api.post("/tasks/creategooglevent", { task_id: taskId });
  }, []);
};
