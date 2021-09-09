import { makeStyles, Paper, Typography } from "@material-ui/core";
import Title from "../shared/Title";

interface AuthWrapperProps {
  title: string;
}

const useStyles = makeStyles((theme) => ({
  root: {
    flex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: "#eee",
  },
  container: {
    padding: theme.spacing(6),
    width: "100%",
    maxWidth: theme.breakpoints.values.sm + "px",
  },
  heading: {
    textAlign: "center",
    marginBottom: theme.spacing(3),
  },
}));

const AuthWrapper: React.FC<AuthWrapperProps> = ({ title, children }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Title>{title}</Title>
      <Paper className={classes.container}>
        <Typography className={classes.heading} variant="h2" component="h1">
          {title}
        </Typography>
        {children}
      </Paper>
    </div>
  );
};

export default AuthWrapper;
