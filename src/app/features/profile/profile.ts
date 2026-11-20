import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CourseService, Course, Note, Session } from '../../shared/course.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  readonly auth = inject(AuthService);
  readonly classroom = inject(CourseService);
  message = '';

  private readonly user = this.auth.user();
  name = this.user?.name || '';
  surname = this.user?.surname || '';
  subject = this.user?.subject || '';
  bio = this.user?.bio || '';
  save(): void {
    try {
      this.auth.updateProfile(this.name, this.surname, this.subject, this.bio);
      this.message = 'Profile saved.';
    } catch (e) {
      this.message = (e as Error).message;
    }
  }
}
