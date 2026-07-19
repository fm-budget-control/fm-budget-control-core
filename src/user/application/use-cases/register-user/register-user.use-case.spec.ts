import { jest } from "@jest/globals";
import { RegisterUserUseCase } from "./register-user.use-case.js";
import { EmailAlreadyRegisteredError } from "./register-user.errors.js";
import { RegisterUserCommand } from "./register-user.command.js";
import { UserRepositoryPort } from "../../ports/user-repository.port.js";
import { AuthProviderPort } from "../../ports/auth-provider.port.js";
import { HmacIdDeriverPort } from "../../../../kernel/application/ports/hmac-id-deriver.port.js";
import { UnderageUserError } from "../../../domain/errors/underage-user.error.js";

describe("RegisterUserUseCase", () => {
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let authProvider: jest.Mocked<AuthProviderPort>;
  let userIdDeriver: jest.Mocked<HmacIdDeriverPort>;
  let useCase: RegisterUserUseCase;

  const derivedId = "b94f6f125179506e18ede0af38a7b3c44c3f4b8b40efceae50a3f77b22c8c7d2";

  const validCommand: RegisterUserCommand = {
    fullName: "Fabio Reis",
    email: "fabio@example.com",
    birthDate: "1990-01-01",
    password: "P@ssw0rd1",
  };

  beforeEach(() => {
    userRepository = {
      createProfile: jest.fn<UserRepositoryPort["createProfile"]>(),
    };
    authProvider = {
      createAccount: jest.fn<AuthProviderPort["createAccount"]>(),
    };
    userIdDeriver = {
      derive: jest.fn<HmacIdDeriverPort["derive"]>(),
    };
    useCase = new RegisterUserUseCase(userRepository, authProvider, userIdDeriver);
  });

  describe("happy path", () => {
    beforeEach(() => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      authProvider.createAccount.mockResolvedValue({ status: "created", uid: derivedId });
      userRepository.createProfile.mockResolvedValue("created");
    });

    it("returns the derived id as a string", async () => {
      const id = await useCase.execute(validCommand);

      expect(id).toBe(derivedId);
    });

    it("derives the id from the normalised email value", async () => {
      await useCase.execute(validCommand);

      expect(userIdDeriver.derive).toHaveBeenCalledWith("fabio@example.com");
    });

    it("calls createAccount with plain string values and the full name as displayName", async () => {
      await useCase.execute(validCommand);

      expect(authProvider.createAccount).toHaveBeenCalledWith({
        id: derivedId,
        email: "fabio@example.com",
        password: "P@ssw0rd1",
        displayName: "Fabio Reis",
      });
    });

    it("calls createProfile with the user record", async () => {
      await useCase.execute(validCommand);

      expect(userRepository.createProfile).toHaveBeenCalledWith({
        id: derivedId,
        fullName: "Fabio Reis",
        email: "fabio@example.com",
        birthDate: "1990-01-01",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("calls createProfile after createAccount", async () => {
      const order: string[] = [];
      authProvider.createAccount.mockImplementation(async () => {
        order.push("createAccount");
        return { status: "created", uid: derivedId };
      });
      userRepository.createProfile.mockImplementation(async () => {
        order.push("createProfile");
        return "created";
      });

      await useCase.execute(validCommand);

      expect(order).toEqual(["createAccount", "createProfile"]);
    });
  });

  describe("input validation", () => {
    it("throws when fullName is invalid without calling any port", async () => {
      await expect(
        useCase.execute({ ...validCommand, fullName: "X" }),
      ).rejects.toThrow();

      expect(userIdDeriver.derive).not.toHaveBeenCalled();
    });

    it("throws when email is invalid without calling any port", async () => {
      await expect(
        useCase.execute({ ...validCommand, email: "not-an-email" }),
      ).rejects.toThrow();

      expect(userIdDeriver.derive).not.toHaveBeenCalled();
    });

    it("throws when birthDate is invalid without calling any port", async () => {
      await expect(
        useCase.execute({ ...validCommand, birthDate: "not-a-date" }),
      ).rejects.toThrow();

      expect(userIdDeriver.derive).not.toHaveBeenCalled();
    });

    it("throws when password is invalid without calling any port", async () => {
      await expect(
        useCase.execute({ ...validCommand, password: "weak" }),
      ).rejects.toThrow();

      expect(userIdDeriver.derive).not.toHaveBeenCalled();
    });

    it("trims whitespace from fullName", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      authProvider.createAccount.mockResolvedValue({ status: "created", uid: derivedId });
      userRepository.createProfile.mockResolvedValue("created");

      await expect(
        useCase.execute({ ...validCommand, fullName: "  Fabio Reis  " }),
      ).resolves.toBeDefined();
    });

    it("trims whitespace from birthDate", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      authProvider.createAccount.mockResolvedValue({ status: "created", uid: derivedId });
      userRepository.createProfile.mockResolvedValue("created");

      await expect(
        useCase.execute({ ...validCommand, birthDate: "  1990-01-01  " }),
      ).resolves.toBeDefined();
    });

    it("throws when user is underage without calling any port", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);

      await expect(
        useCase.execute({ ...validCommand, birthDate: "2020-01-01" }),
      ).rejects.toThrow(UnderageUserError);

      expect(authProvider.createAccount).not.toHaveBeenCalled();
      expect(userRepository.createProfile).not.toHaveBeenCalled();
    });
  });

  describe("invalid id from deriver", () => {
    it("throws TypeError when deriver returns an empty string", async () => {
      userIdDeriver.derive.mockResolvedValue("");

      await expect(useCase.execute(validCommand)).rejects.toThrow(TypeError);
      expect(authProvider.createAccount).not.toHaveBeenCalled();
    });

    it("throws TypeError when deriver returns a whitespace-only string", async () => {
      userIdDeriver.derive.mockResolvedValue("   ");

      await expect(useCase.execute(validCommand)).rejects.toThrow(TypeError);
      expect(authProvider.createAccount).not.toHaveBeenCalled();
    });
  });

  describe("resume path (auth account exists, profile does not)", () => {
    beforeEach(() => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      authProvider.createAccount.mockResolvedValue({
        status: "email-already-exists",
        uid: derivedId,
      });
      userRepository.createProfile.mockResolvedValue("created");
    });

    it("continues past the existing auth account and creates the profile", async () => {
      await useCase.execute(validCommand);

      expect(userRepository.createProfile).toHaveBeenCalledTimes(1);
    });

    it("returns the derived id", async () => {
      const id = await useCase.execute(validCommand);

      expect(id).toBe(derivedId);
    });

    it("creates the profile under the existing account's uid when it differs from the derived id", async () => {
      authProvider.createAccount.mockResolvedValue({
        status: "email-already-exists",
        uid: "legacy-uid",
      });

      await useCase.execute(validCommand);

      expect(userRepository.createProfile).toHaveBeenCalledWith(
        expect.objectContaining({ id: "legacy-uid" }),
      );
    });

    it("returns the existing account's uid when it differs from the derived id", async () => {
      authProvider.createAccount.mockResolvedValue({
        status: "email-already-exists",
        uid: "legacy-uid",
      });

      const id = await useCase.execute(validCommand);

      expect(id).toBe("legacy-uid");
    });
  });

  describe("email already registered (profile exists)", () => {
    beforeEach(() => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      userRepository.createProfile.mockResolvedValue("already-exists");
    });

    it("throws EmailAlreadyRegisteredError when the auth account was just created", async () => {
      authProvider.createAccount.mockResolvedValue({ status: "created", uid: derivedId });

      await expect(useCase.execute(validCommand)).rejects.toThrow(
        EmailAlreadyRegisteredError,
      );
    });

    it("throws EmailAlreadyRegisteredError when the auth account already existed", async () => {
      authProvider.createAccount.mockResolvedValue({
        status: "email-already-exists",
        uid: derivedId,
      });

      await expect(useCase.execute(validCommand)).rejects.toThrow(
        EmailAlreadyRegisteredError,
      );
    });

    it("throws EmailAlreadyRegisteredError when the profile already exists under the existing account's uid", async () => {
      authProvider.createAccount.mockResolvedValue({
        status: "email-already-exists",
        uid: "legacy-uid",
      });

      await expect(useCase.execute(validCommand)).rejects.toThrow(
        EmailAlreadyRegisteredError,
      );
    });
  });

  describe("auth provider failure", () => {
    it("throws and does not call createProfile when createAccount fails", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      authProvider.createAccount.mockRejectedValue(new Error("Auth unavailable"));

      await expect(useCase.execute(validCommand)).rejects.toThrow("Auth unavailable");

      expect(userRepository.createProfile).not.toHaveBeenCalled();
    });
  });

  describe("repository failure", () => {
    it("throws when createProfile fails", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      authProvider.createAccount.mockResolvedValue({ status: "created", uid: derivedId });
      userRepository.createProfile.mockRejectedValue(new Error("DB unavailable"));

      await expect(useCase.execute(validCommand)).rejects.toThrow("DB unavailable");
    });
  });
});
