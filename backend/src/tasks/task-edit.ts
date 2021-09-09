import { getConnection } from "typeorm";
import { TaskAssignment } from "../entity/TaskAssignment";
import { v4 as uuidv4 } from "uuid";
import {
  validAssignees,
  deleteAssignmentByTaskAndUserId,
} from "./task-helpers";
import { Task, Status } from "../entity/Task";
import { ApiError } from "../errors";
import { saveTaskToCalendar } from "../googleOAuth/calendar-create-event";

/** function to edit task in database, only creator of the task can edit */
export async function editTask(
  task_id: string,
  editor: string,
  title?: string | null,
  deadline?: Date | null,
  status?: Status | null,
  add_assignees?: string[] | null,
  remove_assignees?: string[] | null,
  description?: string | null,
  estimated_days?: number | null
): Promise<void> {
  // check values are not empty strings, null/undefined etc.
  if (!task_id)
    throw new ApiError(
      "editTask/invalid_task_id",
      "task_id is null/undefined or empty string"
    );

  if (!editor)
    throw new ApiError(
      "editTask/invalid_editor",
      "editor id is null/undefined or empty string"
    );

  // check at least one of the other params are defined
  if (
    !(
      (title && title.trim().length > 0) ||
      deadline ||
      status ||
      (description !== undefined && description !== null) ||
      (estimated_days !== undefined && estimated_days !== null) ||
      (add_assignees && add_assignees.length > 0) ||
      (remove_assignees && remove_assignees.length > 0)
    )
  ) {
    // && group
    throw new ApiError(
      "editTask/bad_params",
      "ensure at least one editable field is defined or not empty"
    );
  }

  // check valid status
  if (status && !Object.values(Status).includes(status)) {
    throw new ApiError(
      "editTask/invalid_status",
      'Status enum is {NOT_STARTED = "TO_DO", IN_PROGRESS = "IN_PROGRESS", BLOCKED = "BLOCKED", COMPLETED = "DONE"}'
    );
  }

  if (deadline && !(deadline instanceof Date))
    throw new ApiError(
      "editTask/invalid_deadline",
      "deadline provided is not a Date"
    );

  // ensure deadline in the future
  if (deadline && deadline.getTime() <= Date.now())
    throw new ApiError(
      "editTask/invalid_deadline",
      "deadline must be in the future"
    );

  // ensure estimated_days is positive
  if (
    estimated_days !== null &&
    estimated_days !== undefined &&
    estimated_days < 0
  ) {
    throw new ApiError(
      "editTask/invalid_estimated_days",
      "estimated_days must be >= 0"
    );
  }

  // get task
  const tasks = await getConnection()
    .getRepository(Task)
    .find({
      where: { id: task_id },
      relations: ["creator"],
      loadRelationIds: true,
    });

  if (tasks.length === 0)
    throw new ApiError("editTask/task_id_nonexistent", "task does not exist");

  if (tasks.length > 1)
    throw new ApiError(
      "editTask/duplicate_task_ids",
      "there are duplicate task ids in db, oh no this is bad"
    );

  // check editor is creator of task
  if (tasks[0].creator !== editor) {
    throw new ApiError(
      "editTask/no_perm",
      "this user cannot edit this task, only it's creator can"
    );
  }

  if (title) tasks[0].title = title;
  if (deadline) tasks[0].deadline = deadline;
  if (status) tasks[0].status = status;
  if (description) tasks[0].description = description;
  if (estimated_days) tasks[0].estimated_days = estimated_days;

  // no assignee changes
  if (
    (!add_assignees && !remove_assignees) ||
    (add_assignees &&
      add_assignees.length === 0 &&
      remove_assignees &&
      remove_assignees.length === 0)
  ) {
    await getConnection().manager.save(tasks[0]);
    await saveTaskToCalendar(task_id);
    return;
  }

  // check editor is connected to assignees for add assignees
  if (add_assignees && !(await validAssignees(editor, add_assignees)))
    throw new ApiError(
      "editTask/invalid_add_assignees",
      "add_assignees must be connected to editor or in same group"
    );

  const assignments = await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id }, loadRelationIds: true });
  const current_assignees = assignments.map((a) => a.user_assignee);

  if (
    remove_assignees &&
    !usersAreAssigned(remove_assignees, current_assignees)
  )
    throw new ApiError(
      "editTask/invalid_remove_assignees",
      "remove_assignees contains id of a user that is not currently assigned to the task"
    );

  await getConnection().manager.save(tasks[0]);
  await updateAssignments(
    add_assignees,
    remove_assignees,
    task_id,
    current_assignees
  );

  // if no assignee assign to creator
  const assignees = getNewAssignees(
    current_assignees,
    add_assignees,
    remove_assignees
  );
  // if assignees [], implicit assign task to creator/editor
  if (assignees.length === 0) {
    const new_assignment = new TaskAssignment();
    new_assignment.id = uuidv4();
    new_assignment.task = task_id;
    new_assignment.user_assignee = editor;
    await getConnection().getRepository(TaskAssignment).save(new_assignment);
  }
  await saveTaskToCalendar(task_id);

  return;
}

async function updateAssignments(
  add_assignees: string[],
  remove_assignees: string[],
  task_id: string,
  current_assignees: string[]
): Promise<void> {
  if (add_assignees) {
    for (const new_assignee of add_assignees) {
      if (!current_assignees.includes(new_assignee)) {
        const new_assignment = new TaskAssignment();
        new_assignment.id = uuidv4();
        new_assignment.task = task_id;
        new_assignment.user_assignee = new_assignee;
        await getConnection()
          .getRepository(TaskAssignment)
          .save(new_assignment);
      }
    }
  }
  if (remove_assignees) {
    for (const remove_assignee of remove_assignees) {
      if (current_assignees.includes(remove_assignee)) {
        await deleteAssignmentByTaskAndUserId(task_id, remove_assignee);
      }
    }
  }
  return;
}

function usersAreAssigned(
  remove_assignees: string[],
  current_assignees: string[]
): boolean {
  for (const remove_assignee of remove_assignees) {
    if (!current_assignees.includes(remove_assignee)) {
      return false;
    }
  }
  return true;
}

function getNewAssignees(
  current_assignees: string[],
  add_assignees: string[],
  remove_assignees: string[]
): string[] {
  let copy = [...current_assignees];
  if (add_assignees) {
    for (const a of add_assignees) {
      if (!copy.includes(a)) {
        copy.push(a);
      }
    }
  }
  if (remove_assignees)
    copy = copy.filter((assignee) => !remove_assignees.includes(assignee));
  return copy;
}
