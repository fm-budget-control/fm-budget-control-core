import type { UserId } from "../../domain/value-objects/index.js";
import type { Email } from "../../domain/value-objects/index.js";
import type { Password } from "../../domain/value-objects/index.js";

export interface AuthProviderPort {
  accountExistsById(id: UserId): Promise<boolean>;
  createAccount(id: UserId, email: Email, password: Password): Promise<void>;
  updatePassword(id: UserId, password: Password): Promise<void>;
}
