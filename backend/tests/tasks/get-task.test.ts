import { createConnection, getConnection } from "typeorm";
import { clearEntity } from "../test-helpers/clear";
import { Task, Status } from "../../src/entity/Task";
import { User } from "../../src/entity/User";
import { Connection } from "../../src/entity/Connection";
import { TaskAssignment } from "../../src/entity/TaskAssignment";
import { getTask } from "../../src/tasks/get-task";
import { createTask } from "../../src/tasks/task-create";
import { editTask } from "../../src/tasks/task-edit";
import { createUser } from "../../src/users/users-create";
import {
  createUserConnection,
  declineRequest,
  acceptRequest,
} from "../../src/connection";

test("invalid ids test", async () => {
  try {
    await getTask("", "asd");
  } catch (e) {
    expect(e.code).toBe("getTask/invalid_user_id");
    expect(e.message).toBe(
      "user_id provided is null/undefined or empty string"
    );
  }
  try {
    await getTask(undefined, "asd");
  } catch (e) {
    expect(e.code).toBe("getTask/invalid_user_id");
    expect(e.message).toBe(
      "user_id provided is null/undefined or empty string"
    );
  }
  try {
    await getTask(null, "asd");
  } catch (e) {
    expect(e.code).toBe("getTask/invalid_user_id");
    expect(e.message).toBe(
      "user_id provided is null/undefined or empty string"
    );
  }
  try {
    await getTask("s", "");
  } catch (e) {
    expect(e.code).toBe("getTask/invalid_task_id");
    expect(e.message).toBe(
      "task_id provided is null/undefined or empty string"
    );
  }
  try {
    await getTask("s", null);
  } catch (e) {
    expect(e.code).toBe("getTask/invalid_task_id");
    expect(e.message).toBe(
      "task_id provided is null/undefined or empty string"
    );
  }
  try {
    await getTask("d", undefined);
  } catch (e) {
    expect(e.code).toBe("getTask/invalid_task_id");
    expect(e.message).toBe(
      "task_id provided is null/undefined or empty string"
    );
  }
  try {
    await getTask("d", "s");
  } catch (e) {
    expect(e.code).toBe("getTask/task_id_nonexistent");
    expect(e.message).toBe("task does not exist");
  }
});

test("unconnected test", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const task_creator = user[0].id;
  const task_project: string = null;
  const task_title = "title";
  const task_deadline = new Date();
  task_deadline.setMinutes(task_deadline.getMinutes() + 1);
  const task_status = Status.TO_DO;
  const task_description = "description\n";
  const task_estimated_days = 2.5;
  const task_id = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );

  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator2 = user2[0].id;
  try {
    await getTask(task_creator2, task_id);
  } catch (e) {
    expect(e.code).toBe("getTask/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, must be connected to an assignee of the task"
    );
  }
  let task = (await getTask(task_creator, task_id)) as any;
  expect(task.project).toBe(task_project);
  expect(task.creator.id).toBe(task_creator);
  expect(task.title).toBe(task_title);
  expect(task.deadline).toStrictEqual(task_deadline);
  expect(task.status).toBe(task_status);
  expect(task.description).toBe(task_description);
  expect(task.estimated_days).toBe(task_estimated_days);
  expect(task.assignees.length).toBe(1);
  expect(task.assignees[0].id).toBe(task_creator);
  await createUserConnection(task_creator, task_creator2);
  try {
    await getTask(task_creator2, task_id);
  } catch (e) {
    expect(e.code).toBe("getTask/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, must be connected to an assignee of the task"
    );
  }
  await declineRequest(task_creator, task_creator2);
  try {
    await getTask(task_creator2, task_id);
  } catch (e) {
    expect(e.code).toBe("getTask/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, must be connected to an assignee of the task"
    );
  }
  await createUserConnection(task_creator, task_creator2);
  await acceptRequest(task_creator, task_creator2);
  task = (await getTask(task_creator, task_id)) as any;
  expect(task.project).toBe(task_project);
  expect(task.creator.id).toBe(task_creator);
  expect(task.title).toBe(task_title);
  expect(task.deadline).toStrictEqual(task_deadline);
  expect(task.status).toBe(task_status);
  expect(task.description).toBe(task_description);
  expect(task.estimated_days).toBe(task_estimated_days);
  expect(task.assignees.length).toBe(1);
  expect(task.assignees[0].id).toBe(task_creator);
  await editTask(
    task_id,
    task_creator,
    null,
    null,
    null,
    [task_creator2],
    null
  );
  task = (await getTask(task_creator, task_id)) as any;
  expect(task.project).toBe(task_project);
  expect(task.creator.id).toBe(task_creator);
  expect(task.title).toBe(task_title);
  expect(task.deadline).toStrictEqual(task_deadline);
  expect(task.status).toBe(task_status);
  expect(task.description).toBe(task_description);
  expect(task.estimated_days).toBe(task_estimated_days);
  expect(task.assignees.length).toBe(2);
  expect(task.assignees[0].id).toBe(task_creator);
  expect(task.assignees[1].id).toBe(task_creator2);
});

beforeAll(async () => {
  await createConnection();
});

beforeEach(async () => {
  await clearEntity(TaskAssignment);
  await clearEntity(Task);
  await clearEntity(Connection);
  await clearEntity(User);
});

afterAll(async () => {
  await clearEntity(TaskAssignment);
  await clearEntity(Task);
  await clearEntity(Connection);
  await clearEntity(User);
  return await getConnection().close();
});
