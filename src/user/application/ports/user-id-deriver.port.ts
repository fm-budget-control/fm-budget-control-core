export interface UserIdDeriverPort {
  derive(email: string): Promise<string>;
}
