declare const idBrand: unique symbol;

export class InvalidIdError extends TypeError {
  constructor(value: string) {
    super(`Invalid Id: "${value}"`);
    this.name = "InvalidIdError";
  }
}

/**
 * Opaque phantom-branded identifier.
 *
 * Accepts any non-empty, non-whitespace-only string. No format, length, or
 * case constraints are applied. `equals` compares values with strict equality,
 * so comparison is case-sensitive. If the underlying identifier system is
 * case-insensitive (e.g. UUID columns), normalise to a canonical form before
 * constructing an Id — that is the adapter's responsibility, not the domain's.
 */
export class Id<TBrand = unknown> {
  declare private readonly [idBrand]: TBrand;

  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  static of<TBrand = unknown>(value: string): Id<TBrand> {
    if (!Id.isValid(value)) {
      throw new InvalidIdError(value);
    }

    return new Id<TBrand>(value);
  }

  static parse<TBrand = unknown>(value: string): Id<TBrand> {
    const normalized = Id.normalize(value);

    if (!Id.isValid(normalized)) {
      throw new InvalidIdError(value);
    }

    return new Id<TBrand>(normalized);
  }

  static tryParse<TBrand = unknown>(value: string): Id<TBrand> | null {
    const normalized = Id.normalize(value);

    if (!Id.isValid(normalized)) {
      return null;
    }

    return new Id<TBrand>(normalized);
  }

  static isValid(value: string): boolean {
    return value.trim().length > 0;
  }

  private static normalize(value: string): string {
    return value.trim();
  }

  equals(other: unknown): boolean {
    return other instanceof Id && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
