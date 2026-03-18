import type { Currency, IAccount } from "./types.js";

export class Bank<T extends IAccount> {
  readonly name: string;
  private _accounts: Map<string, T> = new Map();
  constructor(name: string) {
    this.name = name;
  }
  addAccount(account: T): void {
    this._accounts.set(account.accountNumber, account);
  }

  findAccount(accountNumber: string): T | undefined {

    return this._accounts.get(accountNumber);
  }

  transfer(fromId: string, toId: string, amount: Currency): void {

    const source = this.findAccount(fromId);
    const destination = this.findAccount(toId);

    if (!source)
      throw new Error(`Account ${fromId} not found`);
    if (!destination)
      throw new Error(`Account ${toId} not found`);

    const description = `Transfer of ${amount} from ${source.accountNumber} to ${destination.accountNumber}`;
    source.withdraw(amount, description);
    destination.deposit(amount, description);
  }
  getAllAccounts(): T[] {
    return Array.from(this._accounts.values());
  }
  getTotalDeposits(): Currency {
    return Array.from(this._accounts.values()).reduce((sum, account) => sum + account.getBalance(), 0);
  }
}