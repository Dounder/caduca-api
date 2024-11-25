export interface JwtPayload {
  id: string;
}

export interface AuthResponse {
  token: string;
  user: any;
}

export interface SignedToken extends JwtPayload {
  iat: number;
  exp: number;
}
