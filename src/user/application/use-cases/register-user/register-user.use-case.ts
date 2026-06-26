import { FullName, Email, Password } from "../../../domain/value-objects/index.js";
import { User } from "../../../domain/entities/user.entity.js";
import { IsoDate, IsoDateTime, Id } from "../../../../kernel/domain/value-objects/index.js";
import { UserRepositoryPort } from "../../ports/user-repository.port.js";
import { AuthProviderPort } from "../../ports/auth-provider.port.js";
import { UserIdDeriverPort } from "../../ports/user-id-deriver.port.js";
import { RegisterUserCommand } from "./register-user.command.js";
import { EmailAlreadyRegisteredError } from "./register-user.errors.js";

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly authProvider: AuthProviderPort,
    private readonly userIdDeriver: UserIdDeriverPort,
  ) {}

  async execute(command: RegisterUserCommand): Promise<string> {
    const fullName = FullName.parse(command.fullName);
    const email = Email.parse(command.email);
    const birthDate = IsoDate.parse(command.birthDate);
    const password = Password.of(command.password);

    const rawId = await this.userIdDeriver.derive(email.value);

    if (!Id.isValid(rawId)) {
      throw new TypeError(
        `UserIdDeriverPort returned an invalid identifier: "${rawId}"`,
      );
    }

    const id = Id.of<"User">(rawId);

    if (await this.userRepository.existsById(rawId)) {
      throw new EmailAlreadyRegisteredError();
    }

    const now = IsoDateTime.of(new Date().toISOString());

    const user = User.create({
      id,
      fullName,
      email,
      birthDate,
      createdAt: now,
      updatedAt: now,
    });

    const authExists = await this.authProvider.accountExistsById(rawId);

    if (authExists) {
      await this.authProvider.updatePassword(rawId, password.revealForHashing());
    } else {
      await this.authProvider.createAccount(rawId, email.value, password.revealForHashing());
    }

    await this.userRepository.save({
      id: user.id.value,
      fullName: user.fullName.value,
      email: user.email.value,
      birthDate: user.birthDate.value,
      createdAt: user.createdAt.value,
      updatedAt: user.updatedAt.value,
    });

    return user.id.value;
  }
}
