if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("Missing 'NEXT_PUBLIC_API_URL' environment variable");
}

module.exports = {
  // This need to be off because Material-UI v4 uses deprecated things.
  reactStrictMode: false,
};
