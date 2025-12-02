import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ResourceItem {
  id: number;
  file: string;
  date: string;
  fileType: string;
  size: string;
  category: string;
}

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent implements OnInit {
  // Sidebar state
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  logoBig = 'assets/logo-big.png';
  logoSmall = 'assets/logo-small.png';
  collapseIconClass = 'icon--collapse';

  // Main UI state
  searchText = '';
  activeTab: string = 'all';
  sortAsc = true;

  // Resource items
  allResources: ResourceItem[] = [
    { id: 1, file: 'Chemical Formulas', date: '11-17-2025', fileType: 'PDF Document', size: '24 MB', category: 'formulas' },
    { id: 2, file: 'Safety Datasheet', date: '11-12-2025', fileType: 'PDF Document', size: '3.2 MB', category: 'knowledge' },
    { id: 3, file: 'Mixing Guide', date: '10-05-2025', fileType: 'PDF Document', size: '7.1 MB', category: 'knowledge' },
    { id: 4, file: 'Chemical Formulas', date: '11-17-2025', fileType: 'PDF Document', size: '24 MB', category: 'formulas' },
    { id: 5, file: 'Supplier Quotes Q4', date: '09-30-2025', fileType: 'Excel Spreadsheet', size: '120 KB', category: 'quotes' },
    { id: 6, file: 'Chemical Formulas', date: '11-17-2025', fileType: 'PDF Document', size: '24 MB', category: 'formulas' },
    { id: 7, file: 'Application Notes', date: '08-12-2025', fileType: 'PDF Document', size: '1.1 MB', category: 'knowledge' },
    { id: 8, file: 'Supplier Quotes Q3', date: '06-21-2025', fileType: 'Excel Spreadsheet', size: '200 KB', category: 'quotes' },
    { id: 9, file: 'Chemical Formulas', date: '11-17-2025', fileType: 'PDF Document', size: '24 MB', category: 'formulas' },
    { id: 10, file: 'Chemical Formulas', date: '11-17-2025', fileType: 'PDF Document', size: '24 MB', category: 'formulas' }
  ];

  displayedResources: ResourceItem[] = [];

  ngOnInit(): void {
    this.filterResources();
    this.checkScreenSize();
  }

  // Listen for window resize
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  // Auto-collapse sidebar on small screens
  checkScreenSize(): void {
    if (window.innerWidth <= 768) {
      this.sidebarCollapsed = false;
      this.mobileMenuOpen = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.collapseIconClass = this.sidebarCollapsed ? 'icon--expand' : 'icon--collapse';
  }

  toggleMobileSidebar(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileSidebar(): void {
    this.mobileMenuOpen = false;
  }

  onMenuItemClick(): void {
    // Close mobile menu when item is clicked
    if (window.innerWidth <= 768) {
      this.closeMobileSidebar();
    }
  }

  onSearch(value: string): void {
    this.searchText = value;
    this.filterResources();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.filterResources();
  }

  toggleSort(): void {
    this.sortAsc = !this.sortAsc;
    this.sortResources();
  }

  filterResources(): void {
    let filtered = [...this.allResources];

    // Filter by tab
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(r => r.category === this.activeTab);
    }

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(r =>
        r.file.toLowerCase().includes(search) ||
        r.fileType.toLowerCase().includes(search) ||
        r.date.includes(search)
      );
    }

    this.displayedResources = filtered;
    this.sortResources();
  }

  sortResources(): void {
    this.displayedResources.sort((a, b) => {
      const comparison = a.file.localeCompare(b.file);
      return this.sortAsc ? comparison : -comparison;
    });
  }

  downloadFile(resource: ResourceItem): void {
    console.log('Downloading:', resource.file);
    alert(`Downloading: ${resource.file}`);
  }

  shareFile(resource: ResourceItem): void {
    console.log('Sharing:', resource.file);
    alert(`Sharing: ${resource.file}`);
  }

  uploadFiles(): void {
    console.log('Upload files clicked');
    alert('Upload files dialog would open here');
  }
}