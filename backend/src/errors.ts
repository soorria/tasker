class ApiError extends Error {
  constructor(public code: string, public message: string) {
    super(message);
  }
}

export { ApiError };
