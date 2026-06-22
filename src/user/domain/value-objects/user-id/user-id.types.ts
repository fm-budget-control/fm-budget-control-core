import type { Uuid } from "../../../../kernel/domain/value-objects/index.js";

/**
 * Branded identifier for User entities.
 *
 * A plain type alias over the kernel's phantom-branded `Uuid<TBrand>` —
 * there's no separate class here because `Uuid` already provides the
 * branding, validation, and parsing behavior. `UserId` exists purely so
 * call sites read `UserId` instead of `Uuid<"User">` everywhere.
 *
 * Construct with `Uuid.of<"User">(value)` / `Uuid.parse<"User">(value)`,
 * never `as UserId`. A bare cast bypasses the validation `Uuid.of`/`parse`
 * perform and defeats the purpose of phantom branding — TypeScript would
 * accept it, but nothing would have checked the value is actually a valid
 * UUID.
 */
export type UserId = Uuid<"User">;
