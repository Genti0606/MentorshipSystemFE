import { Injectable, signal } from '@angular/core';

export type Role = 'student' | 'mentor';
export interface Account {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: Role;
  subject: string;
  bio: string;
}
interface StoredAccount extends Account {
  salt: string;
  passwordHash: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<Account | null>(this.restore());

  private accounts(): StoredAccount[] {
    try {
      return JSON.parse(localStorage.getItem('mentorship-accounts-v1') || '[]');
    } catch {
      return [];
    }
  }

  private publicAccount(account: StoredAccount): Account {
    const { passwordHash, salt, ...profile } = account;
    return profile;
  }

  private restore(): Account | null {
    try {
      const account = this.accounts().find(
        (a) => a.id === sessionStorage.getItem('mentorship-session'),
      );
      return account ? this.publicAccount(account) : null;
    } catch {
      return null;
    }
  }

  private write(accounts: StoredAccount[]): void {
    try {
      localStorage.setItem('mentorship-accounts-v1', JSON.stringify(accounts));
    } catch {
      throw new Error('Could not save your account. Browser storage is unavailable.');
    }
  }

  private async hash(password: string, salt: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      256,
    );
    return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async register(
    name: string,
    surname: string,
    email: string,
    password: string,
    role: Role,
  ): Promise<void> {
    email = email.trim().toLowerCase();
    if (!name.trim() || !surname.trim()) throw new Error('Enter your name and surname.');
    if (!/^[^\s@]+@epoka\.edu\.al$/.test(email)) throw new Error('Use your @epoka.edu.al email.');
    if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
    if (!['student', 'mentor'].includes(role)) throw new Error('Choose a valid account type.');
    const accounts = this.accounts();
    if (accounts.some((a) => a.email === email))
      throw new Error('An account with this email already exists.');
    const salt = crypto.randomUUID();
    const account: StoredAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      surname: surname.trim(),
      email,
      role,
      subject: '',
      bio: '',
      salt,
      passwordHash: await this.hash(password, salt),
    };
    // Recheck after hashing so two submissions cannot create duplicate accounts.
    const latest = this.accounts();
    if (latest.some((a) => a.email === email))
      throw new Error('An account with this email already exists.');
    this.write([...latest, account]);
  }

  async login(name: string, surname: string, email: string, password: string): Promise<void> {
    const account = this.accounts().find((a) => a.email === email.trim().toLowerCase());
    if (
      !account ||
      account.name.toLowerCase() !== name.trim().toLowerCase() ||
      account.surname.toLowerCase() !== surname.trim().toLowerCase() ||
      (await this.hash(password, account.salt)) !== account.passwordHash
    ) {
      throw new Error('The name, email, or password is incorrect.');
    }
    try {
      sessionStorage.setItem('mentorship-session', account.id);
    } catch {
      throw new Error('Session storage is unavailable. Enable browser storage to log in.');
    }
    this.user.set(this.publicAccount(account));
  }

  logout(): void {
    sessionStorage.removeItem('mentorship-session');
    this.user.set(null);
  }

  async changePassword(current: string, password: string): Promise<void> {
    const accounts = this.accounts();
    const account = accounts.find((a) => a.id === this.user()?.id);
    if (!account || (await this.hash(current, account.salt)) !== account.passwordHash) {
      throw new Error('Your current password is incorrect.');
    }
    if (password.length < 8) throw new Error('Use at least 8 characters.');
    if (password === current) throw new Error('Choose a different password.');
    const salt = crypto.randomUUID();
    const passwordHash = await this.hash(password, salt);
    this.write(accounts.map((a) => (a.id === account.id ? { ...a, salt, passwordHash } : a)));
  }

  updateProfile(name: string, surname: string, subject: string, bio: string): void {
    if (!name.trim() || !surname.trim()) throw new Error('Name and surname are required.');
    const accounts = this.accounts();
    const account = accounts.find((a) => a.id === this.user()?.id);
    if (!account) throw new Error('Please log in again.');
    const updated = {
      ...account,
      name: name.trim(),
      surname: surname.trim(),
      subject: subject.trim(),
      bio: bio.trim(),
    };
    this.write(accounts.map((a) => (a.id === account.id ? updated : a)));
    this.user.set(this.publicAccount(updated));
  }

  mentors(): Account[] {
    return this.accounts()
      .filter((a) => a.role === 'mentor')
      .map((a) => this.publicAccount(a));
  }

  displayName(id: string): string {
    const account = this.accounts().find((a) => a.id === id);
    return account ? account.name + ' ' + account.surname : 'Unknown account';
  }
}
