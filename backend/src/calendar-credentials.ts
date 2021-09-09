/*
File to create calendar ts

Written by Jocelyn Hing 27 June
*/
import { CalendarCredential } from "./entity/CalendarCredential";
import { User } from "./entity/User";
import { getConnection } from "typeorm";
import { ApiError } from "./errors";
import { google } from "googleapis";

const GCP_CLIENT_ID = process.env.GCP_CLIENT_ID;
const GCP_CLIENT_SECRET = process.env.GCP_CLIENT_SECRET;
const GCP_REDIRECT_URL = process.env.GCP_REDIRECT_URL;

const oauth2Client = new google.auth.OAuth2(
  GCP_CLIENT_ID,
  GCP_CLIENT_SECRET,
  GCP_REDIRECT_URL
);

/* function to create and store CalendarCredential in database*/
export async function createCalendarCredential(
  user: User,
  googleCode: string
): Promise<any> {
  //decode the string
  const { tokens } = await oauth2Client.getToken(googleCode);
  oauth2Client.setCredentials(tokens);
  const calendarCredentialRepo =
    getConnection().getRepository(CalendarCredential);

  if (
    await calendarCredentialRepo.findOne({
      where: [{ user_id: user.id }],
    })
  ) {
    throw new ApiError(
      "create_calendar_credential/calendar_credential_exists",
      "Calendar credential already exists"
    );
  }
  const calendarCredential = new CalendarCredential();
  calendarCredential.user_id = user.id;
  calendarCredential.refresh_token = tokens.refresh_token;
  calendarCredential.access_token = tokens.access_token;

  await getConnection().manager.save(calendarCredential);
}

/* function to get CalendarCredential in database*/

export async function getCalendarCredential(
  userId: string
): Promise<CalendarCredential> {
  const calCredRepo = await getConnection().getRepository(CalendarCredential);
  const calCred = await calCredRepo.findOne({ where: { user_id: userId } });
  return calCred;
}

export const hasCalendarCredential = async (
  userId: string
): Promise<boolean> => {
  const cred = await getCalendarCredential(userId);
  return !!cred;
};

export const deleteCalendarCredential = async (
  userId: string
): Promise<void> => {
  const credRepo = getConnection().getRepository(CalendarCredential);
  await credRepo.delete({ user_id: userId });
};
