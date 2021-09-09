import { google } from "googleapis";
import { User } from "../entity/User";
import { getConnection } from "typeorm";
import { createCalendarCredential } from "../calendar-credentials";
import { decodeJWTPayload } from "../users/users-helpers";

const GCP_CLIENT_ID = process.env.GCP_CLIENT_ID;
const GCP_CLIENT_SECRET = process.env.GCP_CLIENT_SECRET;
const GCP_REDIRECT_URL = process.env.GCP_REDIRECT_URL;

const oauth2Client = new google.auth.OAuth2(
  GCP_CLIENT_ID,
  GCP_CLIENT_SECRET,
  GCP_REDIRECT_URL
);

//Generates the link for the client to start the auth process.
export function generateAuthUrl(): string {
  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",
    prompt: "consent",
    // Only get GoogelCalendar scopes
    scope: "https://www.googleapis.com/auth/calendar",
  });
  return url;
}

//Handler for the /oauth2callback endpoint defined in index.ts
export async function saveOAuthToken(
  googleCode: string,
  jwt: string
): Promise<void> {
  // store the token
  const userRepo = getConnection().getRepository(User);
  const decodedJWT = await decodeJWTPayload(jwt);
  const user = await userRepo.findOne({ where: { id: decodedJWT.id } });
  await createCalendarCredential(user, googleCode);
}
