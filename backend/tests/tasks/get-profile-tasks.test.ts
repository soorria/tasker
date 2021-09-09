import { createConnection, getConnection } from "typeorm";
import { clearEntity } from "../test-helpers/clear";
import { Task, Status } from "../../src/entity/Task";
import { User } from "../../src/entity/User";
import { Connection } from "../../src/entity/Connection";
import { TaskAssignment } from "../../src/entity/TaskAssignment";
import { getProfileTasks } from "../../src/tasks/get-profile-tasks";
import { createTask } from "../../src/tasks/task-create";
import { createUser } from "../../src/users/users-create";
import {
  createUserConnection,
  declineRequest,
  acceptRequest,
} from "../../src/connection";

test("invalid ids test", async () => {
  try {
    await getProfileTasks("", "asd");
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/invalid_user_id");
    expect(e.message).toBe(
      "user id provided is null/undefined or empty string"
    );
  }
  try {
    await getProfileTasks(null, "asd");
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/invalid_user_id");
    expect(e.message).toBe(
      "user id provided is null/undefined or empty string"
    );
  }
  try {
    await getProfileTasks(undefined, "asd");
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/invalid_user_id");
    expect(e.message).toBe(
      "user id provided is null/undefined or empty string"
    );
  }
  try {
    await getProfileTasks("asd", null);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/invalid_profile_user_id");
    expect(e.message).toBe(
      "profile id provided is null/undefined or empty string"
    );
  }
  try {
    await getProfileTasks("asd", "");
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/invalid_profile_user_id");
    expect(e.message).toBe(
      "profile id provided is null/undefined or empty string"
    );
  }
  try {
    await getProfileTasks("asd", undefined);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/invalid_profile_user_id");
    expect(e.message).toBe(
      "profile id provided is null/undefined or empty string"
    );
  }
});

test("connected test", async () => {
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
  await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  const task_project2: string = null;
  const task_title2 = "title2";
  const task_deadline2 = new Date();
  task_deadline2.setMinutes(task_deadline.getMinutes() + 1);
  const task_status2 = Status.BLOCKED;
  const task_description2 = "description2\n";
  const task_estimated_days2 = 3;
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator2 = user2[0].id;
  await createTask(
    task_creator2,
    task_title2,
    task_deadline2,
    task_status2,
    [task_creator2],
    task_project2,
    task_description2,
    task_estimated_days2
  );
  await createUserConnection(task_creator, task_creator2);
  await acceptRequest(task_creator, task_creator2);
  const tasks = (await getProfileTasks(task_creator, task_creator2)) as any;
  expect(tasks.length).toBe(1);
  expect(tasks[0].project).toBe(task_project2);
  expect(tasks[0].creator.id).toBe(task_creator2);
  expect(tasks[0].title).toBe(task_title2);
  expect(tasks[0].deadline).toStrictEqual(task_deadline2);
  expect(tasks[0].status).toBe(task_status2);
  expect(tasks[0].description).toBe(task_description2);
  expect(tasks[0].estimated_days).toBe(task_estimated_days2);
  expect(tasks[0].assignees.length).toBe(1);
  expect(tasks[0].assignees[0].id).toBe(task_creator2);

  const tasks2 = (await getProfileTasks(task_creator2, task_creator)) as any;
  expect(tasks2.length).toBe(1);
  expect(tasks2[0].project).toBe(task_project);
  expect(tasks2[0].creator.id).toBe(task_creator);
  expect(tasks2[0].title).toBe(task_title);
  expect(tasks2[0].deadline).toStrictEqual(task_deadline);
  expect(tasks2[0].status).toBe(task_status);
  expect(tasks2[0].description).toBe(task_description);
  expect(tasks2[0].estimated_days).toBe(task_estimated_days);
  expect(tasks2[0].assignees.length).toBe(1);
  expect(tasks2[0].assignees[0].id).toBe(task_creator);

  await expect(
    createTask(
      task_creator2,
      "two assignee",
      task_deadline2,
      task_status2,
      [task_creator, task_creator2],
      task_project2,
      task_description2,
      task_estimated_days2
    )
  ).resolves.not.toThrow();
  const tasks3 = (await getProfileTasks(task_creator2, task_creator2)) as any;
  expect(tasks3.length).toBe(2);
  expect(tasks3[1].creator.id).toBe(task_creator2);
  expect(tasks3[1].assignees.length).toBe(2);
  expect(tasks3[1].assignees[0].id).toBe(task_creator);
  expect(tasks3[1].assignees[1].id).toBe(task_creator2);
});

test("not accepted connection test", async () => {
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
  await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  const task_project2: string = null;
  const task_title2 = "title2";
  const task_deadline2 = new Date();
  task_deadline2.setMinutes(task_deadline.getMinutes() + 1);
  const task_status2 = Status.BLOCKED;
  const task_description2 = "description2\n";
  const task_estimated_days2 = 3;
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator2 = user2[0].id;
  await expect(
    createTask(
      task_creator2,
      task_title2,
      task_deadline2,
      task_status2,
      [task_creator],
      task_project2,
      task_description2,
      task_estimated_days2
    )
  ).rejects.toThrow();
  await createUserConnection(task_creator, task_creator2);
  expect.assertions(5);
  try {
    await getProfileTasks(task_creator, task_creator2);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
  try {
    await getProfileTasks(task_creator2, task_creator);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
});

test("declined connection test", async () => {
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
  await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  const task_project2: string = null;
  const task_title2 = "title2";
  const task_deadline2 = new Date();
  task_deadline2.setMinutes(task_deadline.getMinutes() + 1);
  const task_status2 = Status.BLOCKED;
  const task_description2 = "description2\n";
  const task_estimated_days2 = 3;
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "bas@gmail.com" } });
  const task_creator2 = user2[0].id;
  await expect(
    createTask(
      task_creator2,
      task_title2,
      task_deadline2,
      task_status2,
      [task_creator],
      task_project2,
      task_description2,
      task_estimated_days2
    )
  ).rejects.toThrow();
  await createUserConnection(task_creator, task_creator2);
  await declineRequest(task_creator, task_creator2);
  expect.assertions(5);
  try {
    await getProfileTasks(task_creator, task_creator2);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
  try {
    await getProfileTasks(task_creator2, task_creator);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
});

test("get own tasks test", async () => {
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
  await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator],
    task_project,
    task_description,
    task_estimated_days
  );
  const tasks = (await getProfileTasks(task_creator, task_creator)) as any;
  expect(tasks.length).toBe(2);
  expect(tasks[0].project).toBe(task_project);
  expect(tasks[0].creator.id).toBe(task_creator) as any;
  expect(tasks[0].title).toBe(task_title);
  expect(tasks[0].deadline).toStrictEqual(task_deadline);
  expect(tasks[0].status).toBe(task_status);
  expect(tasks[0].description).toBe(task_description);
  expect(tasks[0].estimated_days).toBe(task_estimated_days);
  expect(tasks[0].assignees.length).toBe(1);
  expect(tasks[0].assignees[0].id).toBe(task_creator);

  expect(tasks[1].project).toBe(task_project);
  expect(tasks[1].creator.id).toBe(task_creator);
  expect(tasks[1].title).toBe(task_title);
  expect(tasks[1].deadline).toStrictEqual(task_deadline);
  expect(tasks[1].status).toBe(task_status);
  expect(tasks[1].description).toBe(task_description);
  expect(tasks[1].estimated_days).toBe(task_estimated_days);
  expect(tasks[1].assignees.length).toBe(1);
  expect(tasks[1].assignees[0].id).toBe(task_creator);
});

test("not connected test", async () => {
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
  await createTask(
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
  await expect(
    createTask(
      task_creator2,
      task_title,
      task_deadline,
      task_status,
      [task_creator],
      task_project,
      task_description,
      task_estimated_days
    )
  ).rejects.toThrow();

  expect.assertions(5);
  try {
    await getProfileTasks(task_creator, task_creator2);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
  try {
    await getProfileTasks(task_creator2, task_creator);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
});

test("get no profile tasks test", async () => {
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
  let t = await getProfileTasks(task_creator, task_creator);
  expect(t.length).toBe(0);
  t = await getProfileTasks(task_creator2, task_creator2);
  expect(t.length).toBe(0);
  try {
    await getProfileTasks(task_creator, task_creator2);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
  try {
    await getProfileTasks(task_creator2, task_creator);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
  await createUserConnection(task_creator, task_creator2);
  t = await getProfileTasks(task_creator2, task_creator2);
  expect(t.length).toBe(0);
  try {
    await getProfileTasks(task_creator, task_creator2);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
  try {
    await getProfileTasks(task_creator2, task_creator);
  } catch (e) {
    expect(e.code).toBe("getProfileTasks/no_perm");
    expect(e.message).toBe(
      "You are unauthorised, as you aren't connected to this user"
    );
  }
  await acceptRequest(task_creator, task_creator2);
  t = await getProfileTasks(task_creator, task_creator2);
  expect(t.length).toBe(0);
  t = await getProfileTasks(task_creator2, task_creator);
  expect(t.length).toBe(0);
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
