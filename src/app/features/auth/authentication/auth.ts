import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, Role } from '../../../shared/auth.service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  get registering(): boolean {
    return this.route.snapshot.data['register'] === true;
  }
  name = '';
  surname = '';
  email = '';
  password = '';
  confirm = '';
  role: Role = 'student';
  busy = false;
  message = '';

  async submit(): Promise<void> {
    if (this.busy) return;
    this.message = '';
    if (this.registering && this.password !== this.confirm) {
      this.message = 'Passwords do not match.';
      return;
    }
    this.busy = true;
    try {
      if (this.registering) {
        await this.auth.register(this.name, this.surname, this.email, this.password, this.role);
        this.password = '';
        this.confirm = '';
        await this.router.navigate(['/login'], { state: { registered: true } });
      } else {
        await this.auth.login(this.name, this.surname, this.email, this.password);
        this.password = '';
        await this.router.navigate(['/']);
      }
    } catch (error) {
      this.message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    } finally {
      this.busy = false;
    }
  }

  get registered(): boolean {
    return history.state?.registered === true;
  }
}
