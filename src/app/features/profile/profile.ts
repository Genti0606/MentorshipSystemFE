import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';

interface ProfileData { name: string; email: string; course: string; bio: string; }

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly storage = inject(StorageService);
  saved = this.storage.read<ProfileData | null>('profile', null);
  draft = this.saved ? { ...this.saved } : this.emptyProfile();
  message = '';

  save(): void {
    if (!this.draft.name.trim() || !this.draft.email.trim()) return;
    if (!this.storage.write('profile', this.draft)) {
      this.message = 'Could not save. Browser storage is unavailable.';
      return;
    }
    this.saved = { ...this.draft };
    this.message = 'Profile saved.';
  }

  cancel(): void {
    this.draft = this.saved ? { ...this.saved } : this.emptyProfile();
    this.message = '';
  }

  remove(): void {
    if (!window.confirm('Delete your saved profile?')) return;
    if (!this.storage.write('profile', null)) {
      this.message = 'Could not delete. Browser storage is unavailable.';
      return;
    }
    this.saved = null;
    this.draft = this.emptyProfile();
    this.message = 'Profile deleted.';
  }

  private emptyProfile(): ProfileData { return { name: '', email: '', course: '', bio: '' }; }
}
