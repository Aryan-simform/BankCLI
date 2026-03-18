//types of accounts active freeze and closed 
export enum AccountStatus {
  "ACTIVE" = "ACTIVE",
  "FROZEN" = "FROZEN",
  "CLOSED" = "CLOSED",
}

//types of transactions
export enum TransactionType {
  "DEPOSIT" = "DEPOSIT",
  "WITHDRAWAL" = "WITHDRAWAL",
  "TRANSFER" = "TRANSFER",
}

export interface ITransaction {
  id: string,
  type: TransactionType,
  amount: Currency,
  balanceAfter: Currency,
  timestamp: Date,
  description?: string
}

export interface IAccount {
  accountNumber: string,
  owner: string,
  status: AccountStatus,
  getBalance(): Currency
  deposit(amount: Currency, description?: string): ITransaction,
  withdraw(amount: Currency, description?: string): ITransaction,
  getTransactionHistory(): ITransaction[]
}

export type Currency = number;
export type SortOrder = "asc" | "desc";
type index = number;
export type TransactionWithIndex = ITransaction & index;
