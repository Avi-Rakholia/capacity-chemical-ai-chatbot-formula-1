import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
  computed,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserApiService, UserWithRole } from '../../core/services/user-api.service';
import { AnalyticsApiService } from '../../core/services/analytics-api.service';

import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);

/* ---------------- INTERFACES ---------------- */

interface AnalyticsMetric {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface ChartPoint {
  month: string;
  value: number;
}

interface QuickAccessItem {
  icon: string;
  label: string;
}

interface SessionStatus {
  active: { percentage: number; colorStart: string; colorEnd: string; count: number };
  inactive: { percentage: number; color: string; count: number };
}

/* ---------------- COMPONENT ---------------- */

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {

  /* ---------------- SERVICES ---------------- */
  
  private userApiService = inject(UserApiService);
  private analyticsApiService = inject(AnalyticsApiService);

  /* ---------------- HELPER METHOD ---------------- */
  
  getCircumference(): number {
    const radius = 70; // MUST match SVG r="70"
    return 2 * Math.PI * radius;
  }

  /* ---------------- USER DATA ---------------- */

  users = signal<UserWithRole[]>([]);
  loading = signal(false);

  totalUsers = computed(() => this.users().length);

  /* ---------------- KPI DATA ---------------- */

  totalInteractions: AnalyticsMetric = { value: 0, change: 0, trend: 'up' };
  avgMessagesPerChat: AnalyticsMetric = { value: 0, change: 0, trend: 'up' };

  kpiTrendData = {
    interactions: [] as number[],
    messages: [] as number[]
  };

  /* ---------------- SESSION DONUT ---------------- */

  sessionData = computed<SessionStatus>(() => {
    const allUsers = this.users();
    const activeUsers = allUsers.filter(u => u.status === 'Active');
    const inactiveUsers = allUsers.filter(u => u.status === 'Inactive');

    const total = allUsers.length || 1;
    const activePercentage = Math.round((activeUsers.length / total) * 100);

    return {
      active: {
        percentage: activePercentage,
        colorStart: '#10b981',
        colorEnd: '#10b981',
        count: activeUsers.length
      },
      inactive: {
        percentage: 100 - activePercentage,
        color: '#ef4444',
        count: inactiveUsers.length
      }
    };
  });

  /* ---------------- CHART REFERENCES ---------------- */

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('interactionChart') interactionChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('messageChart') messageChart!: ElementRef<HTMLCanvasElement>;

  chart?: Chart;
  miniCharts: { [key: string]: Chart } = {};

  /* ---------------- YEARLY MAIN CHART ---------------- */

  selectedYear = '2022';
  years = ['2019', '2020', '2021', '2022', '2023', '2024'];

  datasetsByYear: Record<string, ChartPoint[]> = {
    '2022': [
      { month: 'Jan', value: 18 },
      { month: 'Feb', value: 22 },
      { month: 'Mar', value: 26 },
      { month: 'Apr', value: 30 },
      { month: 'May', value: 34 },
      { month: 'Jun', value: 38 },
      { month: 'Jul', value: 37 },
      { month: 'Aug', value: 35 },
      { month: 'Sep', value: 42 },
      { month: 'Oct', value: 45 },
      { month: 'Nov', value: 48 },
      { month: 'Dec', value: 52 }
    ]
  };

  /* ---------------- QUICK ACCESS ---------------- */

  quickAccessItems: QuickAccessItem[] = [
    { icon: '/assets/sidebar_home.svg', label: 'Home' },
    { icon: '/assets/sidebar_resources.svg', label: 'Files' },
    { icon: '/assets/sidebar_settings.svg', label: 'Config' },
    { icon: '/assets/double-quotes.svg', label: 'Quotes' },
    { icon: '/assets/molecules.svg', label: 'Formulas' },
    { icon: '/assets/chat.svg', label: 'Chat' }
  ];

  /* ---------------- LIFECYCLE ---------------- */

  ngOnInit(): void {
    this.loadUsers();
    this.loadKpis();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buildChart();
    });
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
    Object.values(this.miniCharts).forEach(c => c.destroy());
  }

  /* ---------------- API CALLS ---------------- */

  loadUsers(): void {
    this.loading.set(true);

    this.userApiService.getAllUsers(1, 1000, {}).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.users.set(res.data.data);
        }
        this.loading.set(false);
      },
      error: err => {
        console.error('User load failed', err);
        this.loading.set(false);
      }
    });
  }

  private calculateTrend(
    current: number,
    previous: number
  ): { change: number; trend: 'up' | 'down' | 'neutral' } {

    if (!previous || current === previous) {
      return { change: 0, trend: 'neutral' };
    }

    const diff = Math.round(((current - previous) / previous) * 100);

    if (diff === 0) {
      return { change: 0, trend: 'neutral' };
    }

    return {
      change: Math.abs(diff),
      trend: diff > 0 ? 'up' : 'down'
    };
  }

  private previousTotalMessages = 0;
  private previousAvgMessages = 0;

  private generateTrendData(
    start: number,
    end: number,
    points: number
  ): number[] {
    if (points <= 1) return [end];

    const data: number[] = [];
    const step = (end - start) / (points - 1);

    for (let i = 0; i < points; i++) {
      const value = start + step * i;

      // add slight randomness for natural-looking trends
      const noise = value * 0.03 * (Math.random() - 0.5);

      data.push(Math.max(0, Math.round(value + noise)));
    }

    return data;
  }

  loadKpis(): void {
    this.analyticsApiService.getChatSessionStats().subscribe({
      next: (response) => {
        if (!response.success || !response.data) return;

        const messages = response.data.messages;

        const totalMessages = Number(messages.total_messages);
        const avgMessages = Number(messages.avg_messages_per_session);

        /* -------- SIMULATE REALISTIC TRENDS FOR DEMO -------- */
        // If no previous data, simulate positive growth
        if (this.previousTotalMessages === 0) {
          this.previousTotalMessages = Math.floor(totalMessages * 0.85);
          this.previousAvgMessages = Math.floor(avgMessages * 0.92);
        }

        /* -------- TOTAL INTERACTIONS -------- */
        const totalTrend = this.calculateTrend(
          totalMessages,
          this.previousTotalMessages
        );

        this.totalInteractions = {
          value: totalMessages,
          change: totalTrend.change,
          trend: totalTrend.trend
        };

        /* -------- AVG MESSAGES PER CHAT -------- */
        const avgTrend = this.calculateTrend(
          avgMessages,
          this.previousAvgMessages
        );

        this.avgMessagesPerChat = {
          value: Math.round(avgMessages),
          change: avgTrend.change,
          trend: avgTrend.trend
        };

        /* -------- GENERATE REALISTIC TREND DATA (12 points) -------- */
        this.kpiTrendData.interactions = this.generateTrendData(
          this.previousTotalMessages,
          totalMessages,
          12
        );

        this.kpiTrendData.messages = this.generateTrendData(
          this.previousAvgMessages,
          avgMessages,
          12
        );

        /* -------- UPDATE PREVIOUS VALUES -------- */
        this.previousTotalMessages = totalMessages;
        this.previousAvgMessages = avgMessages;

        setTimeout(() => this.buildMiniCharts());
      },
      error: err => console.error(err)
    });
  }

  /* ---------------- HELPERS ---------------- */

  private getTransparentColor(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /* ---------------- MINI CHARTS ---------------- */

  buildMiniCharts(): void {
    this.buildMiniChart('interaction', this.interactionChart, this.kpiTrendData.interactions, this.totalInteractions.trend);
    this.buildMiniChart('message', this.messageChart, this.kpiTrendData.messages, this.avgMessagesPerChat.trend);
  }

  getDynamicColor(trend: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return '#059669'; // green
      case 'down': return '#dc2626'; // red
      default: return '#6b7280'; // gray
    }
  }

  buildMiniChart(key: string, ref: ElementRef<HTMLCanvasElement>, data: number[], trend: 'up' | 'down' | 'neutral'): void {
    if (!ref?.nativeElement || !data.length) return;

    if (this.miniCharts[key]) this.miniCharts[key].destroy();

    const ctx = ref.nativeElement.getContext('2d')!;
    const color = this.getDynamicColor(trend);
    const fill = this.getTransparentColor(color, 0.2);

    this.miniCharts[key] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(() => ''),
        datasets: [{
          data,
          borderColor: color,
          backgroundColor: fill,
          fill: true,
          tension: 0.4,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }

  /* ---------------- MAIN CHART ---------------- */

  buildChart(): void {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d')!;
    if (this.chart) this.chart.destroy();

    const data = this.datasetsByYear[this.selectedYear];
    const labels = data.map(d => d.month);
    const values = data.map(d => d.value);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#ffb259',
          fill: true,
          tension: 0.36,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  onYearChange(year: string): void {
    this.selectedYear = year;
    this.buildChart();
  }

  downloadChart(): void {
    if (!this.chart) return;
    const a = document.createElement('a');
    a.href = this.chart.toBase64Image();
    a.download = `analytics-${this.selectedYear}.png`;
    a.click();
  }
}