export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
};
