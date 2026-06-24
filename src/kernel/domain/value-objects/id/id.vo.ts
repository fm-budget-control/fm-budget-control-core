declare const idBrand: unique symbol;

export class InvalidIdError extends TypeError {
  constructor(value: string) {
    super(`Invalid Id: "${value}"`);
    this.name = "InvalidIdError";
  }
}

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
    return value.length > 0;
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
