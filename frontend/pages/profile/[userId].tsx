import Link from "next/link";
import { GetServerSideProps } from "next";
import { useState } from "react";
import {
  Container,
  makeStyles,
  Avatar,
  Typography,
  Button,
  Paper,
  Tooltip,
  IconButton,
} from "@material-ui/core";
import CalendarToday from "@material-ui/icons/CalendarToday";

import { ConnectionStatus, User } from "../../types";
import ConnectionButton from "../../components/profile/ConnectionButton";
import UpdateProfileModal from "../../components/profile/UpdateProfileModal";
import Title from "../../components/shared/Title";
import {
  fetchProfile,
  UpdateProfileInput,
  useConnectionStatus,
  useDeleteConnection,
  useRequestConnection,
  useUpdateProfile,
  useUserProfile,
  useUserTasks,
} from "../../api";
import { useAuthContext } from "../../context/AuthContext";
import TaskListItem from "../../components/task/TaskListItem";
import Stack from "../../components/shared/Stack";
import Spacing from "../../components/shared/Spacing";
import { useRouter } from "next/router";
import ProfileStatsSection from "../../components/profile/ProfileStatsSection";
import AuthoriseGCal from "../../components/gcal/AuthoriseGCal";

// const EXAMPLE_USER: User = {
//   id: "b59aa143-5e1c-46af-b05c-85908324e097",
//   email: "soorria.ss@gmail.com",
//   first_name: "Soorria",
//   last_name: "Saruva",
//   avatar_url: "https://mooth.tech/logo.svg",
// };

interface ProfilePageProps {
  profile: User;
}

const useStyles = makeStyles((theme) => ({
  userDetailsWrapper: {
    display: "flex",
    alignItems: "center",
    "& > * + *": {
      marginLeft: theme.spacing(3),
    },
  },
  name: {
    fontWeight: "bold",
    marginBotton: theme.spacing(1),
  },
  userDetails: {
    flex: "1 0",
  },
  avatar: {
    width: 100,
    height: 100,
  },
  textCenter: {
    textAlign: "center",
  },
  tasksHeading: {
    marginBottom: theme.spacing(3),
  },
  bioText: {
    whiteSpace: "pre",
  },
  bioWrapper: {
    padding: theme.spacing(3),
  },
  profileActions: {
    display: "flex",
    alignItems: "center",
    "& > * + *": {
      marginLeft: theme.spacing(1),
    },
  },
}));

const ProfilePage: React.FC<ProfilePageProps> = ({
  profile: initialProfile,
}) => {
  const router = useRouter();
  const classes = useStyles();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(initialProfile.id, initialProfile);

  const profileId = profile!.id;
  const { data: connectionStatus } = useConnectionStatus(profileId);

  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const isProfileOfLoggedInUser = !!user && user.id === profileId;
  const showTasksAndStats = isProfileOfLoggedInUser || isConnected;

  const { data: tasks } = useUserTasks(
    showTasksAndStats ? profileId : undefined
  );

  const requestConnection = useRequestConnection();
  const deleteConnection = useDeleteConnection();

  const updateProfile = useUpdateProfile();

  const handleConnectionButtonClick = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (connectionStatus === ConnectionStatus.UNCONNECTED) {
      await requestConnection(profileId);
    } else {
      await deleteConnection(profileId);
    }
  };

  const handleProfileSave = async (changes: UpdateProfileInput) => {
    const { error } = await updateProfile(changes);
    if (error) {
      throw new Error(error.message);
    }
  };

  // TODO: Figure out a better way to handle this
  // * NB: This shouldn't happen since we should be getting a profile on the server
  if (!profile) return null;

  const userName = `${profile.first_name} ${profile.last_name}`;

  return (
    <Container>
      <Title>{`${userName}'s Profile`}</Title>
      <Spacing y={4} />
      <div className={classes.userDetailsWrapper}>
        <div>
          <Avatar
            alt={userName}
            src={profile.avatar_url}
            className={classes.avatar}
          />
        </div>
        <div className={classes.userDetails}>
          <Typography variant="h4" component="h1" className={classes.name}>
            {userName}
          </Typography>
          <Typography>{profile.email}</Typography>
        </div>
        <div className={classes.profileActions}>
          {isProfileOfLoggedInUser && (
            <>
              <AuthoriseGCal />
              <Button
                onClick={() => setShowUpdateModal((p) => !p)}
                color="primary"
                variant="contained"
              >
                Edit Profile
              </Button>
            </>
          )}
          {user && !isProfileOfLoggedInUser && (
            <ConnectionButton
              status={connectionStatus ?? ConnectionStatus.UNCONNECTED}
              onClick={handleConnectionButtonClick}
            />
          )}
        </div>
      </div>

      {profile?.bio?.trim() && (
        <>
          <Spacing y={6} />
          <Typography
            variant="h5"
            component="h2"
            className={classes.tasksHeading}
          >
            About {profile.first_name}
          </Typography>
          <Paper elevation={3} className={classes.bioWrapper}>
            <Typography className={classes.bioText}>{profile.bio}</Typography>
          </Paper>
        </>
      )}

      <Spacing y={6} />

      {user && showTasksAndStats && (
        <>
          <ProfileStatsSection user={profile} />
          <Spacing y={6} />
          <Typography
            variant="h5"
            component="h2"
            className={classes.tasksHeading}
          >
            {profile.first_name}&apos;s Tasks
          </Typography>
          <Stack spacing={2}>
            {tasks?.map((task) => (
              <TaskListItem
                task={task}
                key={task.id}
                isEditable={task.creator.id === user?.id}
              />
            ))}
            {tasks?.length === 0 && (
              <Typography className={classes.textCenter}>
                {profile.first_name} hasn&apos;t been assigned any tasks yet.
              </Typography>
            )}
          </Stack>
        </>
      )}

      {user && !showTasksAndStats && (
        <Typography className={classes.textCenter}>
          Connect to see this user&apos;s tasks and stats.
        </Typography>
      )}

      {!user && (
        <Typography className={classes.textCenter}>
          <Link href="/login">
            <a>Log in</a>
          </Link>{" "}
          and connect to see this user&apos;s tasks and stats.
        </Typography>
      )}

      <UpdateProfileModal
        open={showUpdateModal}
        currentProfile={profile}
        onSave={handleProfileSave}
        onClose={() => setShowUpdateModal(false)}
      />
      <Spacing y={30} />
    </Container>
  );
};

export default ProfilePage;

export const getServerSideProps: GetServerSideProps<
  ProfilePageProps,
  { userId: string }
> = async ({ params }) => {
  const profile = await fetchProfile(params!.userId);
  if (!profile) {
    return {
      redirect: {
        destination: `/profile/not-found?id=${encodeURIComponent(
          params!.userId
        )}`,
        permanent: false,
      },
    };
  }
  return {
    props: { profile },
  };
};
