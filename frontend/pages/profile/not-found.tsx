import { Container, makeStyles, Typography, fade } from "@material-ui/core";

import Title from "../../components/shared/Title";
import Spacing from "../../components/shared/Spacing";
import { GetServerSideProps } from "next";

interface ProfilePageProps {
  email?: string | null;
  id?: string | null;
}

const useStyles = makeStyles((theme) => ({
  heading: {
    fontWeight: "bold",
    marginBotton: theme.spacing(1),
    textAlign: "center",
  },
  textCenter: {
    textAlign: "center",
  },
  invalid: {
    padding: "2px 4px",
    borderRadius: theme.shape.borderRadius,
    background: fade(theme.palette.common.black, 0.1),
  },
}));

const ProfilePage: React.FC<ProfilePageProps> = ({ email, id }) => {
  const classes = useStyles();

  return (
    <Container>
      <Title>Profile Not Found</Title>
      <Spacing y={4} />
      <Typography variant="h4" component="h1" className={classes.heading}>
        Profile Not Found
      </Typography>
      <Spacing y={4} />
      {email && (
        <Typography className={classes.textCenter}>
          There is no user with the email{" "}
          <code className={classes.invalid}>{email}</code>.
        </Typography>
      )}
      {id && (
        <Typography className={classes.textCenter}>
          There is no user with the id{" "}
          <code className={classes.invalid}>{id}</code>.
        </Typography>
      )}
    </Container>
  );
};

export default ProfilePage;

export const getServerSideProps: GetServerSideProps<ProfilePageProps> = async ({
  query,
  res,
}) => {
  const email = typeof query.email === "string" ? query.email : null;
  const id = typeof query.id === "string" ? query.id : null;

  res.statusCode = 404;
  res.statusMessage = "Profile Not Found";

  return {
    props: {
      email,
      id,
    },
  };
};
