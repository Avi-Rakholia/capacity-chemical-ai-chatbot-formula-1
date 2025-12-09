import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- MOCK API TYPES ---
interface UserWithRole {
  user_id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  status: 'Active' | 'Inactive';
}

interface CreateUserRequest {
  name: string;
  email: string;
  role_id: number;
  status: 'Active' | 'Inactive';
  password?: string;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  role_id?: number;
  status?: 'Active' | 'Inactive';
}

interface Role {
  id: number;
  name: string;
}

// Mock service for demonstration purposes
class UserApiServiceMock {
  private mockRoles: Role[] = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Researcher' },
    { id: 4, name: 'Sales' },
  ];

  private mockUsers: UserWithRole[] = [
    { user_id: 1, name: 'Harvey Spector', email: 'harvey@capacitychemicals.com', role_id: 1, role_name: 'Admin', status: 'Active' },
    { user_id: 2, name: 'John Doe', email: 'john@capacitychemicals.com', role_id: 2, role_name: 'Researcher', status: 'Active' },
    { user_id: 3, name: 'Harry Potter', email: 'harry@capacitychemicals.com', role_id: 2, role_name: 'Researcher', status: 'Inactive' },
    { user_id: 4, name: 'Jhonny Depp', email: 'jhonny@capacitychemicals.com', role_id: 4, role_name: 'Sales', status: 'Active' },
    { user_id: 5, name: 'Harry Potter', email: 'harry@capacitychemicals.com', role_id: 2, role_name: 'Researcher', status: 'Inactive' },
    { user_id: 6, name: 'John Doe', email: 'john@capacitychemicals.com', role_id: 2, role_name: 'Researcher', status: 'Active' },
    { user_id: 7, name: 'John Doe', email: 'john@capacitychemicals.com', role_id: 2, role_name: 'Researcher', status: 'Active' },
    { user_id: 8, name: 'John Doe', email: 'john@capacitychemicals.com', role_id: 2, role_name: 'Researcher', status: 'Active' },
  ];

  getAllUsers(page: number, size: number, filters: any): any {
    const start = (page - 1) * size;

    let filtered = this.mockUsers.filter(u =>
      !filters.status || u.status === filters.status
    );

    const paginated = filtered.slice(start, start + size);

    return {
      subscribe: (callbacks: { next: (data: any) => void, error: (err: any) => void }) => {
        setTimeout(() => {
          callbacks.next({
            success: true,
            data: {
              data: paginated,
              pagination: { total: filtered.length, totalPages: Math.ceil(filtered.length / size) }
            }
          });
        }, 400);
      }
    };
  }

  getRoles(): Role[] {
    return this.mockRoles;
  }

  createUser(request: CreateUserRequest): any {
    const newId = Math.max(...this.mockUsers.map(u => u.user_id)) + 1;
    const roleName = this.mockRoles.find(r => r.id === request.role_id)?.name || 'Unknown';

    const newUser: UserWithRole = {
      user_id: newId,
      name: request.name,
      email: request.email,
      role_id: request.role_id,
      role_name: roleName,
      status: request.status,
    };

    this.mockUsers.unshift(newUser);

    return {
      subscribe: (callbacks: { next: (data: any) => void }) => {
        callbacks.next({ success: true, data: newUser });
      }
    };
  }

  updateUser(userId: number, request: UpdateUserRequest): any {
    const user = this.mockUsers.find(u => u.user_id === userId);
    if (!user)
      return {
        subscribe: (callbacks: { error: (err: any) => void }) => {
          callbacks.error({ error: { error: 'User not found' } });
        }
      };

    if (request.name !== undefined) user.name = request.name;
    if (request.email !== undefined) user.email = request.email;
    if (request.status !== undefined) user.status = request.status;
    if (request.role_id !== undefined) {
      user.role_id = request.role_id;
      user.role_name = this.mockRoles.find(r => r.id === request.role_id)?.name || 'Unknown';
    }

    return {
      subscribe: (callbacks: { next: (data: any) => void }) => {
        callbacks.next({ success: true, data: user });
      }
    };
  }
}

// -------------------------------------------------------------

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users implements OnInit {
  private userApiService = new UserApiServiceMock();

  users = signal<UserWithRole[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  statusFilter = signal<'Active' | 'Inactive' | ''>('');
  
  // ⭐ NEW search + sort signals
  searchQuery = signal('');
  sortAsc = signal(true);

  roles: Role[] = [];

  selectedUserIds = signal<Set<number>>(new Set());

  showCreateModal = signal(false);
  showEditModal = signal(false);
  selectedUser = signal<UserWithRole | null>(null);

  currentEditIndex = signal(0);

  createForm = signal<CreateUserRequest>({
    name: '',
    email: '',
    role_id: 2,
    status: 'Active',
    password: ''
  });

  editForm = signal<UpdateUserRequest>({});

  // -------------------------------------------------------------
  // FILTERED USERS (includes search)
  // -------------------------------------------------------------
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

  selectedUsers = computed(() => {
    const ids = this.selectedUserIds();
    return this.users().filter(user => ids.has(user.user_id));
  });

  allSelected = computed(() => {
    const f = this.filteredUsers();
    if (f.length === 0) return false;
    return f.every(u => this.selectedUserIds().has(u.user_id));
  });

  ngOnInit(): void {
    this.roles = this.userApiService.getRoles();
    this.loadUsers();
  }

  // -------------------------------------------------------------
  // LOAD USERS
  // -------------------------------------------------------------
  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      status: this.statusFilter() || undefined
    };

    this.userApiService.getAllUsers(this.currentPage(), this.pageSize(), filters)
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            this.users.set(response.data.data);
            this.totalItems.set(response.data.pagination.total);
            this.totalPages.set(response.data.pagination.totalPages);
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load users. Please try again.');
          this.loading.set(false);
        }
      });
  }

  // -------------------------------------------------------------
  // SEARCH FUNCTION
  // -------------------------------------------------------------
  onSearch(event: any) {
    this.searchQuery.set(event.target.value.toLowerCase());
  }

  // -------------------------------------------------------------
  // SORT FUNCTION (A–Z / Z–A)
  // -------------------------------------------------------------
  toggleSort() {
    const sorted = [...this.users()].sort((a, b) =>
      this.sortAsc()
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    this.users.set(sorted);
    this.sortAsc.set(!this.sortAsc());
  }

  // -------------------------------------------------------------
  // TABLE SELECTION
  // -------------------------------------------------------------
  toggleSelect(id: number): void {
    const s = new Set(this.selectedUserIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedUserIds.set(s);
  }

  toggleSelectAll(): void {
    const filtered = this.filteredUsers();
    const selected = new Set(this.selectedUserIds());

    if (this.allSelected()) {
      filtered.forEach(u => selected.delete(u.user_id));
    } else {
      filtered.forEach(u => selected.add(u.user_id));
    }

    this.selectedUserIds.set(selected);
  }

  isSelected(id: number): boolean {
    return this.selectedUserIds().has(id);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  // -------------------------------------------------------------
  // CREATE USER MODAL
  // -------------------------------------------------------------
  openCreateModal(): void {
    this.createForm.set({
      name: '',
      email: '',
      role_id: this.roles.find(r => r.name === 'Researcher')?.id || 1,
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
    this.error.set(null);

    const form = this.createForm();

    this.userApiService.createUser(form).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.closeCreateModal();
          this.loadUsers();
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.error?.error || 'Failed to create user');
        this.loading.set(false);
      }
    });
  }

  // -------------------------------------------------------------
  // EDIT USER MODAL
  // -------------------------------------------------------------
  openEditModal(user: UserWithRole): void {
    this.selectedUser.set(user);
    this.selectedUserIds.set(new Set([user.user_id]));
    this.currentEditIndex.set(0);

    this.editForm.set({
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      status: user.status
    });

    this.showEditModal.set(true);
  }

  openEditModalFromFooter(): void {
    const list = this.selectedUsers();

    if (list.length === 0) {
      this.error.set('Please select one or more users to edit.');
      return;
    }

    this.selectedUser.set(list[0]);
    this.currentEditIndex.set(0);

    this.editForm.set({
      name: list[0].name,
      email: list[0].email,
      role_id: list[0].role_id,
      status: list[0].status
    });

    this.showEditModal.set(true);
  }

  switchEditUser(i: number): void {
    const list = this.selectedUsers();

    if (i < 0 || i >= list.length) return;

    this.currentEditIndex.set(i);
    this.selectedUser.set(list[i]);

    this.editForm.set({
      name: list[i].name,
      email: list[i].email,
      role_id: list[i].role_id,
      status: list[i].status
    });
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
    this.currentEditIndex.set(0);
    this.selectedUserIds.set(new Set());
  }

  updateUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.loading.set(true);
    this.error.set(null);

    this.userApiService.updateUser(user.user_id, this.editForm()).subscribe({
      next: (response: any) => {
        if (!response.success) {
          this.error.set(response.error || 'Failed to update user');
          this.loading.set(false);
          return;
        }

        this.closeEditModal();
        this.loadUsers();
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.error?.error || 'Failed to update user');
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }
}
