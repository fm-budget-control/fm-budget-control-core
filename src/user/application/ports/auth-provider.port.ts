export type CreateAccountResult = {
  status: "created" | "email-already-exists";
  // The canonical account id. For "created" this is the requested id; for
  // "email-already-exists" it is the uid of the account that already owns
  // the email, which may differ from the requested id (imported accounts,
  // or ids derived before a secret rotation).
  uid: string;
};

export interface AuthProviderPort {
  createAccount(params: {
    id: string;
    email: string;
    password: string;
    displayName: string;
  }): Promise<CreateAccountResult>;
}
