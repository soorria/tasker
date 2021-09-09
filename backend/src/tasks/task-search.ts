import {
  FindOperator,
  getConnection,
  ILike,
  LessThanOrEqual,
  In,
} from "typeorm";
import _ from "lodash";
import { Task, Status } from "../entity/Task";
import { User } from "../entity/User";
import { TaskAssignment } from "../entity/TaskAssignment";

interface Search {
  id?: FindOperator<string[]>;
  title?: FindOperator<string>;
  description?: FindOperator<string>;
  project?: string;
  creator?: any;
  deadline?: FindOperator<Date>;
  status?: Status;
  estimated_days?: number;
}

export async function taskSearch(
  me: string,
  title?: string,
  description?: string,
  project?: string,
  creator?: string, // needs to be converted to User object
  // deadline assumes all events tasks before deadline
  deadline?: string, // needs to be converted to date
  status?: string, // needs to be converted to status
  estimated_days?: string, // needs to be converted to number
  user_assignee?: string[] // assuming this is their id
): /*Promise<Task[]>*/ Promise<any> {
  const search: Search = {};

  // add values if they exist
  if (title) {
    search["title"] = ILike(`%${title}%`);
  }
  if (description) {
    search["description"] = ILike(`%${description}%`);
  }
  if (project) {
    search["project"] = project;
  }
  if (creator) {
    const user = await getConnection()
      .getRepository(User)
      .find({ where: { id: creator } });
    search["creator"] = user;
  }
  if (deadline) {
    const date = new Date(deadline);
    search["deadline"] = LessThanOrEqual(date);
  }
  if (status) {
    let state: Status | null = null;
    switch (status) {
      case "TO_DO":
        state = Status.TO_DO;
        break;
      case "IN_PROGRESS":
        state = Status.IN_PROGRESS;
        break;
      case "BLOCKED":
        state = Status.BLOCKED;
        break;
      case "DONE":
        state = Status.DONE;
        break;
      default:
        return [];
    }
    search["status"] = state;
  }
  if (estimated_days) {
    search["estimated_days"] = Number(estimated_days);
  }

  let all_assignees = [me];
  if (user_assignee) {
    all_assignees = all_assignees.concat(user_assignee);
  }

  // gets all task assignments
  const task_assignments = await getConnection()
    .getRepository(TaskAssignment)
    .find({
      where: { user_assignee: In(all_assignees) },
      relations: ["task"],
    });

  // finds all the tasks that match
  const matching_tasks = task_assignments.map((task) => {
    return {
      user: task.user_assignee,
      user_id: Object(task.user_assignee).id,
      task_id: Object(task.task).id,
      task: Object(task.task),
    };
  });

  // group tasks by task id
  const tasks_grouped = _.mapValues(
    _.groupBy(matching_tasks, "task_id"),
    (clist) => clist.map((matching_tasks) => _.omit(matching_tasks, "task_id"))
  );

  // gets all users assigned to each task
  const user_list_by_task = Object.keys(tasks_grouped).map((key) => {
    return {
      user_list: tasks_grouped[key].map((task_obj) => task_obj.user_id),
      task: tasks_grouped[key][0].task, // same tasks are already grouped
    };
  });

  // makes sure user has access to those tasks
  let return_tasks = user_list_by_task.filter((task_obj) =>
    task_obj.user_list.includes(me)
  );
  return_tasks = return_tasks.map((obj) => obj.task.id);
  // @ts-ignore
  search["id"] = In(return_tasks);

  // find the tasks from the list of tasks me has access to that matches criteria
  let tasks = await getConnection().getRepository(Task).find({
    where: search,
  });

  const searchForTasksCreated = { ...search, creator: me };
  delete searchForTasksCreated.id;

  const tasksCreated = await getConnection()
    .getRepository(Task)
    .find({ where: searchForTasksCreated });

  tasks = _.unionBy(tasks, tasksCreated, "id");

  const taskIds = tasks.map((t) => t.id);
  const assignments = await getConnection()
    .getRepository(TaskAssignment)
    .find({ where: { task: In(taskIds) } });

  assignments.forEach((asst) => {
    delete (asst as any).user_assignee.password_hash;
  });

  tasks.forEach((task: any) => {
    task.assignees = assignments
      .filter((asst) => (asst as any).task.id == task.id)
      .map((asst) => asst.user_assignee);
  });

  tasks.map((task: any) => {
    delete task.creator.password_hash;
  });

  // sort by deadline, closer deadlines first
  tasks.sort(function compare(a: Task, b: Task) {
    return a.deadline.getTime() - b.deadline.getTime();
  });

  return tasks;
}
