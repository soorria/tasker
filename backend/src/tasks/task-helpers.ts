import { isConnected } from "../connection";
import { TaskAssignment } from "../entity/TaskAssignment";
import { User } from "../entity/User";
import { getConnection } from "typeorm";

export async function validAssignees(
  editor: string,
  assignees: string[]
): Promise<boolean> {
  for (const assignee of assignees) {
    if (
      (await isConnected(editor, assignee)) !== "connected" &&
      editor !== assignee
    )
      return false;
  }
  return true;
}

export async function deleteAssignment(id: string): Promise<void> {
  const assignment_repo = getConnection().getRepository(TaskAssignment);
  await assignment_repo.delete(id);
}

export async function userIdExists(id: string): Promise<boolean> {
  const user_repo = getConnection().getRepository(User);
  const ids = await user_repo.findOne(id);
  if (ids !== undefined) return true;
  return false;
}

// delete assignment by task id and user id
export async function deleteAssignmentByTaskAndUserId(
  id: string,
  user_id: string
): Promise<void> {
  const assignment_repo = getConnection().getRepository(TaskAssignment);
  await assignment_repo.delete({ task: id, user_assignee: user_id });
}
