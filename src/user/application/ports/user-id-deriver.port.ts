import type { Email } from "../../domain/value-objects/index.js";
import type { UserId } from "../../domain/value-objects/index.js";

export interface UserIdDeriverPort {
  derive(email: Email): Promise<UserId>;
}
