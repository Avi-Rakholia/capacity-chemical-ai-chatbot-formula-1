import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="approvals-container">
      <h1>Pending Approvals</h1>
      <p>Review and manage pending requests</p>
    </div>
  `,
  styleUrls: ['./approvals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalsComponent {}
