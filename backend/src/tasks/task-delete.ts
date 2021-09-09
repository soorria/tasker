import { getConnection } from "typeorm";
import { TaskAssignment } from "../entity/TaskAssignment";
import { Task } from "../entity/Task";
import { deleteAssignment } from "./task-helpers";
import { ApiError } from "../errors";
import { deleteTaskFromCalendar } from "../googleOAuth/delete-event";

export async function deleteTask(
  deletor_id: string,
  task_id: string
): Promise<void> {
  const task_assign_repo = getConnection().getRepository(TaskAssignment);
  const to_remove_assigns = (await task_assign_repo.find({
    where: { task: task_id },
  })) as any;
  if (to_remove_assigns.length == 0)
    throw new ApiError(
      "deleteTask/invalid_task_id",
      "task with this id does not exist"
    );
  if (to_remove_assigns[0].task.creator.id !== deletor_id) {
    throw new ApiError(
      "deleteTask/invalid_delete",
      "deletor_id must match task creator's id to delete"
    );
  }

  await deleteTaskFromCalendar(task_id);

  // delete TaskAssignments
  for (const assign of to_remove_assigns) {
    await deleteAssignment(assign.id);
  }
  // delete Task
  const task_repo = getConnection().getRepository(Task);
  await task_repo.delete({ id: task_id });
}
