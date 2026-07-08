export type CreateAccountResult = "created" | "email-already-exists";

export interface AuthProviderPort {
  createAccount(params: {
    id: string;
    email: string;
    password: string;
    displayName: string;
  }): Promise<CreateAccountResult>;
}
