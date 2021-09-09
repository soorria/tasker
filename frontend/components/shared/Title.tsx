import Head from "next/head";

const Title: React.FC = ({ children }) => {
  return (
    <Head>
      <title>{children}</title>
    </Head>
  );
};

export default Title;
