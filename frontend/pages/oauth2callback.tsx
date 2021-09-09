import {
  CircularProgress,
  Container,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { GetServerSideProps } from "next";
import router, { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSaveOAuthCode } from "../api/oauth";
import Spacing from "../components/shared/Spacing";
import Title from "../components/shared/Title";
import { useAuthContext } from "../context/AuthContext";

type OAuthCallbackProps =
  | { code: string; error: null }
  | { code: null; error: string };

const useStyles = makeStyles((theme) => ({
  heading: {
    fontWeight: "bold",
    marginBotton: theme.spacing(1),
    textAlign: "center",
  },
  textCenter: {
    textAlign: "center",
  },
}));

const OAuthCallbackPage: React.FC<OAuthCallbackProps> = ({
  code,
  error: _error,
}) => {
  const classes = useStyles();
  const { push } = useRouter();
  const { user, token } = useAuthContext();
  const saveOAuthCode = useSaveOAuthCode();
  const [error, setError] = useState(_error);

  useEffect(() => {
    setError(_error);
  }, [_error]);

  useEffect(() => {
    if (error) return;

    if (user && code) {
      saveOAuthCode(code).then(async (response) => {
        await new Promise((res) => setTimeout(res, 10000));
        if (response.error) {
          setError(response.error.message);
        } else {
          router.push(`/profile/${user.id}`);
        }
      });
    } else if (!user && !token) {
      router.push("/login");
    }
  }, [push, user, token, code, error, saveOAuthCode]);

  return (
    <Container>
      <Title>Saving Calendar Integration</Title>
      <Spacing y={4} />
      <Typography variant="h4" component="h1" className={classes.heading}>
        {error
          ? "An error occurred while connecting to your calendar"
          : "Saving your Calendar Integration"}
      </Typography>
      <Spacing y={4} />
      {error ? (
        <Typography className={classes.textCenter}>
          This error occured when connecting to your calendar: {error}
        </Typography>
      ) : (
        <div className={classes.textCenter}>
          <CircularProgress />
        </div>
      )}
    </Container>
  );
};

export default OAuthCallbackPage;

export const getServerSideProps: GetServerSideProps<OAuthCallbackProps> =
  async ({ query }) => {
    const code = typeof query.code === "string" ? query.code : null;
    const error = typeof query.error === "string" ? query.error : null;

    if (error) {
      return {
        props: { code: null, error },
      };
    }

    if (!code) {
      return {
        props: { code: null, error: "Invalid Code" },
      };
    }

    return {
      props: { code, error: null },
    };
  };
