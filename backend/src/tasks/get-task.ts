import { getConnection } from "typeorm";
import { TaskAssignment } from "../entity/TaskAssignment";
import { isConnected } from "../connection";
import { Task } from "../entity/Task";
import { ApiError } from "../errors";

/** function to get a task by id, if user is connected to an assignee */
export async function getTask(user_id: string, task_id: string): Promise<Task> {
  if (!user_id)
    throw new ApiError(
      "getTask/invalid_user_id",
      "user_id provided is null/undefined or empty string"
    );

  if (!task_id)
    throw new ApiError(
      "getTask/invalid_task_id",
      "task_id provided is null/undefined or empty string"
    );

  // get task assignments
  const task_assignments = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;

  if (task_assignments.length === 0)
    throw new ApiError("getTask/task_id_nonexistent", "task does not exist");

  // if user is not connected to an assignee of the task
  if (
    user_id !== task_assignments[0].task.creator.id &&
    !(await connectedToAnAssignee(user_id, task_assignments))
  ) {
    throw new ApiError(
      "getTask/no_perm",
      "You are unauthorised, must be connected to an assignee of the task"
    );
  }

  const task = task_assignments.map((a: any) => a.task)[0];

  task.assignees = [];
  for (const assignment of task_assignments) {
    task.assignees.push(assignment.user_assignee);
  }

  return task;
}

async function connectedToAnAssignee(
  user_id: string,
  assignments: TaskAssignment[]
): Promise<boolean> {
  for (const assignment of assignments as any) {
    if (
      (await isConnected(user_id, assignment.user_assignee.id)) === "connected"
    )
      return true;
  }
  return false;
}
