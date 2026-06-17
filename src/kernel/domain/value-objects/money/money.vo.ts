const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

export class InvalidCurrencyCodeError extends TypeError {
  constructor(value: string) {
    super(`Invalid currency code: "${value}"`);
    this.name = "InvalidCurrencyCodeError";
  }
}

export class InvalidMoneyError extends TypeError {
  constructor(value: number) {
    super(`Money minor units must be a safe integer: "${value}"`);
    this.name = "InvalidMoneyError";
  }
}

export class CurrencyMismatchError extends TypeError {
  constructor(left: CurrencyCode, right: CurrencyCode) {
    super(
      `Cannot operate on Money values with different currencies: "${left.value}" and "${right.value}"`,
    );
    this.name = "CurrencyMismatchError";
  }
}

/**
 * ISO-like currency code value object.
 *
 * This validates the structural shape of a currency code: three uppercase letters.
 * It does not decide which currencies the business supports.
 *
 * Supported currencies such as "BRL" or "USD" should be defined by the owning
 * business module, not by the kernel.
 */
export class CurrencyCode {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Strict factory for already-normalized currency codes.
   *
   * Does not trim or uppercase the input.
   */
  static of(value: string): CurrencyCode {
    if (!CurrencyCode.isValid(value)) {
      throw new InvalidCurrencyCodeError(value);
    }

    return new CurrencyCode(value);
  }

  /**
   * Boundary-friendly parser.
   *
   * Trims and uppercases the input before validating it.
   */
  static parse(value: string): CurrencyCode {
    const normalized = CurrencyCode.normalize(value);

    if (!CurrencyCode.isValid(normalized)) {
      throw new InvalidCurrencyCodeError(value);
    }

    return new CurrencyCode(normalized);
  }

  static tryParse(value: string): CurrencyCode | null {
    const normalized = CurrencyCode.normalize(value);

    if (!CurrencyCode.isValid(normalized)) {
      return null;
    }

    return new CurrencyCode(normalized);
  }

  static isValid(value: string): boolean {
    return CURRENCY_CODE_REGEX.test(value);
  }

  private static normalize(value: string): string {
    return value.trim().toUpperCase();
  }

  equals(other: unknown): boolean {
    return other instanceof CurrencyCode && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}

/**
 * Money value object.
 *
 * Represents a monetary value in minor units for a specific currency.
 *
 * Examples:
 * - BRL 10.00 -> minorUnits: 1000, currency: BRL
 * - USD 10.00 -> minorUnits: 1000, currency: USD
 *
 * This object intentionally does not know how many decimal places each currency has.
 * It stores already-calculated minor units.
 */
export class Money {
  private constructor(
    public readonly minorUnits: number,
    public readonly currency: CurrencyCode,
  ) {
    Object.freeze(this);
  }

  static of(params: { minorUnits: number; currency: CurrencyCode }): Money {
    if (!Money.isValidMinorUnits(params.minorUnits)) {
      throw new InvalidMoneyError(params.minorUnits);
    }

    return new Money(Money.normalizeMinorUnits(params.minorUnits), params.currency);
  }

  static parse(params: { minorUnits: number; currency: string }): Money {
    return Money.of({
      minorUnits: params.minorUnits,
      currency: CurrencyCode.parse(params.currency),
    });
  }

  static tryParse(params: { minorUnits: number; currency: string }): Money | null {
    const currency = CurrencyCode.tryParse(params.currency);

    if (currency === null || !Money.isValidMinorUnits(params.minorUnits)) {
      return null;
    }

    return new Money(Money.normalizeMinorUnits(params.minorUnits), currency);
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(0, currency);
  }

  static isValidMinorUnits(value: number): boolean {
    return Number.isSafeInteger(value);
  }

  private static normalizeMinorUnits(value: number): number {
    return Object.is(value, -0) ? 0 : value;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);

    return Money.of({
      minorUnits: this.minorUnits + other.minorUnits,
      currency: this.currency,
    });
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);

    return Money.of({
      minorUnits: this.minorUnits - other.minorUnits,
      currency: this.currency,
    });
  }

  isZero(): boolean {
    return this.minorUnits === 0;
  }

  isPositive(): boolean {
    return this.minorUnits > 0;
  }

  isNegative(): boolean {
    return this.minorUnits < 0;
  }

  equals(other: unknown): boolean {
    return (
      other instanceof Money &&
      this.minorUnits === other.minorUnits &&
      this.currency.equals(other.currency)
    );
  }

  toJSON(): { minorUnits: number; currency: string } {
    return {
      minorUnits: this.minorUnits,
      currency: this.currency.value,
    };
  }

  private assertSameCurrency(other: Money): void {
    if (!this.currency.equals(other.currency)) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}