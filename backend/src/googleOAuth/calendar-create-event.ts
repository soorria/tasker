import { Task } from "../entity/Task";
import { getCalendarCredential } from "../calendar-credentials";
import { TaskAssignment } from "../entity/TaskAssignment";
import { getConnection } from "typeorm";
import { google } from "googleapis";

const GCP_CLIENT_ID = process.env.GCP_CLIENT_ID;
const GCP_CLIENT_SECRET = process.env.GCP_CLIENT_SECRET;
const GCP_REDIRECT_URL = process.env.GCP_REDIRECT_URL;

export function getCalendarEventStartTime(task: Task): Date {
  const endDate = task.deadline;
  const estimatedDays = task.estimated_days;
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - estimatedDays);
  return startDate;
}

export async function saveTaskToCalendar(task_id: string): Promise<void> {
  // find user's calendar's credentials
  const taskRepo = getConnection().getRepository(Task);
  const task = await taskRepo.findOne({ where: { id: task_id } });

  const event = {
    summary: task.title,
    location: "",
    description: task.description,
    start: {
      dateTime: getCalendarEventStartTime(task).toISOString(),
      timeZone: "Australia/Sydney",
    },
    end: {
      dateTime: task.deadline.toISOString(),
      timeZone: "Australia/Sydney",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };

  const assigneeRefreshTokens = await getCalendarCredentialsList(task);

  const safeId = task.id
    .split("")
    .filter((c) => c !== "-")
    .join("");

  const promises = assigneeRefreshTokens.map(async (refreshTokens: string) => {
    const oauth2Client = new google.auth.OAuth2(
      GCP_CLIENT_ID,
      GCP_CLIENT_SECRET,
      GCP_REDIRECT_URL
    );
    oauth2Client.setCredentials({ refresh_token: refreshTokens });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    try {
      await calendar.events.insert({
        auth: oauth2Client,
        calendarId: "primary",
        requestBody: { ...event, id: safeId },
      });
    } catch (err) {
      try {
        await calendar.events.update({
          auth: oauth2Client,
          calendarId: "primary",
          eventId: safeId,
          requestBody: event,
        });
      } catch (err2) {
        // Do nothing
      }
    }
  });

  await Promise.all(promises);
}

export async function getUsersAllocatedToTask(
  task: Task
): Promise<Set<string>> {
  const taskAssignmentRepo = getConnection().getRepository(TaskAssignment);
  const taskAssignments = await taskAssignmentRepo.find({
    where: { task: task.id },
  });
  const userSet = new Set<string>();
  for (const taskAssignment of taskAssignments) {
    if (!userSet.has(taskAssignment.group_assignee)) {
      const user = taskAssignment.user_assignee as any;
      userSet.add(user.id);
    }
  }
  return userSet;
}
/*A function that retutns an array of calendar credentials of the assignees of the given task*/
export async function getCalendarCredentialsList(
  task: Task
): Promise<string[]> {
  const userSet = await getUsersAllocatedToTask(task);
  const calCreds = [] as Array<string>;
  const promises: Promise<void>[] = [];

  for (const userId of userSet) {
    promises.push(
      getCalendarCredential(userId).then((cred) => {
        if (cred) {
          calCreds.push(cred.refresh_token);
        }
      })
    );
  }

  await Promise.all(promises);

  return calCreds;
}
