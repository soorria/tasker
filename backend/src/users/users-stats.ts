import { addWeeks, startOfToday } from "date-fns";
import { getConnection } from "typeorm";
import { Status, Task } from "../entity/Task";
import { TaskAssignment } from "../entity/TaskAssignment";

export type Stats = {
  businessThisWeek: number;
  tasksThisWeek: number;
  businessLastWeek: number;
  tasksLastWeek: number;
};

const DEFAULT_DAYS_OF_WORK = 1;

const getTasksInRange = async (
  userId: string,
  start: Date,
  end: Date,
  options: { status?: Status } = {}
): Promise<Task[]> => {
  const asstRepository =
    getConnection().getRepository<TaskAssignment>(TaskAssignment);

  const query = asstRepository
    .createQueryBuilder("t")
    .innerJoinAndSelect("t.task", "task")
    .where("user_assignee = :userId", { userId })
    .andWhere("task.deadline BETWEEN :start AND :end", {
      start: start.toISOString(),
      end: end.toISOString(),
    });

  if (typeof options.status === "string") {
    query.andWhere("task.status = :status", { status: options.status });
  }

  const assignments = await query.getMany();

  return assignments.map((asst) => asst.task as any);
};

const getDaysOfWork = (tasks: Task[]): number =>
  tasks.reduce(
    (acc, currentTask) =>
      acc + (currentTask.estimated_days || DEFAULT_DAYS_OF_WORK),
    0
  );

const getBusinessMetric = (daysOfWork: number) =>
  Math.ceil((daysOfWork / 5) * 100);

export const getStatsForUser = async (userId: string): Promise<Stats> => {
  const today = startOfToday();
  const dateInOneWeek = addWeeks(today, 1);
  const dateOneWeekAgo = addWeeks(today, -1);

  const tasksDueThisWeek = await getTasksInRange(userId, today, dateInOneWeek);

  const estimatedDaysOfWork = getDaysOfWork(tasksDueThisWeek);

  const tasksCompletedLastWeek = await getTasksInRange(
    userId,
    dateOneWeekAgo,
    today,
    { status: Status.DONE }
  );

  const lastWeekDaysOfWork = getDaysOfWork(tasksCompletedLastWeek);

  return {
    businessThisWeek: getBusinessMetric(estimatedDaysOfWork),
    tasksThisWeek: tasksDueThisWeek.length,
    businessLastWeek: getBusinessMetric(lastWeekDaysOfWork),
    tasksLastWeek: tasksCompletedLastWeek.length,
  };
};
