import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceService, Resource } from '../../services/resource.service';
import { HttpClientModule } from '@angular/common/http';

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
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent implements OnInit {
  private resourceService = inject(ResourceService);

  // Signals for reactive state
  resources = signal<Resource[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  uploadProgress = signal(0);
  showUploadModal = signal(false);
  selectedFile = signal<File | null>(null);
  uploadCategory = signal<'formulas' | 'quotes' | 'knowledge' | 'other'>('formulas');
  uploadDescription = signal('');
  
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

  // Resource items - dummy data as fallback
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
    this.loadResources();
    this.checkScreenSize();
  }

  loadResources(category?: string) {
    this.loading.set(true);
    this.error.set(null);
    
    const filters = category && category !== 'all' ? { category: category as any } : undefined;
    
    this.resourceService.getAllResources(filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const apiData = Array.isArray(response.data) ? response.data : [response.data];
          this.resources.set(apiData);
          
          // Convert API resources to ResourceItem format for display
          if (apiData.length > 0) {
            this.allResources = apiData.map(r => ({
              id: r.resource_id,
              file: r.file_name,
              date: new Date(r.uploaded_on).toLocaleDateString('en-US'),
              fileType: r.file_type,
              size: r.file_size,
              category: r.category
            }));
          }
          this.filterResources();
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Using dummy data - API unavailable');
        this.loading.set(false);
        console.warn('Could not load resources from API, using dummy data:', err);
        // Keep dummy data if API fails
        this.filterResources();
      }
    });
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
    this.loadResources(tab);
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
    const apiResource = this.resources().find(r => r.resource_id === resource.id);
    
    if (apiResource) {
      this.loading.set(true);
      this.resourceService.downloadResource(apiResource.resource_id).subscribe({
        next: (blob) => {
          // Create blob URL and trigger download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = apiResource.file_name;
          link.click();
          window.URL.revokeObjectURL(url);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Download error:', err);
          // Fallback: try opening URL directly
          if (apiResource.file_url) {
            window.open(apiResource.file_url, '_blank');
          } else {
            alert(`Download failed for: ${resource.file}`);
          }
          this.loading.set(false);
        }
      });
    } else {
      console.log('Downloading (dummy data):', resource.file);
      alert(`Download not available for dummy data: ${resource.file}`);
    }
  }

  shareFile(resource: ResourceItem): void {
    const apiResource = this.resources().find(r => r.resource_id === resource.id);
    if (apiResource?.file_url) {
      // Copy to clipboard
      navigator.clipboard.writeText(apiResource.file_url).then(() => {
        alert(`Share link copied to clipboard!`);
      }).catch(() => {
        alert(`Share URL: ${apiResource.file_url}`);
      });
    } else {
      console.log('Sharing:', resource.file);
      alert(`Sharing not available for dummy data: ${resource.file}`);
    }
  }

  uploadFiles(): void {
    this.showUploadModal.set(true);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.selectedFile.set(null);
    this.uploadDescription.set('');
    this.uploadProgress.set(0);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        this.error.set('File size must be less than 50MB');
        return;
      }
      this.selectedFile.set(file);
      this.error.set(null);
    }
  }

  performUpload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.error.set('Please select a file to upload');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.uploadProgress.set(0);

    // TODO: Get actual user ID from auth service
    const uploadedBy = 1; // Placeholder - should come from authenticated user

    this.resourceService.uploadResource(
      file,
      this.uploadCategory(),
      uploadedBy,
      this.uploadDescription() || undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.uploadProgress.set(100);
          alert('File uploaded successfully!');
          this.closeUploadModal();
          this.loadResources(this.activeTab === 'all' ? undefined : this.activeTab);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.error.set(err.error?.message || 'Failed to upload file');
        this.loading.set(false);
      }
    });
  }
}