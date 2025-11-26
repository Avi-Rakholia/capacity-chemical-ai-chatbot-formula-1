import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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

  /* ------------------------------------
     SIDEBAR COLLAPSE / EXPAND
  ------------------------------------- */
  sidebarCollapsed = false;

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  get collapseIconClass(): string {
  return this.sidebarCollapsed ? 'icon--expand' : 'icon--collapse';
}


  /** Logo changes based on collapse */
  get logoPath(): string {
    return this.sidebarCollapsed
      ? '/assets/logo-small.png'
      : '/assets/logo-big.png';
  }

  /* ------------------------------------
     TABS
  ------------------------------------- */
  activeTab: TabId = 'formulas';

  setTab(tab: TabId) {
    this.activeTab = tab;
  }

  /* ------------------------------------
     SEARCH + SORT
  ------------------------------------- */
  searchText = '';
  sortAsc = true;

  onSearch(value: string) {
    this.searchText = value;
  }

  toggleSort() {
    this.sortAsc = !this.sortAsc;
  }

  /* ------------------------------------
     TABLE DATA
  ------------------------------------- */
  rows: RequestRow[] = [
    {
      id: 1,
      formula: 'aink Lotion Formula',
      dateRequested: '11-17-2025',
      dateResponded: '11-17-2025',
      status: 'Pending',
    },
    {
      id: 2,
      formula: 'bink Lotion Formula',
      dateRequested: '11-19-2025',
      dateResponded: '11-19-2025',
      status: 'Pending',
    },
    {
      id: 3,
      formula: 'cink Lotion Formula',
      dateRequested: '11-11-2025',
      dateResponded: '11-11-2025',
      status: 'Approved',
    },
    {
      id: 4,
      formula: 'Pink Lotion Formula',
      dateRequested: '11-13-2025',
      dateResponded: '11-13-2025',
      status: 'Approved',
    },
    {
      id: 5,
      formula: 'Pink Lotion Formula',
      dateRequested: '11-17-2025',
      dateResponded: '11-17-2025',
      status: 'Rejected',
    },
  ];

  /* ------------------------------------
     FILTERED ROWS (TAB + SEARCH + SORT)
  ------------------------------------- */
  get filteredRows(): RequestRow[] {
    let data = [...this.rows];

    // TAB FILTER
    if (this.activeTab === 'quotes') {
      data = []; // No quotes for now
    }

    // SEARCH
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      data = data.filter((row) =>
        `${row.formula} ${row.dateRequested} ${row.dateResponded} ${row.status}`
          .toLowerCase()
          .includes(q)
      );
    }

    // SORT
    data.sort((a, b) =>
      this.sortAsc
        ? a.formula.localeCompare(b.formula)
        : b.formula.localeCompare(a.formula)
    );

    return data;
  }

  /* ------------------------------------
     ACTION BUTTON LOGIC
  ------------------------------------- */
  approve(row: RequestRow) {
    row.status = 'Approved';
  }

  reject(row: RequestRow) {
    row.status = 'Rejected';
  }

  share(row: RequestRow) {
    alert(`Share details for: ${row.formula}`);
  }

  /* ------------------------------------
     BADGE COLOR CLASSES
  ------------------------------------- */
  getStatusClass(status: RequestStatus): string {
    return {
      Pending: 'badge--pending',
      Approved: 'badge--approved',
      Rejected: 'badge--rejected',
    }[status];
  }
}
