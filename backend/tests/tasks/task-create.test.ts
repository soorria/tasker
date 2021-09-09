import { createConnection, getConnection } from "typeorm";
import { clearEntity } from "../test-helpers/clear";
import { Task, Status } from "../../src/entity/Task";
import { Connection } from "../../src/entity/Connection";
import { TaskAssignment } from "../../src/entity/TaskAssignment";
import { User } from "../../src/entity/User";
import { createTask } from "../../src/tasks/task-create";
import { createUser } from "../../src/users/users-create";
import {
  createUserConnection,
  declineRequest,
  acceptRequest,
} from "../../src/connection";

test("bad string param of createTask test", async () => {
  try {
    await createTask("", "title", new Date(), Status.TO_DO, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_creator");
    expect(e.message).toBe("creator is null/undefined or empty string");
  }
  try {
    await createTask(null, "title", new Date(), Status.TO_DO, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_creator");
    expect(e.message).toBe("creator is null/undefined or empty string");
  }
  try {
    await createTask(undefined, "title", new Date(), Status.TO_DO, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_creator");
    expect(e.message).toBe("creator is null/undefined or empty string");
  }
  try {
    await createTask("asd", "", new Date(), Status.TO_DO, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_title");
    expect(e.message).toBe("title is null/undefined or empty string");
  }
  try {
    await createTask("asd", null, new Date(), Status.TO_DO, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_title");
    expect(e.message).toBe("title is null/undefined or empty string");
  }
  try {
    await createTask("asd", undefined, new Date(), Status.TO_DO, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_title");
    expect(e.message).toBe("title is null/undefined or empty string");
  }
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1);
  try {
    await createTask("asd", "asd", d, null, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_status");
    expect(e.message).toBe("status is null/undefined or empty string");
  }
  try {
    await createTask("asd", "asd", d, undefined, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_status");
    expect(e.message).toBe("status is null/undefined or empty string");
  }
  try {
    await createTask("asd", "asd", d, "" as any, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_status");
    expect(e.message).toBe("status is null/undefined or empty string");
  }
  try {
    await createTask("asd", "asd", null, Status.DONE, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_deadline");
    expect(e.message).toBe("deadline is not a Date, or is null/undefined");
  }
  try {
    await createTask("asd", "asd", undefined, Status.DONE, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_deadline");
    expect(e.message).toBe("deadline is not a Date, or is null/undefined");
  }
  try {
    await createTask("asd", "asd", "asd" as any, Status.DONE, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_deadline");
    expect(e.message).toBe("deadline is not a Date, or is null/undefined");
  }
  try {
    await createTask("asd", "asd", 1 as any, Status.DONE, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_deadline");
    expect(e.message).toBe("deadline is not a Date, or is null/undefined");
  }
});

test("not connected assignees test", async () => {
  expect.assertions(13);
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator2 = user2[0].id;
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
  try {
    await createTask(
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [task_creator2],
      task_project,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_assignees");
    expect(e.message).toBe(
      "invalid assignees, they must be connected or in same group"
    );
  }
  await createUserConnection(task_creator, task_creator2);
  try {
    await createTask(
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [task_creator2],
      task_project,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_assignees");
    expect(e.message).toBe(
      "invalid assignees, they must be connected or in same group"
    );
  }
  await declineRequest(task_creator, task_creator2);
  try {
    await createTask(
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [task_creator2],
      task_project,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_assignees");
    expect(e.message).toBe(
      "invalid assignees, they must be connected or in same group"
    );
  }
  await createUserConnection(task_creator2, task_creator);
  try {
    await createTask(
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [task_creator2],
      task_project,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_assignees");
    expect(e.message).toBe(
      "invalid assignees, they must be connected or in same group"
    );
  }
  await declineRequest(task_creator2, task_creator);
  try {
    await createTask(
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [task_creator2],
      task_project,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_assignees");
    expect(e.message).toBe(
      "invalid assignees, they must be connected or in same group"
    );
  }
  await createUserConnection(task_creator2, task_creator);
  try {
    await createTask(
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [task_creator2],
      task_project,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_assignees");
    expect(e.message).toBe(
      "invalid assignees, they must be connected or in same group"
    );
  }
  await acceptRequest(task_creator2, task_creator);
  await expect(
    createTask(
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [task_creator2],
      task_project,
      task_description,
      task_estimated_days
    )
  ).resolves.not.toThrow();
});

test("correct task creation", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
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

  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");

  const task_creator2 = user[0].id;
  const task_id = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator, task_creator2],
    task_project,
    task_description,
    task_estimated_days
  );

  expect.assertions(11);
  const tasks = await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } });
  expect(tasks.length).toBe(1);
  expect(tasks[0].project).toBe(null);
  expect(tasks[0].title).toBe(task_title);
  expect(tasks[0].deadline).toStrictEqual(task_deadline);
  expect(tasks[0].status).toBe(task_status);
  expect(tasks[0].description).toBe(task_description);
  expect(tasks[0].estimated_days).toBe(task_estimated_days);
  const obj = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id }, relations: ["creator"] })) as any;
  expect(obj[0].creator.id).toBe(task_creator);
  const assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assigns.length).toBe(2);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  expect(assigns[1].user_assignee.id).toBe(task_creator2);
});

test("implicit creator task creation", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
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
    [],
    task_project,
    task_description,
    task_estimated_days
  );
  let assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assigns.length).toBe(1);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  const tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id }, relations: ["creator"] })) as any;
  expect(tasks.length).toBe(1);
  expect(tasks[0].project).toBe(null);
  expect(tasks[0].title).toBe(task_title);
  expect(tasks[0].deadline).toStrictEqual(task_deadline);
  expect(tasks[0].status).toBe(task_status);
  expect(tasks[0].description).toBe(task_description);
  expect(tasks[0].estimated_days).toBe(task_estimated_days);
  expect(tasks[0].creator.id).toBe(task_creator);
  const task_id2 = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    null,
    task_project,
    task_description,
    task_estimated_days
  );
  assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id2 } })) as any;
  expect(assigns.length).toBe(1);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  const tasks2 = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id2 }, relations: ["creator"] })) as any;
  expect(tasks2.length).toBe(1);
  expect(tasks2[0].project).toBe(null);
  expect(tasks2[0].title).toBe(task_title);
  expect(tasks2[0].deadline).toStrictEqual(task_deadline);
  expect(tasks2[0].status).toBe(task_status);
  expect(tasks2[0].description).toBe(task_description);
  expect(tasks2[0].estimated_days).toBe(task_estimated_days);
  expect(tasks2[0].creator.id).toBe(task_creator);

  const task_id3 = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    undefined,
    task_project,
    task_description,
    task_estimated_days
  );
  assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id3 } })) as any;
  expect(assigns.length).toBe(1);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  const tasks3 = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id3 }, relations: ["creator"] })) as any;
  expect(tasks3.length).toBe(1);
  expect(tasks3[0].project).toBe(null);
  expect(tasks3[0].title).toBe(task_title);
  expect(tasks3[0].deadline).toStrictEqual(task_deadline);
  expect(tasks3[0].status).toBe(task_status);
  expect(tasks3[0].description).toBe(task_description);
  expect(tasks3[0].estimated_days).toBe(task_estimated_days);
  expect(tasks3[0].creator.id).toBe(task_creator);

  const task_id4 = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status
  );
  assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id4 } })) as any;
  expect(assigns.length).toBe(1);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  const tasks4 = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id4 }, relations: ["creator"] })) as any;
  expect(tasks4.length).toBe(1);
  expect(tasks4[0].project).toBe(null);
  expect(tasks4[0].title).toBe(task_title);
  expect(tasks4[0].deadline).toStrictEqual(task_deadline);
  expect(tasks4[0].status).toBe(task_status);
  expect(tasks4[0].description).toBe(null);
  expect(tasks4[0].estimated_days).toBe(null);
  expect(tasks4[0].creator.id).toBe(task_creator);
});

test("invalid status test", async () => {
  expect.assertions(2);
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1);
  try {
    await createTask("asd", "asd", d, "a" as any, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_status");
    expect(e.message).toBe(
      'Status enum is {NOT_STARTED = "TO_DO", IN_PROGRESS = "IN_PROGRESS", BLOCKED = "BLOCKED", COMPLETED = "DONE"}'
    );
  }
});

test("invalid deadline test", async () => {
  expect.assertions(2);
  try {
    await createTask("asd", "asd", new Date(), undefined, []);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_deadline");
    expect(e.message).toBe("deadline must be in the future");
  }
});

test("invalid estimated_days and invalid creator test", async () => {
  expect.assertions(4);
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1);
  try {
    await createTask("asd", "asd", d, Status.DONE, null, null, null, -1);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_estimated_days");
    expect(e.message).toBe("estimated_days must be >= 0");
  }
  try {
    await createTask("asd", "asd", d, Status.DONE, null, null, null, 0);
  } catch (e) {
    expect(e.code).toBe("createTask/invalid_creator");
    expect(e.message).toBe("user/creator with this id does not exist");
  }
});

test("multiple assignee creation", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });

  const task_creator2 = user2[0].id;
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
  await createUserConnection(task_creator2, task_creator);
  await acceptRequest(task_creator2, task_creator);
  const task_id = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator, task_creator2],
    task_project,
    task_description,
    task_estimated_days
  );
  const assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assigns.length).toBe(2);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  expect(assigns[1].user_assignee.id).toBe(task_creator2);
  const tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id }, relations: ["creator"] })) as any;
  expect(tasks.length).toBe(1);
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
