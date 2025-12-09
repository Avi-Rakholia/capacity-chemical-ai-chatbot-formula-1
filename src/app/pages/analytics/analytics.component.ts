// analytics.component.ts
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);

interface AnalyticsMetric { value: number; unit?: string; change: number; trend: 'up' | 'down'; }
interface ChartPoint { month: string; orange: number; blue: number; }
interface User { id: number; name: string; email: string; role: string; status: string; avatar: string; }
interface QuickAccessItem { icon: string; label: string; }

interface SessionStatus {
  active: { percentage: number; colorStart: string; colorEnd: string };
  inactive: { percentage: number; color: string };
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {

  // ---------------- KPI ----------------
  totalInteractions: AnalyticsMetric = { value: 326, change: -2, trend: 'down' };
  avgTimePerChat: AnalyticsMetric = { value: 120, unit: 's', change: 2, trend: 'up' };
  avgMessagesPerChat: AnalyticsMetric = { value: 16, change: 2, trend: 'up' };

  // ---------------- SESSION DONUT ----------------
  sessionData: SessionStatus = {
    active: { percentage: 90, colorStart: '#10b981', colorEnd: '#10b981' },
    inactive: { percentage: 10, color: '#ef4444' }
  };

  // ---------------- CHART CONFIG ----------------
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart?: Chart;

  selectedYear = '2022';
  years = ['2019', '2020', '2021', '2022', '2023'];

  showOrange = true;
  showBlue = true;

  datasetsByYear: Record<string, ChartPoint[]> = {
  // ------------------------
  // YEAR 2019
  // ------------------------
  '2019': [
    { month: 'Jan', orange: 10, blue: 8 },
    { month: 'Feb', orange: 14, blue: 12 },
    { month: 'Mar', orange: 18, blue: 15 },
    { month: 'Apr', orange: 22, blue: 20 },
    { month: 'May', orange: 24, blue: 18 },
    { month: 'Jun', orange: 30, blue: 22 },
    { month: 'Jul', orange: 28, blue: 20 },
    { month: 'Aug', orange: 26, blue: 18 },
    { month: 'Sep', orange: 32, blue: 22 },
    { month: 'Oct', orange: 34, blue: 26 },
    { month: 'Nov', orange: 36, blue: 30 },
    { month: 'Dec', orange: 40, blue: 34 }
  ],

  // ------------------------
  // YEAR 2020
  // ------------------------
  '2020': [
    { month: 'Jan', orange: 12, blue: 10 },
    { month: 'Feb', orange: 16, blue: 13 },
    { month: 'Mar', orange: 20, blue: 16 },
    { month: 'Apr', orange: 25, blue: 19 },
    { month: 'May', orange: 28, blue: 21 },
    { month: 'Jun', orange: 33, blue: 25 },
    { month: 'Jul', orange: 31, blue: 24 },
    { month: 'Aug', orange: 29, blue: 23 },
    { month: 'Sep', orange: 35, blue: 27 },
    { month: 'Oct', orange: 38, blue: 30 },
    { month: 'Nov', orange: 40, blue: 32 },
    { month: 'Dec', orange: 44, blue: 35 }
  ],

  // ------------------------
  // YEAR 2021
  // ------------------------
  '2021': [
    { month: 'Jan', orange: 15, blue: 12 },
    { month: 'Feb', orange: 18, blue: 15 },
    { month: 'Mar', orange: 22, blue: 18 },
    { month: 'Apr', orange: 27, blue: 22 },
    { month: 'May', orange: 30, blue: 24 },
    { month: 'Jun', orange: 35, blue: 28 },
    { month: 'Jul', orange: 33, blue: 26 },
    { month: 'Aug', orange: 32, blue: 25 },
    { month: 'Sep', orange: 38, blue: 30 },
    { month: 'Oct', orange: 40, blue: 32 },
    { month: 'Nov', orange: 42, blue: 34 },
    { month: 'Dec', orange: 48, blue: 38 }
  ],

  // ------------------------
  // YEAR 2022
  // ------------------------
  '2022': [
    { month: 'Jan', orange: 18, blue: 14 },
    { month: 'Feb', orange: 22, blue: 17 },
    { month: 'Mar', orange: 26, blue: 20 },
    { month: 'Apr', orange: 30, blue: 25 },
    { month: 'May', orange: 34, blue: 28 },
    { month: 'Jun', orange: 38, blue: 30 },
    { month: 'Jul', orange: 37, blue: 29 },
    { month: 'Aug', orange: 35, blue: 27 },
    { month: 'Sep', orange: 42, blue: 33 },
    { month: 'Oct', orange: 45, blue: 36 },
    { month: 'Nov', orange: 48, blue: 38 },
    { month: 'Dec', orange: 52, blue: 41 }
  ],

  // ------------------------
  // YEAR 2023
  // ------------------------
  '2023': [
    { month: 'Jan', orange: 20, blue: 16 },
    { month: 'Feb', orange: 24, blue: 19 },
    { month: 'Mar', orange: 28, blue: 22 },
    { month: 'Apr', orange: 33, blue: 26 },
    { month: 'May', orange: 37, blue: 29 },
    { month: 'Jun', orange: 42, blue: 33 },
    { month: 'Jul', orange: 40, blue: 31 },
    { month: 'Aug', orange: 38, blue: 30 },
    { month: 'Sep', orange: 45, blue: 36 },
    { month: 'Oct', orange: 48, blue: 38 },
    { month: 'Nov', orange: 50, blue: 40 },
    { month: 'Dec', orange: 55, blue: 44 }
  ],

  // ------------------------
  // YEAR 2024
  // ------------------------
  '2024': [
    { month: 'Jan', orange: 22, blue: 18 },
    { month: 'Feb', orange: 26, blue: 21 },
    { month: 'Mar', orange: 30, blue: 24 },
    { month: 'Apr', orange: 36, blue: 28 },
    { month: 'May', orange: 40, blue: 31 },
    { month: 'Jun', orange: 45, blue: 35 },
    { month: 'Jul', orange: 43, blue: 34 },
    { month: 'Aug', orange: 41, blue: 32 },
    { month: 'Sep', orange: 48, blue: 38 },
    { month: 'Oct', orange: 52, blue: 41 },
    { month: 'Nov', orange: 55, blue: 43 },
    { month: 'Dec', orange: 60, blue: 48 }
  ]
};


  // ---------------- USERS TABLE ----------------
  users: User[] = [
    {
      id: 1,
      name: 'Harvey Spector',
      email: 'harvey@capacitychemicals.com',
      role: 'Admin',
      status: 'Active',
      avatar: '/assets/profile.svg'
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'john@capacitychemicals.com',
      role: 'Researcher',
      status: 'Active',
      avatar: '/assets/profile.svg'
    }
  ];

  selectedUsers: number[] = [0, 1];

  // ---------------- QUICK ACCESS ----------------
  quickAccessItems: QuickAccessItem[] = [
    { icon: '/assets/sidebar_home.svg', label: 'Home' },
    { icon: '/assets/sidebar_resources.svg', label: 'Files' },
    { icon: '/assets/sidebar_settings.svg', label: 'Config' },
    { icon: '/assets/double-quotes.svg', label: 'Quotes' },
    { icon: '/assets/molecules.svg', label: 'Formulas' },
    { icon: '/assets/chat.svg', label: 'Chat' }
  ];

  searchText = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.buildChart(), 0);
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }

  // ---------------- DONUT MATH ----------------
  getCircumference(): number {
    return 2 * Math.PI * 70;
  }

  getActiveOffset(): number {
    const c = this.getCircumference();
    return c - (this.sessionData.active.percentage / 100) * c;
  }

  // ---------------- USER CHECKBOX LOGIC ----------------
  isUserSelected(i: number) {
    return this.selectedUsers.includes(i);
  }

  toggleUserSelection(i: number) {
    const idx = this.selectedUsers.indexOf(i);
    if (idx > -1) this.selectedUsers.splice(idx, 1);
    else this.selectedUsers.push(i);
  }

  toggleAllUsers() {
    this.selectedUsers =
      this.selectedUsers.length === this.users.length
        ? []
        : this.users.map((_, i) => i);
  }

  // ---------------- CHART LOGIC ----------------
  buildChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d')!;
    if (this.chart) this.chart.destroy();

    const yearData = this.datasetsByYear[this.selectedYear];
    const labels = yearData.map(p => p.month);
    const orange = yearData.map(p => p.orange);
    const blue = yearData.map(p => p.blue);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(255,178,89,0.25)');
    gradient.addColorStop(1, 'rgba(255,178,89,0.02)');

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Orange',
            data: orange,
            borderColor: '#ffb259',
            backgroundColor: gradient,
            fill: true,
            hidden: !this.showOrange,
            tension: 0.36,
            pointRadius: 5,
            borderWidth: 3
          },
          {
            label: 'Blue',
            data: blue,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            fill: true,
            hidden: !this.showBlue,
            tension: 0.36,
            pointRadius: 5,
            borderWidth: 3
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    };

    this.chart = new Chart(ctx, config);
  }

  toggleSeries(series: 'orange' | 'blue') {
    if (series === 'orange') this.showOrange = !this.showOrange;
    else this.showBlue = !this.showBlue;
    this.buildChart();
  }

  onYearChange(year: string) {
    this.selectedYear = year;
    this.buildChart();
  }

  downloadChart() {
    if (!this.chart) return;
    const a = document.createElement('a');
    a.href = this.chart.toBase64Image();
    a.download = `analytics-chart-${this.selectedYear}.png`;
    a.click();
  }
}
