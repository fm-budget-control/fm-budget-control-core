import { FullName, Email, Password, UserId } from "../../../domain/value-objects/index.js";
import { User } from "../../../domain/entities/user.entity.js";
import { IsoDate, IsoDateTime } from "../../../../kernel/domain/value-objects/index.js";
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

  async execute(command: RegisterUserCommand): Promise<UserId> {
    const fullName = FullName.of(command.fullName);
    const email = Email.parse(command.email);
    const birthDate = IsoDate.of(command.birthDate);
    const password = Password.of(command.password);

    const id = await this.userIdDeriver.derive(email);

    if (await this.userRepository.existsById(id)) {
      throw new EmailAlreadyRegisteredError();
    }

    const authExists = await this.authProvider.accountExistsById(id);

    if (authExists) {
      await this.authProvider.updatePassword(id, password);
    } else {
      await this.authProvider.createAccount(id, email, password);
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

    await this.userRepository.save(user);

    return user.id;
  }
}
