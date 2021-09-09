import NextLink from "next/link";
import { makeStyles, TextField, Link, Button } from "@material-ui/core";
import { FormEventHandler, useState } from "react";

import AuthWrapper from "../components/auth/AuthWrapper";
import { useAuthContext } from "../context/AuthContext";
import { login } from "../api";
import { useLoggedInRedirect } from "../hooks/useLoggedInRedirect";
import { Alert } from "@material-ui/lab";

const useStyles = makeStyles((theme) => ({
  form: {
    "& > * + *": {
      marginTop: theme.spacing(3),
    },
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));

const LoginPage: React.FC = () => {
  const classes = useStyles();
  const { setToken } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useLoggedInRedirect();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const { data, error } = await login(
      formData.get("email") as string,
      formData.get("password") as string
    );
    if (error) {
      setError(error.message);
    } else {
      setToken(data!.token);
    }
    setLoading(false);
  };

  return (
    <AuthWrapper title="Login">
      <form className={classes.form} onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          id="email"
          name="email"
          type="email"
          required
          label="Email"
          autoComplete="email"
        />
        <TextField
          id="password"
          name="password"
          type="password"
          required
          label="Password"
          autoComplete="current-password"
        />
        <div className={classes.footer}>
          <NextLink href="/signup" passHref>
            <Link>Don&apos;t have an account? Sign Up!</Link>
          </NextLink>
          <Button
            size="large"
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
          >
            Login
          </Button>
        </div>
      </form>
    </AuthWrapper>
  );
};

export default LoginPage;
