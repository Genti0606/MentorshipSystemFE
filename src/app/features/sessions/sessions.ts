import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';

interface Session {
  id: string;
  title: string;
  mentor: string;
  date: string;
  status: string;
  notes: string;
}

@Component({
  selector: 'app-sessions',
  imports: [FormsModule],
  templateUrl: './sessions.html',
  styleUrl: './sessions.scss',
})
export class Sessions {
  private readonly storage = inject(StorageService);
  records = this.storage.read<Session[]>('sessions', []);
  draft: Session = this.emptyRecord();
  search = '';
  message = '';

  get filteredRecords(): Session[] {
    const query = this.search.toLowerCase().trim();
    return this.records.filter(record => Object.values(record).some(value => value.toLowerCase().includes(query)));
  }

  save(): void {
    if (!this.draft.title.trim()) return;
    if (!this.draft.mentor.trim()) return;
    if (!this.draft.date.trim()) return;
    if (!this.draft.status.trim()) return;
    const record = { ...this.draft, id: this.draft.id || crypto.randomUUID() };
    const next = this.draft.id
      ? this.records.map(item => item.id === record.id ? record : item)
      : [...this.records, record];
    if (!this.storage.write('sessions', next)) {
      this.message = 'Could not save. Browser storage may be full or disabled.';
      return;
    }
    this.records = next;
    this.draft = this.emptyRecord();
    this.message = 'Saved successfully.';
  }

  edit(record: Session): void {
    this.draft = { ...record };
    this.message = '';
  }

  remove(record: Session): void {
    if (!window.confirm('Delete this session?')) return;
    const next = this.records.filter(item => item.id !== record.id);
    if (!this.storage.write('sessions', next)) {
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

  private emptyRecord(): Session {
    return {
      id: '',
      title: '',
      mentor: '',
      date: '',
      status: 'Scheduled',
      notes: '',
    };
  }
}
