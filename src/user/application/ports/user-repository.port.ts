export type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  birthDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProfileResult = "created" | "already-exists";

export interface UserRepositoryPort {
  createProfile(record: UserRecord): Promise<CreateProfileResult>;
}
