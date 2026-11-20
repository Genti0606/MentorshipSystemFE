import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';

interface Resource {
  id: string;
  title: string;
  course: string;
  url: string;
  type: string;
  notes: string;
}

@Component({
  selector: 'app-resources',
  imports: [FormsModule],
  templateUrl: './resources.html',
  styleUrl: './resources.scss',
})
export class Resources {
  private readonly storage = inject(StorageService);
  records = this.storage.read<Resource[]>('resources', []);
  draft: Resource = this.emptyRecord();
  search = '';
  message = '';

  get filteredRecords(): Resource[] {
    const query = this.search.toLowerCase().trim();
    return this.records.filter(record => Object.values(record).some(value => value.toLowerCase().includes(query)));
  }

  save(): void {
    if (!this.draft.title.trim()) return;
    if (!this.draft.course.trim()) return;
    if (!this.draft.url.trim()) return;
    if (!this.draft.type.trim()) return;
    if (!this.safeUrl(this.draft.url)) {
      this.message = 'Use a valid http or https URL.';
      return;
    }
    const record = { ...this.draft, id: this.draft.id || crypto.randomUUID() };
    const next = this.draft.id
      ? this.records.map(item => item.id === record.id ? record : item)
      : [...this.records, record];
    if (!this.storage.write('resources', next)) {
      this.message = 'Could not save. Browser storage may be full or disabled.';
      return;
    }
    this.records = next;
    this.draft = this.emptyRecord();
    this.message = 'Saved successfully.';
  }

  edit(record: Resource): void {
    this.draft = { ...record };
    this.message = '';
  }

  remove(record: Resource): void {
    if (!window.confirm('Delete this resource?')) return;
    const next = this.records.filter(item => item.id !== record.id);
    if (!this.storage.write('resources', next)) {
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

  safeUrl(value: string): string | null {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  private emptyRecord(): Resource {
    return {
      id: '',
      title: '',
      course: '',
      url: '',
      type: 'Article',
      notes: '',
    };
  }
}
