import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { ThemeProvider, CssBaseline, makeStyles } from "@material-ui/core";
import { SWRConfig } from "swr";

import { swrFetcher } from "../api/utils";
import { AuthContextProvider } from "../context/AuthContext";
import Nav from "../components/nav/Nav";
import theme from "../theme";

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  const classes = useStyles();

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement!.removeChild(jssStyles);
    }
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SWRConfig value={{ fetcher: swrFetcher }}>
          <AuthContextProvider>
            <div className={classes.wrapper}>
              <Nav />
              <Component {...pageProps} />
            </div>
          </AuthContextProvider>
        </SWRConfig>
      </ThemeProvider>
    </>
  );
}
export default MyApp;
