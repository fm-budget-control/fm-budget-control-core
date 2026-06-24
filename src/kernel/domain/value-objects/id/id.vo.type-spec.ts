import { Id } from "./id.vo.js";

type UserId = Id<"UserId">;
type AccountId = Id<"AccountId">;
type TransactionId = Id<"TransactionId">;

const validId = "550e8400-e29b-41d4-a716-446655440000";

const userId: UserId = Id.of<"UserId">(validId);
const accountId: AccountId = Id.of<"AccountId">(validId);
const transactionId: TransactionId = Id.of<"TransactionId">(validId);

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

void (userId satisfies AccountId);

// @ts-expect-error UserId must not be assignable from AccountId.

void (accountId satisfies UserId);

const unbrandedId = Id.of(validId);

// @ts-expect-error Unbranded Id must not be assignable to UserId.
acceptsUserId(unbrandedId);

// Cross-brand equality is intentionally allowed because equality compares values,
// not domain identity categories.
const sameRawValueComparison: boolean = userId.equals(accountId);

void sameRawValueComparison;
