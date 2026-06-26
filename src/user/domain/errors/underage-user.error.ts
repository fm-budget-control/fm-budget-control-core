export class UnderageUserError extends TypeError {
  constructor() {
    super("User must be at least 18 years old to register");
    this.name = "UnderageUserError";
  }
}
