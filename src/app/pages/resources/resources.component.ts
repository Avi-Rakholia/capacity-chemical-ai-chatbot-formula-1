import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
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

  /* --------------------------
     Sidebar + Mobile UI state
  --------------------------- */
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  logoBig = 'assets/logo-big.png';
  logoSmall = 'assets/logo-small.png';
  collapseIconClass = 'icon--collapse';

  /* --------------------------
     Main UI state
  --------------------------- */
  searchText = '';
  activeTab: string = 'all';
  sortAsc = true;

  /* --------------------------
     File Upload (Hidden Input)
  --------------------------- */
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;


  /* --------------------------
     Resource Table Data
  --------------------------- */
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

  /* ============================================================
     WINDOW RESIZE LISTENER
  ============================================================ */
  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    if (window.innerWidth <= 768) {
      this.sidebarCollapsed = false;
      this.mobileMenuOpen = false;
    }
  }

  /* ============================================================
     SIDEBAR CONTROLS
  ============================================================ */
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


  /* ============================================================
     SEARCH + TABS + SORTING
  ============================================================ */
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

    if (this.activeTab !== 'all') {
      filtered = filtered.filter(r => r.category === this.activeTab);
    }

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


  /* ============================================================
     FILE UPLOAD FUNCTIONALITY
  ============================================================ */

  openUploadDialog(): void {
    this.fileInput.nativeElement.click();
  }

  handleFileUpload(event: any): void {
    const files: FileList = event.target.files;

    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const newResource: ResourceItem = {
        id: Date.now(),
        file: file.name,
        date: this.getToday(),
        fileType: this.getFileType(file),
        size: this.formatFileSize(file.size),
        category: this.detectCategory(file)
      };

      this.allResources.unshift(newResource);
    });

    this.filterResources();
  }

  getToday(): string {
    const d = new Date();
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}-${d.getFullYear()}`;
  }

  getFileType(file: File): string {
    if (file.type.includes('pdf')) return 'PDF Document';
    if (file.type.includes('sheet') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx'))
      return 'Excel Spreadsheet';
    return file.type || 'Unknown';
  }

  detectCategory(file: File): string {
    const name = file.name.toLowerCase();
    if (name.includes('formula')) return 'formulas';
    if (name.includes('quote')) return 'quotes';
    if (name.includes('guide') || name.includes('safety') || name.includes('note'))
      return 'knowledge';
    return 'all';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }


  /* ============================================================
     ACTION BUTTONS
  ============================================================ */
  downloadFile(resource: ResourceItem): void {
    alert(`Downloading: ${resource.file}`);
  }

  shareFile(resource: ResourceItem): void {
    alert(`Sharing: ${resource.file}`);
  }
}
