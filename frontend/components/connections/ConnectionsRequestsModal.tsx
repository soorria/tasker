import React from "react";
import NextLink from "next/link";
import {
  makeStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Typography,
  Link,
} from "@material-ui/core";

import {
  useAcceptConnection,
  useDeclineConnection,
  useDeleteConnection,
  useIncomingConnectionRequests,
  useOutgoingConnectionRequests,
} from "../../api";
import Spacing from "../shared/Spacing";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    "& > * + *": {
      marginTop: theme.spacing(1),
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
  userActions: {
    display: "flex",
    alignItems: "center",
    "& > * + *": {
      marginLeft: theme.spacing(0.5),
    },
  },
  textCenter: {
    textAlign: "center",
  },
  grow: {
    flex: "1 0",
  },
}));

type ConnectionsModalProps = {
  open: boolean;
  onClose: () => void;
};

const ConnectionsModal = ({ open, onClose }: ConnectionsModalProps) => {
  const { data: incomingRequests } = useIncomingConnectionRequests();
  const { data: outgoingRequests } = useOutgoingConnectionRequests();

  const acceptConnection = useAcceptConnection();
  const declineConnection = useDeclineConnection();
  const deleteConnection = useDeleteConnection();

  const classes = useStyles();

  if (!incomingRequests || !outgoingRequests) {
    return null;
  }

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>Connection Requests</DialogTitle>
      <DialogContent className={classes.root}>
        <Typography variant="subtitle1" component="h3">
          Incoming Requests
        </Typography>
        {incomingRequests.length === 0 && (
          <Typography variant="body2" className={classes.textCenter}>
            No Incoming requests
          </Typography>
        )}
        {incomingRequests.map((request) => (
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
                color="primary"
                variant="contained"
                onClick={() => acceptConnection(request.id)}
              >
                Accept
              </Button>
              <Button
                size="medium"
                onClick={() => declineConnection(request.id)}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
        <Spacing y={3} />
        <Typography variant="subtitle1" component="h3">
          Outgoing Requests
        </Typography>
        {outgoingRequests.length === 0 && (
          <Typography variant="body2" className={classes.textCenter}>
            No Outgoing Requests
          </Typography>
        )}
        {outgoingRequests.map((request) => (
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
                Cancel Request
              </Button>
            </div>
          </div>
        ))}
        <Spacing y={2} />
        <Typography className={classes.textCenter}>
          <NextLink href="/connections" passHref>
            <Link onClick={() => onClose()}>See all your connections</Link>
          </NextLink>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          size="large"
          color="primary"
          variant="contained"
          onClick={() => onClose()}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionsModal;
