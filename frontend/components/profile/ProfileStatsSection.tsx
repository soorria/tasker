import { makeStyles, Paper, Typography } from "@material-ui/core";
import { useProfileStats } from "../../api";
import { User } from "../../types";
import CountUp from "./CountUp";

interface ProfileStatsSectionProps {
  user: User;
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    padding: theme.spacing(3),
    boxShadow: theme.shadows[3],
    minHeight: theme.spacing(14),
    display: "flex",
    alignItems: "center",
  },
}));

const ProfileStatsSection: React.FC<ProfileStatsSectionProps> = ({ user }) => {
  const classes = useStyles();
  const { data: stats } = useProfileStats(user.id);

  return (
    <Paper className={classes.wrapper}>
      {!stats && (
        <Typography component="p" variant="h5">
          Loading {user.first_name}&apos;s stats.
        </Typography>
      )}
      {stats && (
        <Typography component="p" variant="h5">
          {user.first_name} is <CountUp to={stats.businessThisWeek} /> busy this
          week.
        </Typography>
      )}
    </Paper>
  );
};

export default ProfileStatsSection;
