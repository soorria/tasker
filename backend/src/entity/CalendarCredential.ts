import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("CalendarCredential")
export class CalendarCredential {
  @PrimaryColumn()
  user_id: string;

  @Column("text")
  access_token: string;

  @Column("text")
  refresh_token: string;
}
