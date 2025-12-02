import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserApiService, UserWithRole, CreateUserRequest, UpdateUserRequest } from '../../core/services/user-api.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private userApiService = inject(UserApiService);

  // Signals for state management
  users = signal<UserWithRole[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Pagination signals
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Filter signals
  statusFilter = signal<string>('');
  roleFilter = signal<number | null>(null);
  searchQuery = signal('');

  // UI state signals
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedUser = signal<UserWithRole | null>(null);

  // Form data signals
  createForm = signal<CreateUserRequest>({
    name: '',
    email: '',
    role_id: 1,
    status: 'Active',
    password: ''
  });

  editForm = signal<UpdateUserRequest>({});

  // Computed values
  filteredUsers = computed(() => {
    let filtered = this.users();
    const query = this.searchQuery().toLowerCase();
    
    if (query) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role_name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });

  hasUsers = computed(() => this.users().length > 0);
  
  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      status: this.statusFilter() || undefined,
      role_id: this.roleFilter() || undefined,
      sortBy: 'name',
      sortOrder: 'ASC' as const
    };

    this.userApiService.getAllUsers(this.currentPage(), this.pageSize(), filters)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.users.set(response.data.data);
            this.totalItems.set(response.data.pagination.total);
            this.totalPages.set(response.data.pagination.totalPages);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load users. Please try again.');
          this.loading.set(false);
          console.error('Error loading users:', err);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  openCreateModal(): void {
    this.createForm.set({
      name: '',
      email: '',
      role_id: 1,
      status: 'Active',
      password: ''
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createUser(): void {
    this.loading.set(true);
    const formData = this.createForm();

    this.userApiService.createUser(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeCreateModal();
          this.loadUsers();
        } else {
          this.error.set(response.error || 'Failed to create user');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to create user');
        this.loading.set(false);
      }
    });
  }

  openEditModal(user: UserWithRole): void {
    this.selectedUser.set(user);
    this.editForm.set({
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      status: user.status
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
  }

  updateUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.loading.set(true);
    const formData = this.editForm();

    this.userApiService.updateUser(user.user_id, formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeEditModal();
          this.loadUsers();
        } else {
          this.error.set(response.error || 'Failed to update user');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to update user');
        this.loading.set(false);
      }
    });
  }

  openDeleteModal(user: UserWithRole): void {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
  }

  deleteUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.loading.set(true);

    this.userApiService.deleteUser(user.user_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeDeleteModal();
          this.loadUsers();
        } else {
          this.error.set(response.error || 'Failed to delete user');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Failed to delete user');
        this.loading.set(false);
      }
    });
  }

  getRoleClass(roleName: string): string {
    const roleClasses: { [key: string]: string } = {
      'Admin': 'role-admin',
      'Supervisor': 'role-supervisor',
      'Chemist': 'role-chemist',
      'Sales': 'role-sales',
      'Worker': 'role-worker'
    };
    return roleClasses[roleName] || 'role-default';
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  // Expose Math to template
  Math = Math;
}
