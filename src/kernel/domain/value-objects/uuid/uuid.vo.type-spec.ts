import { Uuid } from "./uuid.vo.js";

type UserId = Uuid<"UserId">;
type AccountId = Uuid<"AccountId">;
type TransactionId = Uuid<"TransactionId">;

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

const userId: UserId = Uuid.of<"UserId">(validUuid);
const accountId: AccountId = Uuid.of<"AccountId">(validUuid);
const transactionId: TransactionId = Uuid.of<"TransactionId">(validUuid);

const acceptsUserId = (id: UserId): UserId => id;
const acceptsAccountId = (id: AccountId): AccountId => id;
const acceptsTransactionId = (id: TransactionId): TransactionId => id;

acceptsUserId(userId);
acceptsAccountId(accountId);
acceptsTransactionId(transactionId);

// @ts-expect-error AccountId must not be assignable to UserId.
acceptsUserId(accountId);

// @ts-expect-error TransactionId must not be assignable to UserId.
acceptsUserId(transactionId);

// @ts-expect-error UserId must not be assignable to AccountId.
acceptsAccountId(userId);

// @ts-expect-error UserId must not be assignable to TransactionId.
acceptsTransactionId(userId);

// @ts-expect-error AccountId must not be assignable from UserId.
const wrongAccountId: AccountId = userId;

// @ts-expect-error UserId must not be assignable from AccountId.
const wrongUserId: UserId = accountId;

const unbrandedUuid = Uuid.of(validUuid);

// @ts-expect-error Unbranded UUID must not be assignable to UserId.
acceptsUserId(unbrandedUuid);

// Cross-brand equality is intentionally allowed because equality compares values,
// not domain identity categories.
const sameRawValueComparison: boolean = userId.equals(accountId);

void sameRawValueComparison;