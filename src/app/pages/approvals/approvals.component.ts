import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApprovalService, Approval } from '../../services/approval.service';
import { HttpClientModule } from '@angular/common/http';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Returned';
type TabId = 'all' | 'formulas' | 'quotes';

interface RequestRow {
  id: number;
  formula: string;
  dateRequested: string;
  dateResponded: string;
  status: RequestStatus;
}
@Component({
  selector: 'app-approvals',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss'],
})
export class ApprovalsComponent implements OnInit {
  private router = inject(Router);
  private approvalService = inject(ApprovalService);

  // Signals for reactive state
  approvals = signal<Approval[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  /* SIDEBAR COLLAPSE / EXPAND */
  sidebarCollapsed = false;

  ngOnInit() {
    this.loadApprovals();
  }

  loadApprovals() {
    this.loading.set(true);
    this.error.set(null);
    
    this.approvalService.getAllApprovals().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const apiData = Array.isArray(response.data) ? response.data : [response.data];
          this.approvals.set(apiData);
          
          // Convert API data to RequestRow format
          this.rows = apiData.map(approval => ({
            id: approval.approval_id,
            formula: approval.entity_name || `${approval.entity_type} #${approval.entity_id}`,
            dateRequested: approval.request_date ? new Date(approval.request_date).toLocaleDateString('en-US') : new Date(approval.decision_date).toLocaleDateString('en-US'),
            dateResponded: new Date(approval.decision_date).toLocaleDateString('en-US'),
            status: approval.decision as RequestStatus
          }));
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Using dummy data - API unavailable');
        this.loading.set(false);
        console.warn('Could not load approvals from API, using dummy data:', err);
        // Keep dummy data if API fails
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  get collapseIconClass(): string {
    return this.sidebarCollapsed ? 'icon--expand' : 'icon--collapse';
  }

  get logoPath(): string {
    return this.sidebarCollapsed
      ? '/assets/logo-small.png'
      : '/assets/logo-big.png';
  }

  /* PROFILE MENU (3-dot) */
  menuOpen = false;

  toggleMenu(event?: MouseEvent) {
    event?.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('.sidebar__profile') || target.closest('.sidebar__profile-collapsed')) {
      return;
    }
    if (this.menuOpen) {
      this.menuOpen = false;
    }
  }

  signOut() {
    this.router.navigate(['/login']);
  }

  /* TABS */
  activeTab: TabId = 'formulas';

  setTab(tab: TabId) {
    this.activeTab = tab;
  }

  /* SEARCH + SORT */
  searchText = '';
  sortAsc = true;

  onSearch(value: string) {
    this.searchText = value;
  }

  toggleSort() {
    this.sortAsc = !this.sortAsc;
  }

  /* TABLE DATA */
  rows: RequestRow[] = [
    { id: 1, formula: 'aink Lotion Formula', dateRequested: '11-17-2025', dateResponded: '11-17-2025', status: 'Pending' },
    { id: 2, formula: 'bink Lotion Formula', dateRequested: '11-19-2025', dateResponded: '11-19-2025', status: 'Pending' },
    { id: 3, formula: 'cink Lotion Formula', dateRequested: '11-11-2025', dateResponded: '11-11-2025', status: 'Approved' },
    { id: 4, formula: 'Pink Lotion Formula', dateRequested: '11-13-2025', dateResponded: '11-13-2025', status: 'Approved' },
    { id: 5, formula: 'Pink Lotion Formula', dateRequested: '11-17-2025', dateResponded: '11-17-2025', status: 'Rejected' },
  ];

  /* FILTERED ROWS (TAB + SEARCH + SORT) */
  get filteredRows(): RequestRow[] {
    let data = [...this.rows];

    if (this.activeTab === 'quotes') {
      data = [];
    }

    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      data = data.filter((row) =>
        `${row.formula} ${row.dateRequested} ${row.dateResponded} ${row.status}`
          .toLowerCase()
          .includes(q)
      );
    }

    data.sort((a, b) =>
      this.sortAsc
        ? a.formula.localeCompare(b.formula)
        : b.formula.localeCompare(a.formula)
    );

    return data;
  }

  /* ACTION BUTTONS */
  approve(row: RequestRow) {
    // Find the corresponding approval from the API data
    const approval = this.approvals().find(a => a.approval_id === row.id);
    if (approval) {
      this.approvalService.updateApproval(approval.approval_id, { 
        decision: 'Approved',
        comments: 'Approved from UI'
      }).subscribe({
        next: (response) => {
          if (response.success) {
            row.status = 'Approved';
            this.loadApprovals(); // Reload to get fresh data
          }
        },
        error: (err) => {
          console.error('Error approving:', err);
          // Still update locally if API fails
          row.status = 'Approved';
        }
      });
    } else {
      // Fallback for dummy data
      row.status = 'Approved';
    }
  }

  reject(row: RequestRow) {
    // Find the corresponding approval from the API data
    const approval = this.approvals().find(a => a.approval_id === row.id);
    if (approval) {
      this.approvalService.updateApproval(approval.approval_id, { 
        decision: 'Rejected',
        comments: 'Rejected from UI'
      }).subscribe({
        next: (response) => {
          if (response.success) {
            row.status = 'Rejected';
            this.loadApprovals(); // Reload to get fresh data
          }
        },
        error: (err) => {
          console.error('Error rejecting:', err);
          // Still update locally if API fails
          row.status = 'Rejected';
        }
      });
    } else {
      // Fallback for dummy data
      row.status = 'Rejected';
    }
  }

  share(row: RequestRow) {
    alert(`Share details for: ${row.formula}`);
  }

  /* BADGE CLASSES */
  getStatusClass(status: RequestStatus): string {
    return {
      Pending: 'badge--pending',
      Approved: 'badge--approved',
      Rejected: 'badge--rejected',
      Returned: 'badge--returned',
    }[status];
  }
}
