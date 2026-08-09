import type { Id } from "../../../../kernel/domain/value-objects/index.js";

/**
 * Branded identifier for User entities.
 *
 * A plain type alias over the kernel's phantom-branded `Id<TBrand>` —
 * there's no separate class here because `Id` already provides the
 * branding and parsing behavior. `UserId` exists purely so call sites
 * read `UserId` instead of `Id<"User">` everywhere.
 *
 * INTERNAL. `Id` is not part of this package's published API — the export
 * map exposes only `./user/application`, `./user/ports`, and `./kernel/ports`,
 * all of which traffic in plain strings. Consumers never construct a `UserId`;
 * the use case derives it internally.
 *
 * Inside this package, construct with `Id.of<"User">(value)` /
 * `Id.parse<"User">(value)`, never `as UserId`. A bare cast bypasses the
 * validation `Id.of`/`parse` perform and defeats the purpose of phantom
 * branding — TypeScript would accept it, but nothing would have checked
 * the value is actually valid.
 */
export type UserId = Id<"User">;
