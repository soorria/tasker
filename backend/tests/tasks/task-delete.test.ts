import { createConnection, getConnection } from "typeorm";
import { clearEntity } from "../test-helpers/clear";
import { Task, Status } from "../../src/entity/Task";
import { Connection } from "../../src/entity/Connection";
import { TaskAssignment } from "../../src/entity/TaskAssignment";
import { User } from "../../src/entity/User";
import { createTask } from "../../src/tasks/task-create";
import { createUser } from "../../src/users/users-create";
import { deleteTask } from "../../src/tasks/task-delete";
import { createUserConnection, acceptRequest } from "../../src/connection";

test("bad task deletion", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const task_creator = user[0].id;
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
  await createUserConnection(user2_id, task_creator);
  await acceptRequest(user2_id, task_creator);
  const task_id = await createTask(
    task_creator,
    task_title,
    task_deadline,
    task_status,
    [task_creator, user2_id],
    task_project,
    task_description,
    task_estimated_days
  );
  const tasks = await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } });
  expect(tasks.length).toBe(1);
  const assigns = await getConnection().getRepository(TaskAssignment).find();
  expect(assigns.length).toBe(2);
  try {
    await deleteTask(user2_id, task_id);
  } catch (e) {
    expect(e.code).toBe("deleteTask/invalid_delete");
    expect(e.message).toBe("deletor_id must match task creator's id to delete");
  }
  try {
    await deleteTask(user2_id, "a");
  } catch (e) {
    expect(e.code).toBe("deleteTask/invalid_task_id");
    expect(e.message).toBe("task with this id does not exist");
  }
});

test("correct task deletion", async () => {
  await createUser("asd@gmail.com", "badpassword", "bob", "dob", "asd");
  await createUser("bas@gmail.com", "badpassword", "bob", "dob", "asd");
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const task_creator = user[0].id;
  const user2 = await getConnection()
    .getRepository(User)
    .find({ where: { email: "asd@gmail.com" } });
  const user2_id = user2[0].id;
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
    [task_creator, user2_id],
    task_project,
    task_description,
    task_estimated_days
  );
  let tasks = await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } });
  expect(tasks.length).toBe(1);
  let assigns = await getConnection().getRepository(TaskAssignment).find();
  expect(assigns.length).toBe(2);
  await deleteTask(task_creator, task_id);
  tasks = await getConnection()
    .getRepository(Task)
    .find({ where: { id: task_id } });
  expect(tasks.length).toBe(0);
  assigns = await getConnection().getRepository(TaskAssignment).find();
  expect(assigns.length).toBe(0);
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
