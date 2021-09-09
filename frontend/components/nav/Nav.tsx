import React from "react";
import Link from "next/link";
import {
  makeStyles,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Container,
  Typography,
  Tooltip,
} from "@material-ui/core";
import LinkIcon from "@material-ui/icons/Link";
import PersonIcon from "@material-ui/icons/Person";
import DoneAllIcon from "@material-ui/icons/DoneAll";
import TasksIcon from "@material-ui/icons/EventNote";

import { useAuthContext } from "../../context/AuthContext";
import ConnectionRequestsModal from "../connections/ConnectionsRequestsModal";
import { Button } from "@material-ui/core";
import { useLogout, useIncomingConnectionRequests } from "../../api";
import UserSearch from "./UserSearch";

const useStyles = makeStyles((theme) => ({
  toolbar: {
    display: "flex",
    "& > * + *": {
      marginLeft: theme.spacing(2),
    },
  },
  logo: {
    display: "flex",
    alignItems: "center",
    "& > * + *": {
      marginLeft: theme.spacing(0.5),
    },
  },
  grow: {
    flexGrow: 1,
  },
}));

type NavProps = {};

const Nav = ({}: NavProps) => {
  const [showConnectionsModal, setShowConnectionsModal] = React.useState(false);

  const { user } = useAuthContext();
  const logout = useLogout();

  const { data: incomingRequests } = useIncomingConnectionRequests();

  const classes = useStyles();

  return (
    <>
      <AppBar position="sticky">
        <Toolbar component={Container} className={classes.toolbar}>
          <div className={classes.logo}>
            <DoneAllIcon />
            <Typography component="p" variant="h5">
              Tasker
            </Typography>
          </div>
          <div className={classes.grow} />
          {user ? (
            <>
              <UserSearch />

              <Link href={`/tasks`} passHref>
                <Tooltip title="Your Tasks">
                  <IconButton href={`/tasks`} component="a" color="inherit">
                    <TasksIcon />
                  </IconButton>
                </Tooltip>
              </Link>

              <Tooltip title="Connection Requests">
                <IconButton
                  color="inherit"
                  onClick={() => setShowConnectionsModal(true)}
                >
                  <Badge
                    badgeContent={incomingRequests?.length || 0}
                    color="secondary"
                  >
                    <LinkIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Link href={`/profile/${user.id}`} passHref>
                <Tooltip title="Your Profile">
                  <IconButton
                    href={`/profile/${user.id}`}
                    component="a"
                    color="inherit"
                  >
                    <PersonIcon />
                  </IconButton>
                </Tooltip>
              </Link>

              <Button
                onClick={logout}
                variant="contained"
                color="primary"
                disableElevation
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button
                  component="a"
                  variant="contained"
                  color="primary"
                  disableElevation
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button
                  component="a"
                  variant="contained"
                  color="secondary"
                  disableElevation
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </Toolbar>
      </AppBar>
      {user && (
        <ConnectionRequestsModal
          open={showConnectionsModal}
          onClose={() => setShowConnectionsModal(false)}
        />
      )}
    </>
  );
};

export default Nav;
