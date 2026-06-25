import type { Email, UserId } from "../../domain/value-objects/index.js";

export interface UserIdDeriverPort {
  derive(email: Email): Promise<UserId>;
}
