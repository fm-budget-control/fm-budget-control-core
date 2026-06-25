import { jest } from "@jest/globals";
import { RegisterUserUseCase } from "./register-user.use-case.js";
import { EmailAlreadyRegisteredError } from "./register-user.errors.js";
import { RegisterUserCommand } from "./register-user.command.js";
import { UserRepositoryPort } from "../../ports/user-repository.port.js";
import { AuthProviderPort } from "../../ports/auth-provider.port.js";
import { UserIdDeriverPort } from "../../ports/user-id-deriver.port.js";
import { UserId } from "../../../domain/value-objects/index.js";
import { Id } from "../../../../kernel/domain/value-objects/index.js";

describe("RegisterUserUseCase", () => {
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let authProvider: jest.Mocked<AuthProviderPort>;
  let userIdDeriver: jest.Mocked<UserIdDeriverPort>;
  let useCase: RegisterUserUseCase;

  const derivedId: UserId = Id.of<"User">(
    "b94f6f125179506e18ede0af38a7b3c44c3f4b8b40efceae50a3f77b22c8c7d2",
  );

  const validCommand: RegisterUserCommand = {
    fullName: "Fabio Reis",
    email: "fabio@example.com",
    birthDate: "1990-01-01",
    password: "P@ssw0rd1",
  };

  beforeEach(() => {
    userRepository = {
      existsById: jest.fn<UserRepositoryPort["existsById"]>(),
      save: jest.fn<UserRepositoryPort["save"]>(),
    };
    authProvider = {
      accountExistsById: jest.fn<AuthProviderPort["accountExistsById"]>(),
      createAccount: jest.fn<AuthProviderPort["createAccount"]>(),
      updatePassword: jest.fn<AuthProviderPort["updatePassword"]>(),
    };
    userIdDeriver = {
      derive: jest.fn<UserIdDeriverPort["derive"]>(),
    };
    useCase = new RegisterUserUseCase(userRepository, authProvider, userIdDeriver);
  });

  describe("happy path", () => {
    beforeEach(() => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      userRepository.existsById.mockResolvedValue(false);
      authProvider.accountExistsById.mockResolvedValue(false);
      authProvider.createAccount.mockResolvedValue(undefined);
      userRepository.save.mockResolvedValue(undefined);
    });

    it("returns the id provided by the deriver", async () => {
      const id = await useCase.execute(validCommand);

      expect(id).toBe(derivedId);
    });

    it("derives the id from the parsed email", async () => {
      await useCase.execute(validCommand);

      expect(userIdDeriver.derive).toHaveBeenCalledTimes(1);
      expect(userIdDeriver.derive).toHaveBeenCalledWith(
        expect.objectContaining({ value: "fabio@example.com" }),
      );
    });

    it("checks db existence before writing anything", async () => {
      await useCase.execute(validCommand);

      expect(userRepository.existsById).toHaveBeenCalledWith(derivedId);
    });

    it("checks auth existence before calling createAccount", async () => {
      await useCase.execute(validCommand);

      expect(authProvider.accountExistsById).toHaveBeenCalledWith(derivedId);
    });

    it("calls createAccount with the derived id, parsed email, and password VO", async () => {
      await useCase.execute(validCommand);

      expect(authProvider.createAccount).toHaveBeenCalledWith(
        derivedId,
        expect.objectContaining({ value: "fabio@example.com" }),
        expect.anything(),
      );
    });

    it("calls save after createAccount", async () => {
      const order: string[] = [];
      authProvider.createAccount.mockImplementation(async () => { order.push("createAccount"); });
      userRepository.save.mockImplementation(async () => { order.push("save"); });

      await useCase.execute(validCommand);

      expect(order).toEqual(["createAccount", "save"]);
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

    it("throws when user is underage without calling save", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      userRepository.existsById.mockResolvedValue(false);
      authProvider.accountExistsById.mockResolvedValue(false);
      authProvider.createAccount.mockResolvedValue(undefined);

      await expect(
        useCase.execute({ ...validCommand, birthDate: "2020-01-01" }),
      ).rejects.toThrow("User must be at least 18 years old to register");

      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("email already registered", () => {
    beforeEach(() => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      userRepository.existsById.mockResolvedValue(true);
    });

    it("throws EmailAlreadyRegisteredError", async () => {
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        EmailAlreadyRegisteredError,
      );
    });

    it("does not call the auth provider or save", async () => {
      await expect(useCase.execute(validCommand)).rejects.toThrow();

      expect(authProvider.accountExistsById).not.toHaveBeenCalled();
      expect(authProvider.createAccount).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("recovery path (auth exists, db does not)", () => {
    beforeEach(() => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      userRepository.existsById.mockResolvedValue(false);
      authProvider.accountExistsById.mockResolvedValue(true);
      authProvider.updatePassword.mockResolvedValue(undefined);
      userRepository.save.mockResolvedValue(undefined);
    });

    it("skips createAccount and completes the db write", async () => {
      await useCase.execute(validCommand);

      expect(authProvider.createAccount).not.toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it("updates the password to honour the latest submission", async () => {
      await useCase.execute(validCommand);

      expect(authProvider.updatePassword).toHaveBeenCalledTimes(1);
      expect(authProvider.updatePassword).toHaveBeenCalledWith(
        derivedId,
        expect.anything(),
      );
    });

    it("updates the password before saving to db", async () => {
      const order: string[] = [];
      authProvider.updatePassword.mockImplementation(async () => { order.push("updatePassword"); });
      userRepository.save.mockImplementation(async () => { order.push("save"); });

      await useCase.execute(validCommand);

      expect(order).toEqual(["updatePassword", "save"]);
    });

    it("returns the derived id", async () => {
      const id = await useCase.execute(validCommand);

      expect(id).toBe(derivedId);
    });

    it("throws and does not call save when updatePassword fails", async () => {
      authProvider.updatePassword.mockRejectedValue(new Error("Auth unavailable"));

      await expect(useCase.execute(validCommand)).rejects.toThrow("Auth unavailable");

      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("auth provider failure", () => {
    it("throws and does not call save when createAccount fails", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      userRepository.existsById.mockResolvedValue(false);
      authProvider.accountExistsById.mockResolvedValue(false);
      authProvider.createAccount.mockRejectedValue(new Error("Auth unavailable"));

      await expect(useCase.execute(validCommand)).rejects.toThrow("Auth unavailable");

      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("repository failure", () => {
    it("throws when save fails", async () => {
      userIdDeriver.derive.mockResolvedValue(derivedId);
      userRepository.existsById.mockResolvedValue(false);
      authProvider.accountExistsById.mockResolvedValue(false);
      authProvider.createAccount.mockResolvedValue(undefined);
      userRepository.save.mockRejectedValue(new Error("DB unavailable"));

      await expect(useCase.execute(validCommand)).rejects.toThrow("DB unavailable");
    });
  });
});
