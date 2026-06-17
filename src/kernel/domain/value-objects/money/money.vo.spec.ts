import {
  CurrencyCode,
  CurrencyMismatchError,
  InvalidCurrencyCodeError,
  InvalidMoneyError,
  Money,
} from "./money.vo.js";

describe("CurrencyCode", () => {
  describe("of", () => {
    it("creates a currency code from a canonical uppercase 3-letter code", () => {
      const currency = CurrencyCode.of("BRL");

      expect(currency.value).toBe("BRL");
    });

    it("does not normalize lowercase values", () => {
      expect(() => CurrencyCode.of("brl")).toThrow(InvalidCurrencyCodeError);
    });

    it("does not trim surrounding whitespace", () => {
      expect(() => CurrencyCode.of(" BRL ")).toThrow(InvalidCurrencyCodeError);
    });

    it("throws when value has fewer than 3 letters", () => {
      expect(() => CurrencyCode.of("BR")).toThrow(InvalidCurrencyCodeError);
    });

    it("throws when value has more than 3 letters", () => {
      expect(() => CurrencyCode.of("BRLL")).toThrow(InvalidCurrencyCodeError);
    });

    it("throws when value contains numbers", () => {
      expect(() => CurrencyCode.of("B1L")).toThrow(InvalidCurrencyCodeError);
    });

    it("throws when value contains symbols", () => {
      expect(() => CurrencyCode.of("B-L")).toThrow(InvalidCurrencyCodeError);
    });

    it("throws with a helpful message", () => {
      expect(() => CurrencyCode.of("brl")).toThrow(
        'Invalid currency code: "brl"',
      );
    });
  });

  describe("parse", () => {
    it("creates a currency code from a canonical value", () => {
      const currency = CurrencyCode.parse("BRL");

      expect(currency.value).toBe("BRL");
    });

    it("normalizes lowercase values to uppercase", () => {
      const currency = CurrencyCode.parse("brl");

      expect(currency.value).toBe("BRL");
    });

    it("trims surrounding whitespace", () => {
      const currency = CurrencyCode.parse("  usd  ");

      expect(currency.value).toBe("USD");
    });

    it("throws using the original invalid value in the message", () => {
      expect(() => CurrencyCode.parse("  B1L  ")).toThrow(
        'Invalid currency code: "  B1L  "',
      );
    });
  });

  describe("tryParse", () => {
    it("returns a currency code when value is valid after normalization", () => {
      const currency = CurrencyCode.tryParse(" eur ");

      expect(currency).toBeInstanceOf(CurrencyCode);
      expect(currency?.value).toBe("EUR");
    });

    it("returns null when value is invalid", () => {
      expect(CurrencyCode.tryParse("B1L")).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for canonical uppercase 3-letter values", () => {
      expect(CurrencyCode.isValid("BRL")).toBe(true);
      expect(CurrencyCode.isValid("USD")).toBe(true);
      expect(CurrencyCode.isValid("EUR")).toBe(true);
    });

    it("returns false for lowercase values", () => {
      expect(CurrencyCode.isValid("brl")).toBe(false);
    });

    it("returns false for values with surrounding whitespace", () => {
      expect(CurrencyCode.isValid(" BRL ")).toBe(false);
    });

    it("returns false for non-3-letter values", () => {
      expect(CurrencyCode.isValid("BR")).toBe(false);
      expect(CurrencyCode.isValid("BRLL")).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true when currency codes are equal", () => {
      const left = CurrencyCode.of("BRL");
      const right = CurrencyCode.of("BRL");

      expect(left.equals(right)).toBe(true);
    });

    it("returns false when currency codes are different", () => {
      const left = CurrencyCode.of("BRL");
      const right = CurrencyCode.of("USD");

      expect(left.equals(right)).toBe(false);
    });

    it("returns false for null and undefined", () => {
      const currency = CurrencyCode.of("BRL");

      expect(currency.equals(null)).toBe(false);
      expect(currency.equals(undefined)).toBe(false);
    });

    it("returns false for structurally similar objects", () => {
      const currency = CurrencyCode.of("BRL");

      expect(currency.equals({ value: "BRL" })).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns the currency code string", () => {
      const currency = CurrencyCode.of("BRL");

      expect(currency.toString()).toBe("BRL");
      expect(String(currency)).toBe("BRL");
    });
  });

  describe("toJSON", () => {
    it("serializes as the currency code string", () => {
      const currency = CurrencyCode.of("BRL");

      expect(currency.toJSON()).toBe("BRL");
      expect(JSON.stringify({ currency })).toBe('{"currency":"BRL"}');
    });
  });

  describe("immutability", () => {
    it("freezes the currency code instance", () => {
      const currency = CurrencyCode.of("BRL");

      expect(Object.isFrozen(currency)).toBe(true);
    });

    it("does not allow value reassignment at runtime", () => {
      const currency = CurrencyCode.of("BRL");

      expect(() => {
        Object.defineProperty(currency, "value", {
          value: "USD",
        });
      }).toThrow();

      expect(currency.value).toBe("BRL");
    });
  });

  describe("InvalidCurrencyCodeError", () => {
    it("extends TypeError", () => {
      const error = new InvalidCurrencyCodeError("invalid");

      expect(error).toBeInstanceOf(TypeError);
    });

    it("sets the error name", () => {
      const error = new InvalidCurrencyCodeError("invalid");

      expect(error.name).toBe("InvalidCurrencyCodeError");
    });
  });
});

describe("Money", () => {
  const brl = CurrencyCode.of("BRL");
  const usd = CurrencyCode.of("USD");

  describe("of", () => {
    it("creates money from minor units and currency", () => {
      const money = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      expect(money.minorUnits).toBe(1000);
      expect(money.currency).toBe(brl);
    });

    it("accepts zero minor units", () => {
      const money = Money.of({
        minorUnits: 0,
        currency: brl,
      });

      expect(money.minorUnits).toBe(0);
      expect(money.isZero()).toBe(true);
    });

    it("normalizes negative zero to zero", () => {
      const money = Money.of({
        minorUnits: -0,
        currency: brl,
      });

      expect(money.minorUnits).toBe(0);
      expect(Object.is(money.minorUnits, -0)).toBe(false);
    });

    it("accepts negative values", () => {
      const money = Money.of({
        minorUnits: -1000,
        currency: brl,
      });

      expect(money.minorUnits).toBe(-1000);
      expect(money.isNegative()).toBe(true);
    });

    it("throws when minor units are not an integer", () => {
      expect(() =>
        Money.of({
          minorUnits: 10.5,
          currency: brl,
        }),
      ).toThrow(InvalidMoneyError);
    });

    it("throws when minor units are NaN", () => {
      expect(() =>
        Money.of({
          minorUnits: Number.NaN,
          currency: brl,
        }),
      ).toThrow(InvalidMoneyError);
    });

    it("throws when minor units are Infinity", () => {
      expect(() =>
        Money.of({
          minorUnits: Infinity,
          currency: brl,
        }),
      ).toThrow(InvalidMoneyError);
    });

    it("throws when minor units are not a safe integer", () => {
      expect(() =>
        Money.of({
          minorUnits: Number.MAX_SAFE_INTEGER + 1,
          currency: brl,
        }),
      ).toThrow(InvalidMoneyError);
    });

    it("throws with a helpful message", () => {
      expect(() =>
        Money.of({
          minorUnits: 10.5,
          currency: brl,
        }),
      ).toThrow('Money minor units must be a safe integer: "10.5"');
    });
  });

  describe("parse", () => {
    it("creates money from raw minor units and raw currency", () => {
      const money = Money.parse({
        minorUnits: 1000,
        currency: "BRL",
      });

      expect(money.minorUnits).toBe(1000);
      expect(money.currency.value).toBe("BRL");
    });

    it("normalizes raw currency input", () => {
      const money = Money.parse({
        minorUnits: 1000,
        currency: " usd ",
      });

      expect(money.currency.value).toBe("USD");
    });

    it("throws when currency is invalid", () => {
      expect(() =>
        Money.parse({
          minorUnits: 1000,
          currency: "B1L",
        }),
      ).toThrow(InvalidCurrencyCodeError);
    });

    it("throws when minor units are invalid", () => {
      expect(() =>
        Money.parse({
          minorUnits: 10.5,
          currency: "BRL",
        }),
      ).toThrow(InvalidMoneyError);
    });
  });

  describe("tryParse", () => {
    it("returns money when raw input is valid", () => {
      const money = Money.tryParse({
        minorUnits: 1000,
        currency: " brl ",
      });

      expect(money).toBeInstanceOf(Money);
      expect(money?.minorUnits).toBe(1000);
      expect(money?.currency.value).toBe("BRL");
    });

    it("returns null when currency is invalid", () => {
      const money = Money.tryParse({
        minorUnits: 1000,
        currency: "B1L",
      });

      expect(money).toBeNull();
    });

    it("returns null when minor units are invalid", () => {
      const money = Money.tryParse({
        minorUnits: 10.5,
        currency: "BRL",
      });

      expect(money).toBeNull();
    });
  });

  describe("zero", () => {
    it("creates zero money for the given currency", () => {
      const money = Money.zero(brl);

      expect(money.minorUnits).toBe(0);
      expect(money.currency.equals(brl)).toBe(true);
      expect(money.isZero()).toBe(true);
    });
  });

  describe("isValidMinorUnits", () => {
    it("returns true for safe integers", () => {
      expect(Money.isValidMinorUnits(0)).toBe(true);
      expect(Money.isValidMinorUnits(1000)).toBe(true);
      expect(Money.isValidMinorUnits(-1000)).toBe(true);
      expect(Money.isValidMinorUnits(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(Money.isValidMinorUnits(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it("returns true for negative zero because it is representable and normalized by of", () => {
      expect(Money.isValidMinorUnits(-0)).toBe(true);
    });

    it("returns false for unsafe or non-integer values", () => {
      expect(Money.isValidMinorUnits(10.5)).toBe(false);
      expect(Money.isValidMinorUnits(Number.NaN)).toBe(false);
      expect(Money.isValidMinorUnits(Infinity)).toBe(false);
      expect(Money.isValidMinorUnits(-Infinity)).toBe(false);
      expect(Money.isValidMinorUnits(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    });
  });

  describe("add", () => {
    it("adds money with the same currency", () => {
      const left = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 250,
        currency: brl,
      });

      const result = left.add(right);

      expect(result.minorUnits).toBe(1250);
      expect(result.currency.equals(brl)).toBe(true);
    });

    it("throws when adding money with different currencies", () => {
      const left = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 250,
        currency: usd,
      });

      expect(() => left.add(right)).toThrow(CurrencyMismatchError);
    });

    it("throws when the addition result is not a safe integer", () => {
      const left = Money.of({
        minorUnits: Number.MAX_SAFE_INTEGER,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 1,
        currency: brl,
      });

      expect(() => left.add(right)).toThrow(InvalidMoneyError);
    });
  });

  describe("subtract", () => {
    it("subtracts money with the same currency", () => {
      const left = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 250,
        currency: brl,
      });

      const result = left.subtract(right);

      expect(result.minorUnits).toBe(750);
      expect(result.currency.equals(brl)).toBe(true);
    });

    it("allows negative subtraction results", () => {
      const left = Money.of({
        minorUnits: 250,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const result = left.subtract(right);

      expect(result.minorUnits).toBe(-750);
      expect(result.isNegative()).toBe(true);
    });

    it("throws when subtracting money with different currencies", () => {
      const left = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 250,
        currency: usd,
      });

      expect(() => left.subtract(right)).toThrow(CurrencyMismatchError);
    });

    it("throws when the subtraction result is not a safe integer", () => {
      const left = Money.of({
        minorUnits: Number.MIN_SAFE_INTEGER,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 1,
        currency: brl,
      });

      expect(() => left.subtract(right)).toThrow(InvalidMoneyError);
    });
  });

  describe("sign checks", () => {
    it("identifies zero money", () => {
      const money = Money.of({
        minorUnits: 0,
        currency: brl,
      });

      expect(money.isZero()).toBe(true);
      expect(money.isPositive()).toBe(false);
      expect(money.isNegative()).toBe(false);
    });

    it("identifies positive money", () => {
      const money = Money.of({
        minorUnits: 1,
        currency: brl,
      });

      expect(money.isZero()).toBe(false);
      expect(money.isPositive()).toBe(true);
      expect(money.isNegative()).toBe(false);
    });

    it("identifies negative money", () => {
      const money = Money.of({
        minorUnits: -1,
        currency: brl,
      });

      expect(money.isZero()).toBe(false);
      expect(money.isPositive()).toBe(false);
      expect(money.isNegative()).toBe(true);
    });
  });

  describe("equals", () => {
    it("returns true when minor units and currency are equal", () => {
      const left = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 1000,
        currency: CurrencyCode.of("BRL"),
      });

      expect(left.equals(right)).toBe(true);
    });

    it("returns false when minor units are different", () => {
      const left = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 999,
        currency: brl,
      });

      expect(left.equals(right)).toBe(false);
    });

    it("returns false when currencies are different", () => {
      const left = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 1000,
        currency: usd,
      });

      expect(left.equals(right)).toBe(false);
    });

    it("returns true when comparing negative zero and zero after normalization", () => {
      const left = Money.of({
        minorUnits: -0,
        currency: brl,
      });

      const right = Money.of({
        minorUnits: 0,
        currency: brl,
      });

      expect(left.equals(right)).toBe(true);
    });

    it("returns false for null and undefined", () => {
      const money = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      expect(money.equals(null)).toBe(false);
      expect(money.equals(undefined)).toBe(false);
    });

    it("returns false for structurally similar objects", () => {
      const money = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      expect(
        money.equals({
          minorUnits: 1000,
          currency: "BRL",
        }),
      ).toBe(false);
    });
  });

  describe("toJSON", () => {
    it("serializes as minor units and currency string", () => {
      const money = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      expect(money.toJSON()).toEqual({
        minorUnits: 1000,
        currency: "BRL",
      });

      expect(JSON.stringify({ amount: money })).toBe(
        '{"amount":{"minorUnits":1000,"currency":"BRL"}}',
      );
    });
  });

  describe("immutability", () => {
    it("freezes the money instance", () => {
      const money = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      expect(Object.isFrozen(money)).toBe(true);
    });

    it("does not allow minor units reassignment at runtime", () => {
      const money = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      expect(() => {
        Object.defineProperty(money, "minorUnits", {
          value: 2000,
        });
      }).toThrow();

      expect(money.minorUnits).toBe(1000);
    });

    it("does not allow currency reassignment at runtime", () => {
      const money = Money.of({
        minorUnits: 1000,
        currency: brl,
      });

      expect(() => {
        Object.defineProperty(money, "currency", {
          value: usd,
        });
      }).toThrow();

      expect(money.currency.equals(brl)).toBe(true);
    });
  });

  describe("CurrencyMismatchError", () => {
    it("extends TypeError", () => {
      const error = new CurrencyMismatchError(brl, usd);

      expect(error).toBeInstanceOf(TypeError);
    });

    it("sets the error name", () => {
      const error = new CurrencyMismatchError(brl, usd);

      expect(error.name).toBe("CurrencyMismatchError");
    });

    it("includes both currencies in the error message", () => {
      const error = new CurrencyMismatchError(brl, usd);

      expect(error.message).toBe(
        'Cannot operate on Money values with different currencies: "BRL" and "USD"',
      );
    });
  });

  describe("InvalidMoneyError", () => {
    it("extends TypeError", () => {
      const error = new InvalidMoneyError(10.5);

      expect(error).toBeInstanceOf(TypeError);
    });

    it("sets the error name", () => {
      const error = new InvalidMoneyError(10.5);

      expect(error.name).toBe("InvalidMoneyError");
    });

    it("includes the invalid value in the error message", () => {
      const error = new InvalidMoneyError(10.5);

      expect(error.message).toBe(
        'Money minor units must be a safe integer: "10.5"',
      );
    });
  });
});