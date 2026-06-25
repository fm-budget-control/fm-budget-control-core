export interface AuthProviderPort {
  accountExistsById(id: string): Promise<boolean>;
  createAccount(id: string, email: string, password: string): Promise<void>;
  updatePassword(id: string, password: string): Promise<void>;
}
