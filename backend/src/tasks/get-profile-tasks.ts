import { getConnection, In } from "typeorm";
import { TaskAssignment } from "../entity/TaskAssignment";
import { isConnected } from "../connection";
import { Task } from "../entity/Task";
import { ApiError } from "../errors";

/** function to get tasks a connected user is assigned, sorted by closer deadline */
export async function getProfileTasks(
  user_id: string,
  profile_user_id: string
): Promise<Task[]> {
  if (!user_id)
    throw new ApiError(
      "getProfileTasks/invalid_user_id",
      "user id provided is null/undefined or empty string"
    );

  if (!profile_user_id)
    throw new ApiError(
      "getProfileTasks/invalid_profile_user_id",
      "profile id provided is null/undefined or empty string"
    );

  // if users are not connected, throw error
  if (
    user_id !== profile_user_id &&
    !((await isConnected(user_id, profile_user_id)) === "connected")
  ) {
    throw new ApiError(
      "getProfileTasks/no_perm",
      "You are unauthorised, as you aren't connected to this user"
    );
  }

  const assignments_obj = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { user_assignee: profile_user_id } })) as any;

  if (assignments_obj.length === 0) return [];

  const task_ids = assignments_obj.map(
    (a: { task: { id: any } }) => a.task.id
  ) as string[];

  // get task assignments
  const task_assignments = await getConnection()
    .getRepository(TaskAssignment)
    .find({ task: In(task_ids) });

  task_assignments.forEach((asst) => {
    delete (asst as any).user_assignee.password_hash;
  });

  const tasks = assignments_obj.map((a: { task: any }) => a.task) as any;

  for (const task of tasks) {
    task.assignees = [];
    for (const assignment of task_assignments as any) {
      if (task.id === assignment.task.id) {
        task.assignees.push(assignment.user_assignee);
      }
    }
  }

  tasks.map((task: any) => {
    delete task.creator.password_hash;
  });

  // sort by deadline, closer deadlines first
  tasks.sort(function compare(a: Task, b: Task) {
    if (a.deadline.getTime() === b.deadline.getTime())
      return a.title.localeCompare(b.title);
    else return a.deadline.getTime() - b.deadline.getTime();
  });

  return tasks;
}
