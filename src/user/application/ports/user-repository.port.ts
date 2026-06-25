export type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  birthDate: string;
  createdAt: string;
  updatedAt: string;
};

export interface UserRepositoryPort {
  existsById(id: string): Promise<boolean>;
  save(record: UserRecord): Promise<void>;
}
