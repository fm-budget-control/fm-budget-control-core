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

    // The derived id only mints genuinely NEW accounts. "email-already-exists"
    // means the email already owns an auth account (a previous attempt that
    // died before creating the profile, or an imported/legacy account); that
    // account's uid is the source of truth, so the profile is created under it
    // and it is the id returned to the caller.
    const account = await this.authProvider.createAccount({
      id: user.id.value,
      email: user.email.value,
      password: password.revealForHashing(),
      displayName: user.fullName.value,
    });

    // account.uid is adopted as-is, without Id value-object validation: ids
    // owned by the auth provider (imported/legacy accounts) are not
    // necessarily in the derived-id format.
    const profileResult = await this.userRepository.createProfile({
      id: account.uid,
      fullName: user.fullName.value,
      email: user.email.value,
      birthDate: user.birthDate.value,
      createdAt: user.createdAt.value,
      updatedAt: user.updatedAt.value,
    });

    if (profileResult === "already-exists") {
      throw new EmailAlreadyRegisteredError();
    }

    return account.uid;
  }
}
