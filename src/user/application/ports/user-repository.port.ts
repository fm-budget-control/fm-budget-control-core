import type { UserId } from "../../domain/value-objects/index.js";
import type { User } from "../../domain/entities/user.entity.js";

export interface UserRepositoryPort {
  existsById(id: UserId): Promise<boolean>;
  save(user: User): Promise<void>;
}
