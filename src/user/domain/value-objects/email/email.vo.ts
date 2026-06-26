const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;
const MAX_DOMAIN_LENGTH = 253;
const MAX_DOMAIN_LABEL_LENGTH = 63;

const LOCAL_PART_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export class InvalidEmailError extends TypeError {
  constructor(value: string) {
    super(`Invalid email address: "${value}"`);
    this.name = "InvalidEmailError";
  }
}

export class Email {
  private constructor(private readonly props: { readonly value: string }) {
    Object.freeze(this);
  }

  get value(): string {
    return this.props.value;
  }

  static of(value: string): Email {
    if (!Email.isValid(value)) {
      throw new InvalidEmailError(value);
    }

    return new Email({ value });
  }

  static parse(value: string): Email {
    const normalizedValue = Email.normalize(value);

    if (!Email.isValid(normalizedValue)) {
      throw new InvalidEmailError(value);
    }

    return new Email({ value: normalizedValue });
  }

  static tryParse(value: string): Email | null {
    const normalized = Email.normalize(value);

    if (!Email.isValid(normalized)) {
      return null;
    }

    return new Email({ value: normalized });
  }

  static isValid(value: string): boolean {
    if (value.length === 0 || value.length > MAX_EMAIL_LENGTH) {
      return false;
    }

    if (value !== Email.normalize(value)) {
      return false;
    }

    const atIndex = value.indexOf("@");

    if (atIndex <= 0 || atIndex !== value.lastIndexOf("@")) {
      return false;
    }

    const localPart = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1);

    if (!Email.isValidLocalPart(localPart)) {
      return false;
    }

    if (!Email.isValidDomain(domain)) {
      return false;
    }

    return true;
  }

  equals(other: unknown): boolean {
    return other instanceof Email && other.value === this.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  private static normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private static isValidLocalPart(localPart: string): boolean {
    if (localPart.length === 0 || localPart.length > MAX_LOCAL_PART_LENGTH) {
      return false;
    }

    if (!LOCAL_PART_REGEX.test(localPart)) {
      return false;
    }

    if (
      localPart.startsWith(".") ||
      localPart.endsWith(".") ||
      localPart.includes("..")
    ) {
      return false;
    }

    return true;
  }

  private static isValidDomain(domain: string): boolean {
    if (domain.length === 0 || domain.length > MAX_DOMAIN_LENGTH) {
      return false;
    }

    const labels = domain.split(".");

    if (labels.length < 2) {
      return false;
    }

    return labels.every((label) => {
      return (
        label.length > 0 &&
        label.length <= MAX_DOMAIN_LABEL_LENGTH &&
        DOMAIN_LABEL_REGEX.test(label)
      );
    });
  }
}
