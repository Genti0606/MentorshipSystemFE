import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../shared/auth.service';

@Component({
  imports: [FormsModule, MatDialogModule],
  templateUrl: './password-dialog.html',
  styleUrl: './password-dialog.scss',
})
export class PasswordDialog {
  private readonly auth = inject(AuthService);
  private readonly ref = inject(MatDialogRef<PasswordDialog>);
  current = '';
  password = '';
  confirm = '';
  message = '';
  busy = false;
  async save(): Promise<void> {
    if (this.busy) return;
    if (this.password !== this.confirm) {
      this.message = 'Passwords do not match.';
      return;
    }
    this.busy = true;
    this.ref.disableClose = true;
    try {
      await this.auth.changePassword(this.current, this.password);
      this.current = '';
      this.password = '';
      this.confirm = '';
      this.ref.close(true);
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Could not change your password.';
    } finally {
      this.busy = false;
      this.ref.disableClose = false;
    }
  }
}
