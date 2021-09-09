import {
  Avatar,
  Button,
  Container,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Link from "@material-ui/icons/Link";
import { useConnectedUsers, useDeleteConnection } from "../api";
import Spacing from "../components/shared/Spacing";
import Title from "../components/shared/Title";

const useStyles = makeStyles((theme) => ({
  heading: {
    fontWeight: "bold",
    marginBotton: theme.spacing(1),
    textAlign: "center",
  },
  textCenter: {
    textAlign: "center",
  },
  grow: {
    flex: "1 0",
  },
  userActions: {
    display: "flex",
    alignItems: "center",
    "& > * + *": {
      marginLeft: theme.spacing(0.5),
    },
  },
  user: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    "& > * + *": {
      marginLeft: theme.spacing(2),
    },
  },
  avatar: {
    width: 60,
    height: 60,
  },
  connectionList: {
    maxWidth: theme.breakpoints.values.md,
    margin: "0 auto",
    "& > * + *": {
      marginTop: theme.spacing(1),
    },
  },
  icon: {
    verticalAlign: "middle",
    width: "1em",
    height: "1em",
  },
}));

const ConnectionsPage: React.FC = () => {
  const classes = useStyles();

  const { data: connectedUsers } = useConnectedUsers();

  const deleteConnection = useDeleteConnection();

  return (
    <Container>
      <Title>Your Connections</Title>
      <Spacing y={4} />
      <Typography variant="h4" component="h1" className={classes.heading}>
        Your Connections
      </Typography>
      <Spacing y={4} />
      {!connectedUsers && (
        <Typography className={classes.textCenter}>
          Loading your connections
        </Typography>
      )}
      {connectedUsers && (
        <>
          <Typography className={classes.textCenter}>
            Manage your connection requests with the{" "}
            <Link className={classes.icon} /> button in the header.
          </Typography>
          <Spacing y={4} />
          {connectedUsers.length ? (
            <div className={classes.connectionList}>
              {connectedUsers.map((request) => (
                <div key={request.id} className={classes.user}>
                  <Avatar
                    alt={request.email}
                    src={request.avatar_url}
                    className={classes.avatar}
                  />
                  <div>
                    <Typography>{`${request.first_name} ${request.last_name}`}</Typography>
                    <Typography variant="caption">{request.email}</Typography>
                  </div>
                  <div className={classes.grow} />
                  <div className={classes.userActions}>
                    <Button
                      size="medium"
                      onClick={() => deleteConnection(request.id)}
                    >
                      Delete Connection
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Typography className={classes.textCenter} variant="body2">
              You haven&apos;t connected with anyone yet!
            </Typography>
          )}
        </>
      )}
    </Container>
  );
};

export default ConnectionsPage;
