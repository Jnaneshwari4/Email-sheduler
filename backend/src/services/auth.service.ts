import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { UserRepository } from "../repositories/user.repository";
import { type JwtUserPayload } from "../types/auth";

export class AuthService {
  private readonly oauthClient: OAuth2Client;
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    this.userRepository = userRepository;
  }

  async loginWithGoogleIdToken(idToken: string): Promise<{
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  }> {
    const ticket = await this.oauthClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.name) {
      throw new AppError("Invalid Google token payload", 401);
    }

    const user = await this.userRepository.upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: payload.picture
    });

    const accessToken = this.signJwt({
      userId: user.id,
      email: user.email
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    };
  }

  verifyAccessToken(token: string): JwtUserPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }
  }

  private signJwt(payload: JwtUserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1d"
    });
  }
}
