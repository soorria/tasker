import { Task } from "../entity/Task";
import { getConnection } from "typeorm";
import { google } from "googleapis";
import { getCalendarCredentialsList } from "./calendar-create-event";

const GCP_CLIENT_ID = process.env.GCP_CLIENT_ID;
const GCP_CLIENT_SECRET = process.env.GCP_CLIENT_SECRET;
const GCP_REDIRECT_URL = process.env.GCP_REDIRECT_URL;

export async function deleteTaskFromCalendar(task_id: string): Promise<void> {
  // find user's calendar's credentials
  const taskRepo = getConnection().getRepository(Task);
  const task = await taskRepo.findOne({ where: { id: task_id } });

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
      await calendar.events.delete({
        auth: oauth2Client,
        calendarId: "primary",
        eventId: safeId,
      });
    } catch (err) {
      // Do nothing
    }
  });

  await Promise.all(promises);
}
