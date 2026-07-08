import { FullName, Email, Password } from "../../../domain/value-objects/index.js";
import { User } from "../../../domain/entities/user.entity.js";
import { IsoDate, IsoDateTime, Id } from "../../../../kernel/domain/value-objects/index.js";
import { HmacIdDeriverPort } from "../../../../kernel/application/ports/hmac-id-deriver.port.js";
import { UserRepositoryPort } from "../../ports/user-repository.port.js";
import { AuthProviderPort } from "../../ports/auth-provider.port.js";
import { RegisterUserCommand } from "./register-user.command.js";
import { EmailAlreadyRegisteredError } from "./register-user.errors.js";

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly authProvider: AuthProviderPort,
    private readonly userIdDeriver: HmacIdDeriverPort,
  ) {}

  async execute(command: RegisterUserCommand): Promise<string> {
    const fullName = FullName.parse(command.fullName);
    const email = Email.parse(command.email);
    const birthDate = IsoDate.parse(command.birthDate);
    const password = Password.of(command.password);

    const rawId = await this.userIdDeriver.derive(email.value);

    if (!Id.isValid(rawId)) {
      throw new TypeError(
        `HmacIdDeriverPort returned an invalid identifier: "${rawId}"`,
      );
    }

    const id = Id.of<"User">(rawId);

    const now = IsoDateTime.of(new Date().toISOString());

    const user = User.create({
      id,
      fullName,
      email,
      birthDate,
      createdAt: now,
      updatedAt: now,
    });

    // "email-already-exists" means a previous attempt created the auth
    // account but not the profile — resume by creating the profile.
    await this.authProvider.createAccount({
      id: user.id.value,
      email: user.email.value,
      password: password.revealForHashing(),
      displayName: user.fullName.value,
    });

    const profileResult = await this.userRepository.createProfile({
      id: user.id.value,
      fullName: user.fullName.value,
      email: user.email.value,
      birthDate: user.birthDate.value,
      createdAt: user.createdAt.value,
      updatedAt: user.updatedAt.value,
    });

    if (profileResult === "already-exists") {
      throw new EmailAlreadyRegisteredError();
    }

    return user.id.value;
  }
}
