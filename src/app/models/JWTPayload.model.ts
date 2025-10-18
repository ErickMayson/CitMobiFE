// src/app/models/jwt-payload.model.ts
export interface JWTPayload {
  iss: string;
  sub: string;
  role: string;
  operador?: string;
  exp: number;
}
