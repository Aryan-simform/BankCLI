
import { AccountStatus, TransactionType } from "./types.js";
import type { Currency, IAccount, ITransaction } from "./types.js";

export class BankAccount implements IAccount {
  readonly accountNumber: string;
  readonly owner: string;
  status: AccountStatus;
  private _balance = 0;
  private _transactions: ITransaction[] = [];

  constructor(owner: string, initialDeposit?: number) {
    this.owner = owner;
    this.accountNumber = BankAccount.generateAccountNumber();
    this.status = AccountStatus.ACTIVE;
    if (initialDeposit) {
      this.deposit(initialDeposit);
    }
  }

  private static generateAccountNumber(): string {
    return "ACC" + Math.floor(100000 + Math.random() * 900000);
  }

  getBalance(): number {
    return this._balance;
  }

  deposit(amount: Currency, description?: string): ITransaction {
    const validations: [boolean, string][] = [
      [amount <= 0, "Amount must be positive"],
      [this.status === AccountStatus.FROZEN, "Account is frozen"],
      [this.status === AccountStatus.CLOSED, "Account is closed"],
    ];
    for (const [condition, message] of validations) {
      if (condition) throw new Error(message);
    }

    this._balance += amount;
    const transaction: ITransaction = {
      id: "TXN" + Date.now(),
      type: TransactionType.DEPOSIT,
      amount,
      timestamp: new Date(),
      balanceAfter: this._balance,
      description: description ?? "",
    };
    this._transactions.push(transaction);
    return transaction;
  }

  withdraw(amount: Currency, description?: string): ITransaction {
    const validations: [boolean, string][] = [
      [amount <= 0, "Amount must be positive"],
      [this.status === AccountStatus.FROZEN, "Account is frozen"],
      [this.status === AccountStatus.CLOSED, "Account is closed"],
      [amount > this._balance, "Insufficient balance"],
    ];
    for (const [condition, message] of validations) {
      if (condition) throw new Error(message);
    }

    this._balance -= amount;
    const transaction: ITransaction = {
      id: "TXN" + Date.now(),
      type: TransactionType.WITHDRAWAL,
      amount,
      timestamp: new Date(),
      balanceAfter: this._balance,
      description: description ?? "",
    };
    this._transactions.push(transaction);
    return transaction;
  }

  getTransactionHistory(): ITransaction[] {
    return structuredClone(this._transactions);
  }

}

function structuredClone(_transactions: ITransaction[]): ITransaction[] {
  throw new Error("Function not implemented.");
}
