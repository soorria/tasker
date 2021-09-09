import NextLink from "next/link";
import { makeStyles, TextField, Link, Button } from "@material-ui/core";
import { FormEventHandler } from "react";

import AuthWrapper from "../components/auth/AuthWrapper";
import { signup, SignupInput } from "../api";
import { useAuthContext } from "../context/AuthContext";
import { useLoggedInRedirect } from "../hooks/useLoggedInRedirect";
import { useState } from "react";
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

const SignUpPage: React.FC = () => {
  const classes = useStyles();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setToken } = useAuthContext();

  useLoggedInRedirect();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    event.preventDefault();

    // do signup stuff
    const signupArgs = Object.fromEntries(
      new FormData(event.currentTarget)
    ) as SignupInput;

    const { data, error } = await signup(signupArgs);
    if (error) {
      setError(error.message);
    } else {
      setToken(data!.token);
    }
    setLoading(false);
  };

  return (
    <AuthWrapper title="Sign Up to Tasker">
      <form className={classes.form} onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          id="first-name"
          name="first_name"
          type="text"
          required
          label="First Name"
          autoComplete="given-name"
        />
        <TextField
          id="last-name"
          name="last_name"
          type="text"
          required
          label="Last Name"
          autoComplete="family-name"
        />
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
          autoComplete="new-password"
        />
        <TextField
          id="confirm-password"
          name="confirm-password"
          type="password"
          required
          label="Confirm Password"
          autoComplete="new-password"
        />
        <div className={classes.footer}>
          <NextLink href="/login" passHref>
            <Link>Already have an account? Login!</Link>
          </NextLink>
          <Button
            size="large"
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
          >
            Sign Up
          </Button>
        </div>
      </form>
    </AuthWrapper>
  );
};

export default SignUpPage;
