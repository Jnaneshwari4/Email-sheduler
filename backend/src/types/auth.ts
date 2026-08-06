export type JwtUserPayload = {
  userId: string;
  email: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
};
