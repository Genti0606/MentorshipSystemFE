import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';

interface Mentor {
  id: string;
  name: string;
  subject: string;
  email: string;
  availability: string;
}

@Component({
  selector: 'app-find-mentors',
  imports: [FormsModule],
  templateUrl: './find-mentors.html',
  styleUrl: './find-mentors.scss',
})
export class FindMentors {
  private readonly storage = inject(StorageService);
  records = this.storage.read<Mentor[]>('mentors', []);
  draft: Mentor = this.emptyRecord();
  search = '';
  message = '';

  get filteredRecords(): Mentor[] {
    const query = this.search.toLowerCase().trim();
    return this.records.filter(record => Object.values(record).some(value => value.toLowerCase().includes(query)));
  }

  save(): void {
    if (!this.draft.name.trim()) return;
    if (!this.draft.subject.trim()) return;
    if (!this.draft.email.trim()) return;
    if (!this.draft.availability.trim()) return;
    const record = { ...this.draft, id: this.draft.id || crypto.randomUUID() };
    const next = this.draft.id
      ? this.records.map(item => item.id === record.id ? record : item)
      : [...this.records, record];
    if (!this.storage.write('mentors', next)) {
      this.message = 'Could not save. Browser storage may be full or disabled.';
      return;
    }
    this.records = next;
    this.draft = this.emptyRecord();
    this.message = 'Saved successfully.';
  }

  edit(record: Mentor): void {
    this.draft = { ...record };
    this.message = '';
  }

  remove(record: Mentor): void {
    if (!window.confirm('Delete this mentor?')) return;
    const next = this.records.filter(item => item.id !== record.id);
    if (!this.storage.write('mentors', next)) {
      this.message = 'Could not delete. Browser storage is unavailable.';
      return;
    }
    this.records = next;
    if (this.draft.id === record.id) this.cancel();
    this.message = 'Deleted successfully.';
  }

  cancel(): void {
    this.draft = this.emptyRecord();
    this.message = '';
  }

  private emptyRecord(): Mentor {
    return {
      id: '',
      name: '',
      subject: '',
      email: '',
      availability: '',
    };
  }
}
