import { User } from "./user.entity.js";
import { FullName, Email, UserId } from "../value-objects/index.js";
import { IsoDate, Id } from "../../../kernel/domain/value-objects/index.js";

describe("User", () => {
  const validId: UserId = Id.of<"User">(
    "550e8400-e29b-41d4-a716-446655440000",
  );
  const validFullName = FullName.of("Fabio Reis");
  const validEmail = Email.of("fabio@example.com");
  const adultBirthDate = IsoDate.of("2000-06-22");
  const referenceDate = IsoDate.of("2026-06-22");

  const baseParams = {
    id: validId,
    fullName: validFullName,
    email: validEmail,
    birthDate: adultBirthDate,
    createdAt: referenceDate,
    updatedAt: referenceDate,
  };

  describe("create", () => {
    it("creates a User when the user is over 18", () => {
      const user = User.create(baseParams);

      expect(user.id).toBe(validId);
      expect(user.fullName).toBe(validFullName);
      expect(user.email).toBe(validEmail);
      expect(user.birthDate).toBe(adultBirthDate);
    });

    it("creates a User when the user turns 18 exactly on the reference date", () => {
      const birthDate = IsoDate.of("2008-06-22");
      const reference = IsoDate.of("2026-06-22");

      expect(() =>
        User.create({ ...baseParams, birthDate, createdAt: reference }),
      ).not.toThrow();
    });

    it("throws when the user turns 18 the day after the reference date", () => {
      const birthDate = IsoDate.of("2008-06-23");
      const reference = IsoDate.of("2026-06-22");

      expect(() =>
        User.create({ ...baseParams, birthDate, createdAt: reference }),
      ).toThrow("User must be at least 18 years old to register");
    });

    it("throws when the user is 17", () => {
      const birthDate = IsoDate.of("2009-06-22");
      const reference = IsoDate.of("2026-06-22");

      expect(() =>
        User.create({ ...baseParams, birthDate, createdAt: reference }),
      ).toThrow(TypeError);
    });

    it("creates a User when birth month is earlier than the reference month in the 18th year", () => {
      const birthDate = IsoDate.of("2008-01-01");
      const reference = IsoDate.of("2026-06-22");

      expect(() =>
        User.create({ ...baseParams, birthDate, createdAt: reference }),
      ).not.toThrow();
    });

    it("throws when birth month is later than the reference month in the 18th year", () => {
      const birthDate = IsoDate.of("2008-12-01");
      const reference = IsoDate.of("2026-06-22");

      expect(() =>
        User.create({ ...baseParams, birthDate, createdAt: reference }),
      ).toThrow();
    });

    it("freezes the created instance", () => {
      const user = User.create(baseParams);

      expect(Object.isFrozen(user)).toBe(true);
    });
  });

  describe("updateName", () => {
    it("returns a new User with the updated name", () => {
      const user = User.create(baseParams);
      const newName = FullName.of("Fabio Santos");
      const updatedAt = IsoDate.of("2026-06-23");

      const updated = user.updateName(newName, updatedAt);

      expect(updated.fullName).toBe(newName);
      expect(updated.updatedAt).toBe(updatedAt);
    });

    it("does not mutate the original instance", () => {
      const user = User.create(baseParams);
      const newName = FullName.of("Fabio Santos");

      user.updateName(newName, IsoDate.of("2026-06-23"));

      expect(user.fullName).toBe(validFullName);
    });

    it("preserves all other fields", () => {
      const user = User.create(baseParams);
      const newName = FullName.of("Fabio Santos");
      const updatedAt = IsoDate.of("2026-06-23");

      const updated = user.updateName(newName, updatedAt);

      expect(updated.id).toBe(user.id);
      expect(updated.email).toBe(user.email);
      expect(updated.birthDate).toBe(user.birthDate);
      expect(updated.createdAt).toBe(user.createdAt);
    });

    it("freezes the returned instance", () => {
      const user = User.create(baseParams);
      const updated = user.updateName(
        FullName.of("Fabio Santos"),
        IsoDate.of("2026-06-23"),
      );

      expect(Object.isFrozen(updated)).toBe(true);
    });
  });

  describe("updateEmail", () => {
    it("returns a new User with the updated email", () => {
      const user = User.create(baseParams);
      const newEmail = Email.of("fabio.reis@example.com");
      const updatedAt = IsoDate.of("2026-06-23");

      const updated = user.updateEmail(newEmail, updatedAt);

      expect(updated.email).toBe(newEmail);
      expect(updated.updatedAt).toBe(updatedAt);
    });

    it("does not mutate the original instance", () => {
      const user = User.create(baseParams);
      const newEmail = Email.of("fabio.reis@example.com");

      user.updateEmail(newEmail, IsoDate.of("2026-06-23"));

      expect(user.email).toBe(validEmail);
    });

    it("preserves all other fields", () => {
      const user = User.create(baseParams);
      const newEmail = Email.of("fabio.reis@example.com");
      const updatedAt = IsoDate.of("2026-06-23");

      const updated = user.updateEmail(newEmail, updatedAt);

      expect(updated.id).toBe(user.id);
      expect(updated.fullName).toBe(user.fullName);
      expect(updated.birthDate).toBe(user.birthDate);
      expect(updated.createdAt).toBe(user.createdAt);
    });

    it("freezes the returned instance", () => {
      const user = User.create(baseParams);
      const updated = user.updateEmail(
        Email.of("fabio.reis@example.com"),
        IsoDate.of("2026-06-23"),
      );

      expect(Object.isFrozen(updated)).toBe(true);
    });
  });

  describe("equals", () => {
    it("returns true for two Users with the same id", () => {
      const user = User.create(baseParams);
      const sameIdDifferentName = User.create({
        ...baseParams,
        fullName: FullName.of("Different Name"),
      });

      expect(user.equals(sameIdDifferentName)).toBe(true);
    });

    it("returns false for two Users with different ids", () => {
      const user = User.create(baseParams);
      const otherUser = User.create({
        ...baseParams,
        id: Id.of<"User">("7c9e6679-7425-40de-944b-e07fc1f90ae7"),
      });

      expect(user.equals(otherUser)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const user = User.create(baseParams);

      expect(user.equals(null)).toBe(false);
    });

    it("returns false when compared to undefined", () => {
      const user = User.create(baseParams);

      expect(user.equals(undefined)).toBe(false);
    });

    it("returns false when compared to a structurally similar non-User object", () => {
      const user = User.create(baseParams);

      expect(user.equals({ id: user.id })).toBe(false);
    });
  });
});
