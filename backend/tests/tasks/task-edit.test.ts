import { createConnection, getConnection } from "typeorm";
import { clearEntity } from "../test-helpers/clear";
import { Task, Status } from "../../src/entity/Task";
import { User } from "../../src/entity/User";
import { editTask } from "../../src/tasks/task-edit";
import { createTask } from "../../src/tasks/task-create";
import { createUser } from "../../src/users/users-create";
import { Connection } from "../../src/entity/Connection";
import { TaskAssignment } from "../../src/entity/TaskAssignment";
import { createUserConnection, acceptRequest } from "../../src/connection";

test("empty string param of editTask test", async () => {
  expect.assertions(8);
  try {
    await editTask("task_id", "editor");
  } catch (e) {
    expect(e.code).toBe("editTask/bad_params");
    expect(e.message).toBe(
      "ensure at least one editable field is defined or not empty"
    );
  }
  try {
    await editTask("task_id", "editor", "");
  } catch (e) {
    expect(e.code).toBe("editTask/bad_params");
    expect(e.message).toBe(
      "ensure at least one editable field is defined or not empty"
    );
  }
  try {
    await editTask("task_id", "editor", null);
  } catch (e) {
    expect(e.code).toBe("editTask/bad_params");
    expect(e.message).toBe(
      "ensure at least one editable field is defined or not empty"
    );
  }
  try {
    await editTask("task_id", "editor", "", null);
  } catch (e) {
    expect(e.code).toBe("editTask/bad_params");
    expect(e.message).toBe(
      "ensure at least one editable field is defined or not empty"
    );
  }
});

test("correct task edit", async () => {
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const user2_id = user2[0].id;
  const task_project: string = null;
  const task_title = "title";
  const task_deadline = new Date();
  task_deadline.setMinutes(task_deadline.getMinutes() + 1);
  const task_status = Status.TO_DO;
  const task_description = "description\n";
  const task_estimated_days = 2.5;
  const task_id = await createTask(
    user2_id,
    task_title,
    task_deadline,
    task_status,
    [user2_id],
    task_project,
    task_description,
    task_estimated_days
  );

  const new_deadline = new Date();
  new_deadline.setMinutes(new_deadline.getMinutes() + 10);
  await editTask(task_id, user2_id, null, new_deadline, null, null, null);
  expect.assertions(9);
  const tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id }, relations: ["creator"] })) as any;
  expect(tasks.length).toBe(1);
  expect(tasks[0].project).toBe(null);
  expect(tasks[0].creator.id).toBe(user2_id);
  expect(tasks[0].title).toBe(task_title);
  expect(tasks[0].deadline).toStrictEqual(new_deadline);
  expect(tasks[0].status).toBe(task_status);
  expect(tasks[0].description).toBe(task_description);
  expect(tasks[0].estimated_days).toBe(task_estimated_days);
  const assigns = await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } });
  expect(assigns.length).toBe(1);
});

test("invalid status test", async () => {
  expect.assertions(2);
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
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  const bad_status = "b";
  try {
    await editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      bad_status as any,
      [],
      null,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_status");
    expect(e.message).toBe(
      'Status enum is {NOT_STARTED = "TO_DO", IN_PROGRESS = "IN_PROGRESS", BLOCKED = "BLOCKED", COMPLETED = "DONE"}'
    );
  }
});

test("correct task edit connected user assignee", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator = user[0].id;
  const user2_id = user2[0].id;
  const task_project: string = null;
  const task_title = "title";
  const task_deadline = new Date();
  task_deadline.setMinutes(task_deadline.getMinutes() + 1);
  const task_status = Status.TO_DO;
  const task_description = "description\n";
  const task_estimated_days = 2.5;
  await createUserConnection(user2_id, task_creator);
  await acceptRequest(user2_id, task_creator);
  const task_id = await createTask(
    user2_id,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );

  const new_deadline = new Date();
  new_deadline.setMinutes(new_deadline.getMinutes() + 10);
  await editTask(
    task_id,
    user2_id,
    null,
    new_deadline,
    null,
    [task_creator, user2_id],
    null
  );
  const tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id }, relations: ["creator"] })) as any;
  expect(tasks.length).toBe(1);
  expect(tasks[0].project).toBe(null);
  expect(tasks[0].creator.id).toBe(user2_id);
  expect(tasks[0].title).toBe(task_title);
  expect(tasks[0].deadline).toStrictEqual(new_deadline);
  expect(tasks[0].status).toBe(task_status);
  expect(tasks[0].description).toBe(task_description);
  expect(tasks[0].estimated_days).toBe(task_estimated_days);
  const assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assigns.length).toBe(2);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  expect(assigns[1].user_assignee.id).toBe(user2_id);
});

test("not connected assignee test", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const task_creator = user[0].id;
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator2 = user2[0].id;
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
  try {
    await editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [task_creator2],
      null,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_add_assignees");
    expect(e.message).toBe(
      "add_assignees must be connected to editor or in same group"
    );
  }
  await createUserConnection(task_creator2, task_creator);
  try {
    await editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [task_creator2],
      null,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_add_assignees");
    expect(e.message).toBe(
      "add_assignees must be connected to editor or in same group"
    );
  }
  await acceptRequest(task_creator2, task_creator);
  await expect(
    editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      null,
      [task_creator],
      task_description,
      task_estimated_days
    )
  ).resolves.not.toThrow();
  let assignments = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assignments.length).toBe(1);
  expect(assignments[0].user_assignee.id).toBe(task_creator);
  let tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } })) as any;
  expect(tasks.length).toBe(1);
  await expect(
    editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [task_creator2],
      [task_creator],
      task_description,
      task_estimated_days
    )
  ).resolves.not.toThrow();
  assignments = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assignments.length).toBe(1);
  expect(assignments[0].user_assignee.id).toBe(task_creator2);
  tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } })) as any;
  expect(tasks.length).toBe(1);
  try {
    await editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [task_creator2],
      ["asd"],
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_remove_assignees");
    expect(e.message).toBe(
      "remove_assignees contains id of a user that is not currently assigned to the task"
    );
  }
  assignments = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assignments.length).toBe(1);
  expect(assignments[0].user_assignee.id).toBe(task_creator2);
  tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } })) as any;
  expect(tasks.length).toBe(1);
  await expect(
    editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [task_creator2],
      [],
      task_description,
      task_estimated_days
    )
  ).resolves.not.toThrow();
  assignments = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assignments.length).toBe(1);
  expect(assignments[0].user_assignee.id).toBe(task_creator2);
  tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } })) as any;
  expect(tasks.length).toBe(1);
});

test("invalid deadline test", async () => {
  expect.assertions(2);
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const task_creator = user[0].id;
  const task_project: string = null;
  const task_title = "title";
  const task_status = Status.TO_DO;
  const task_deadline = new Date();
  task_deadline.setMinutes(task_deadline.getMinutes() + 1);
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
  const new_task_deadline = new Date(); // sets time to now;
  try {
    await editTask(
      task_id,
      task_creator,
      task_title,
      new_task_deadline,
      task_status,
      null,
      undefined,
      task_description,
      task_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_deadline");
    expect(e.message).toBe("deadline must be in the future");
  }
});

test("invalid estimated_days test", async () => {
  expect.assertions(2);
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
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  const new_estimated_days = -0.00001;
  try {
    await editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      task_status,
      [],
      undefined,
      task_description,
      new_estimated_days
    );
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_estimated_days");
    expect(e.message).toBe("estimated_days must be >= 0");
  }
});

test("editor is not creator test", async () => {
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
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const user2_id = user2[0].id;
  await createUserConnection(task_creator, user2_id);
  await acceptRequest(task_creator, user2_id);

  const task_id = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [user2_id],
    task_project,
    task_description,
    task_estimated_days
  );
  const task_id2 = await createTask(
    user2_id,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  expect.assertions(6);
  try {
    await editTask(task_id, "asd", "newtitle");
  } catch (e) {
    expect(e.code).toBe("editTask/no_perm");
    expect(e.message).toBe(
      "this user cannot edit this task, only it's creator can"
    );
  }
  try {
    await editTask(task_id, user2_id, "newtitle");
  } catch (e) {
    expect(e.code).toBe("editTask/no_perm");
    expect(e.message).toBe(
      "this user cannot edit this task, only it's creator can"
    );
  }
  try {
    await editTask(task_id2, task_creator, "newtitle");
  } catch (e) {
    expect(e.code).toBe("editTask/no_perm");
    expect(e.message).toBe(
      "this user cannot edit this task, only it's creator can"
    );
  }
});

test("invalid task id test", async () => {
  expect.assertions(10);
  try {
    await editTask(null, "a");
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_task_id");
    expect(e.message).toBe("task_id is null/undefined or empty string");
  }
  try {
    await editTask("a", null);
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_editor");
    expect(e.message).toBe("editor id is null/undefined or empty string");
  }
  try {
    await editTask("a", null, "a");
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_editor");
    expect(e.message).toBe("editor id is null/undefined or empty string");
  }
  try {
    await editTask("1", null, "a");
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_editor");
    expect(e.message).toBe("editor id is null/undefined or empty string");
  }
  try {
    await editTask(null, null);
  } catch (e) {
    expect(e.code).toBe("editTask/invalid_task_id");
    expect(e.message).toBe("task_id is null/undefined or empty string");
  }
});

test("task not exist test", async () => {
  expect.assertions(4);
  try {
    await editTask("null", "a", "a");
  } catch (e) {
    expect(e.code).toBe("editTask/task_id_nonexistent");
    expect(e.message).toBe("task does not exist");
  }
  try {
    await editTask("bad23", "a", "a");
  } catch (e) {
    expect(e.code).toBe("editTask/task_id_nonexistent");
    expect(e.message).toBe("task does not exist");
  }
});

test("implicit edit assignees test", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const task_creator = user[0].id;
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator2 = user2[0].id;
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
    [task_creator2],
    task_project,
    task_description,
    task_estimated_days
  );
  await expect(
    editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [task_creator2],
      [],
      task_description,
      task_estimated_days
    )
  ).resolves.not.toThrow();
  let assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assigns.length).toBe(1);
  expect(assigns[0].user_assignee.id).toBe(task_creator2);
  let tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } })) as any;
  expect(tasks.length).toBe(1);
  await expect(
    editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [],
      [task_creator2],
      task_description,
      task_estimated_days
    )
  ).resolves.not.toThrow();
  assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assigns.length).toBe(1);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } })) as any;
  expect(tasks.length).toBe(1);
  await expect(
    editTask(
      task_id,
      task_creator,
      task_title,
      task_deadline,
      Status.TO_DO,
      [task_creator2],
      undefined,
      task_description,
      task_estimated_days
    )
  ).resolves.not.toThrow();
  assigns = (await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: task_id } })) as any;
  expect(assigns.length).toBe(2);
  expect(assigns[0].user_assignee.id).toBe(task_creator);
  expect(assigns[1].user_assignee.id).toBe(task_creator2);
  tasks = (await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } })) as any;
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
