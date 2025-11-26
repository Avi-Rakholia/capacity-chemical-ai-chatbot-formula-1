import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
type TabId = 'all' | 'formulas' | 'quotes';

interface RequestRow {
  id: number;
  formula: string;
  dateRequested: string;
  dateResponded: string;
  status: RequestStatus;
}

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.scss'],
})
export class PendingApprovalsComponent {

  constructor(private router: Router) {}

  /* SIDEBAR COLLAPSE / EXPAND */
  sidebarCollapsed = false;

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
    row.status = 'Approved';
  }

  reject(row: RequestRow) {
    row.status = 'Rejected';
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
    }[status];
  }
}
