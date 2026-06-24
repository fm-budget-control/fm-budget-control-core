import type { UserId } from "../value-objects/index.js";
import { FullName, Email } from "../value-objects/index.js";
import { IsoDate } from "../../../kernel/domain/value-objects/index.js";

/**
 * Minimum age, in years, required to register. Enforced on creation only —
 * birthDate is not currently mutable, so re-validation on update is not
 * needed yet. If an `updateBirthDate` method is ever added, it must run
 * the same check `create` does.
 */
const MINIMUM_AGE_YEARS = 18;

export class User {
  private constructor(
    public readonly id: UserId,
    public readonly fullName: FullName,
    public readonly email: Email,
    public readonly birthDate: IsoDate,
    public readonly createdAt: IsoDate,
    public readonly updatedAt: IsoDate,
  ) {
    Object.freeze(this);
  }

  static reconstitute(params: {
    id: UserId;
    fullName: FullName;
    email: Email;
    birthDate: IsoDate;
    createdAt: IsoDate;
    updatedAt: IsoDate;
  }): User {
    return new User(
      params.id,
      params.fullName,
      params.email,
      params.birthDate,
      params.createdAt,
      params.updatedAt,
    );
  }

  static create(params: {
    id: UserId;
    fullName: FullName;
    email: Email;
    birthDate: IsoDate;
    createdAt: IsoDate;
    updatedAt: IsoDate;
  }): User {
    if (!User.isAbove18(params.birthDate)) {
      throw new TypeError("User must be at least 18 years old to register");
    }

    return new User(
      params.id,
      params.fullName,
      params.email,
      params.birthDate,
      params.createdAt,
      params.updatedAt,
    );
  }

  updateName(newName: FullName, updatedAt: IsoDate): User {
    return new User(
      this.id,
      newName,
      this.email,
      this.birthDate,
      this.createdAt,
      updatedAt,
    );
  }

  updateEmail(newEmail: Email, updatedAt: IsoDate): User {
    return new User(
      this.id,
      this.fullName,
      newEmail,
      this.birthDate,
      this.createdAt,
      updatedAt,
    );
  }

  /**
   * Identity equality — two Users are equal if they represent the same
   * aggregate, regardless of which fields currently differ in value.
   */
  equals(other: unknown): boolean {
    return other instanceof User && this.id.equals(other.id);
  }

  private static isAbove18(birthDate: IsoDate): boolean {
    const birth = birthDate.toUTCDate();
    const today = new Date();
    const age = today.getUTCFullYear() - birth.getUTCFullYear();

    if (age > MINIMUM_AGE_YEARS) return true;
    if (age < MINIMUM_AGE_YEARS) return false;

    // Clamp birth day to the last day of the birth month in the current year
    // so that Feb 29 birthdays are treated as Feb 28 in non-leap years.
    const lastDayOfBirthMonth = new Date(
      Date.UTC(today.getUTCFullYear(), birth.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const effectiveBirthDay = Math.min(birth.getUTCDate(), lastDayOfBirthMonth);

    const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
    const dayDiff = today.getUTCDate() - effectiveBirthDay;

    return monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0);
  }
}
