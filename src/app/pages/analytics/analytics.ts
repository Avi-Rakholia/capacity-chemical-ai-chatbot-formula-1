// analytics.component.ts
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface AnalyticsMetric { value: number; unit?: string; change: number; trend: 'up'|'down'; }
interface ChartPoint { month: string; orange: number; blue: number; }
interface User { id: number; name: string; email: string; role: string; status: string; avatar: string; }
interface QuickAccessItem { icon: string; label: string; }

// NEW INTERFACE for dynamic session data
interface SessionStatus {
  active: {
    percentage: number;
    colorStart: string;
    colorEnd: string;
  };
  inactive: {
    percentage: number;
    color: string;
  };
}


@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.scss']
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {

  // Sidebar
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  logoFull = '/assets/logo-full.png';
  logoSmall = '/assets/logo-small.png';
  userAvatar = '/assets/user-avatar.png';
  currentUser = { name: 'John Doe', role: 'Researcher' };

  // KPI metrics
  totalInteractions: AnalyticsMetric = { value: 326, change: -2, trend: 'down' };
  avgTimePerChat: AnalyticsMetric = { value: 120, unit: 's', change: 2, trend: 'up' };
  avgMessagesPerChat: AnalyticsMetric = { value: 16, change: 2, trend: 'up' };

  // ===============================================
  // START OF DYNAMIC SESSION DATA
  // ===============================================
  // This object will be updated when integrating with the backend API
  sessionData: SessionStatus = {
    active: {
      percentage: 90,
      colorStart: '#10b981', // Deep Green
      colorEnd: '#10b981'    // Bright Green
    },
    inactive: {
      percentage: 10,
      color: '#ef4444'       // Visible Light Red (for the track)
    }
  };
  // ===============================================
  // END OF DYNAMIC SESSION DATA
  // ===============================================

  // chart
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart?: Chart;
  selectedYear = '2022';
  years = ['2019','2020','2021','2022','2023'];
  showOrange = true;
  showBlue = true;

  // sample datasets by year (replace with API later)
  datasetsByYear: Record<string, ChartPoint[]> = {
    '2019': [
      { month:'Jan', orange:10, blue:8 },{ month:'Feb', orange:14, blue:12 },
      { month:'Mar', orange:18, blue:15 },{ month:'Apr', orange:22, blue:20 },
      { month:'May', orange:24, blue:18 },{ month:'Jun', orange:30, blue:22 },
      { month:'Jul', orange:28, blue:20 },{ month:'Aug', orange:26, blue:18 },
      { month:'Sep', orange:32, blue:22 },{ month:'Oct', orange:34, blue:26 },
      { month:'Nov', orange:36, blue:30 },{ month:'Dec', orange:40, blue:34 }
    ],
    '2020': [
      { month:'Jan', orange:12, blue:10 },{ month:'Feb', orange:16, blue:14 },
      { month:'Mar', orange:20, blue:18 },{ month:'Apr', orange:28, blue:22 },
      { month:'May', orange:34, blue:24 },{ month:'Jun', orange:42, blue:28 },
      { month:'Jul', orange:38, blue:26 },{ month:'Aug', orange:36, blue:24 },
      { month:'Sep', orange:40, blue:30 },{ month:'Oct', orange:44, blue:32 },
      { month:'Nov', orange:48, blue:36 },{ month:'Dec', orange:52, blue:40 }
    ],
    '2021': [
      { month:'Jan', orange:20, blue:25 },{ month:'Feb', orange:18, blue:22 },
      { month:'Mar', orange:35, blue:30 },{ month:'Apr', orange:22, blue:20 },
      { month:'May', orange:16, blue:12 },{ month:'Jun', orange:92, blue:42 }, // high peak
      { month:'Jul', orange:38, blue:28 },{ month:'Aug', orange:30, blue:26 },
      { month:'Sep', orange:44, blue:34 },{ month:'Oct', orange:36, blue:28 },
      { month:'Nov', orange:48, blue:36 },{ month:'Dec', orange:60, blue:48 }
    ],
    '2022': [
      { month:'Jan', orange:22, blue:20 },{ month:'Feb', orange:20, blue:18 },
      { month:'Mar', orange:36, blue:30 },{ month:'Apr', orange:24, blue:20 },
      { month:'May', orange:18, blue:14 },{ month:'Jun', orange:108, blue:44 },
      { month:'Jul', orange:28, blue:22 },{ month:'Aug', orange:34, blue:26 },
      { month:'Sep', orange:50, blue:38 },{ month:'Oct', orange:44, blue:36 },
      { month:'Nov', orange:58, blue:40 },{ month:'Dec', orange:70, blue:52 }
    ],
    '2023': [
      { month:'Jan', orange:30, blue:28 },{ month:'Feb', orange:26, blue:22 },
      { month:'Mar', orange:40, blue:34 },{ month:'Apr', orange:36, blue:30 },
      { month:'May', orange:20, blue:18 },{ month:'Jun', orange:94, blue:48 },
      { month:'Jul', orange:46, blue:36 },{ month:'Aug', orange:42, blue:34 },
      { month:'Sep', orange:58, blue:44 },{ month:'Oct', orange:52, blue:40 },
      { month:'Nov', orange:62, blue:46 },{ month:'Dec', orange:80, blue:60 }
    ]
  };

  // users & quick access
  users: User[] = [
    { id:1, name:'Harvey Spector', email:'harvey@capacitychemicals.com', role:'Admin', status:'Active', avatar:'👨‍💼' },
    { id:2, name:'John Doe', email:'john@capacitychemicals.com', role:'Researcher', status:'Active', avatar:'👨‍🔬' }
  ];
  selectedUsers: number[] = [0,1];

  quickAccessItems: QuickAccessItem[] = [
    { icon:'🏠', label:'Home' },{ icon:'📄', label:'Files' },{ icon:'⚙️', label:'Config' },
    { icon:'📎', label:'Quotes' },{ icon:'📚', label:'Formulas' },{ icon:'💬', label:'Chat' }
  ];

  // small UI state
  searchText = '';

  constructor() {}

  ngOnInit(): void {
    this.checkScreenSize();
  }

  ngAfterViewInit(): void {
    setTimeout(()=>this.buildChart(), 0);
  }

  ngOnDestroy(): void {
    if (this.chart) { this.chart.destroy(); }
  }

  /* ---------------- sidebar & resize ---------------- */
  @HostListener('window:resize')
  onResize() { this.checkScreenSize(); }

  checkScreenSize() {
    if (window.innerWidth <= 1024) {
      this.sidebarCollapsed = false;
      this.mobileMenuOpen = false;
    }
  }

  toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; }
  toggleMobileSidebar() { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMobileSidebar() { this.mobileMenuOpen = false; }

  /* ---------------- donut helpers ---------------- */
  getCircumference(): number { return 2 * Math.PI * 70; }
  
  // Uses dynamic active percentage
  getActiveOffset(): number { 
    const c = this.getCircumference(); 
    return c - (this.sessionData.active.percentage / 100) * c; 
  }

  /* ---------------- users ---------------- */
  isUserSelected(i:number) { return this.selectedUsers.includes(i); }
  toggleUserSelection(i:number) {
    const idx = this.selectedUsers.indexOf(i);
    if (idx > -1) this.selectedUsers.splice(idx,1); else this.selectedUsers.push(i);
  }
  toggleAllUsers() {
    this.selectedUsers = (this.selectedUsers.length === this.users.length) ? [] : this.users.map((_,i)=>i);
  }
  isAllUsersSelected() { return this.selectedUsers.length === this.users.length; }
  onUserAction(user:User) { console.log('action', user); }

  /* ---------------- quick access ---------------- */
  onQuickAccessClick(item: QuickAccessItem) { console.log('quick', item); }

  /* ---------------- chart building & controls ---------------- */
  buildChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d')!;
    if (this.chart) this.chart.destroy();

    const points = this.datasetsByYear[this.selectedYear].map(p => p.orange);
    const labels = this.datasetsByYear[this.selectedYear].map(p => p.month);
    const bluePoints = this.datasetsByYear[this.selectedYear].map(p => p.blue);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(255,178,89,0.25)');
    gradient.addColorStop(1, 'rgba(255,178,89,0.02)');

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Orange',
            data: points,
            borderColor: '#ffb259',
            backgroundColor: gradient,
            tension: 0.36,
            fill: true,
            pointRadius: 5,
            borderWidth: 3,
            hidden: !this.showOrange
          },
          {
            label: 'Blue',
            data: bluePoints,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            tension: 0.36,
            fill: true,
            pointRadius: 5,
            borderWidth: 3,
            hidden: !this.showBlue
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y;
                return `${ctx.dataset.label}: ${v}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            beginAtZero: true,
            ticks: { stepSize: 20 }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
    this.drawPeakBadge();
  }

  downloadChart() {
  if (!this.chart) {
    console.warn('Chart not ready yet.');
    return;
  }

  try {
    // convert chart to Base64 PNG
    const imageURL = this.chart.toBase64Image();

    // create hidden download link
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = `analytics-chart-${this.selectedYear}.png`;

    // trigger download
    link.click();
    link.remove();
  } catch (err) {
    console.error('Chart download failed:', err);
  }
}

  toggleSeries(series:'orange'|'blue') {
    if (series === 'orange') this.showOrange = !this.showOrange;
    else this.showBlue = !this.showBlue;
    if (!this.chart) return;
    const idx = (series === 'orange' ? 0 : 1);
    const ds = this.chart.data.datasets!;
    if (ds && ds[idx]) ds[idx].hidden = !(series === 'orange' ? this.showOrange : this.showBlue);
    this.chart.update();
    this.drawPeakBadge();
  }

  onYearChange(y: string) {
    this.selectedYear = y;
    this.buildChart();
  }

  drawPeakBadge() {
  if (!this.chart) return;

  const chartRef = this.chart; // <-- SAVE REFERENCE (fixes TS2532)

  const ds = chartRef.data.datasets![0].data as number[];
  const visibleData = this.showOrange
    ? (chartRef.data.datasets![0].data as number[])
    : (chartRef.data.datasets![1].data as number[]);

  const max = Math.max(...visibleData.map(v => Number(v)));
  const idx = visibleData.indexOf(max);

  const meta = chartRef.getDatasetMeta(this.showOrange ? 0 : 1);
  const point = meta.data[idx];
  if (!point) return;

  setTimeout(() => {
    if (!chartRef) return; // safety check

    const ctx = chartRef.ctx as CanvasRenderingContext2D;

    chartRef.update(); // <-- no error now

    const x = point.x;
    const y = point.y - 20;
    const text = `${Math.round(max)}%`;

    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#ffb259';
    ctx.font = '600 12px Inter, system-ui';

    const tw = ctx.measureText(text).width;
    const boxW = tw + 16;
    const boxH = 20;
    const rx = 6;

    // Rounded rectangle
    ctx.moveTo(x - boxW/2 + rx, y);
    ctx.lineTo(x + boxW/2 - rx, y);
    ctx.quadraticCurveTo(x + boxW/2, y, x + boxW/2, y + rx);
    ctx.lineTo(x + boxW/2, y + boxH - rx);
    ctx.quadraticCurveTo(x + boxW/2, y + boxH, x + boxW/2 - rx, y + boxH);
    ctx.lineTo(x - boxW/2 + rx, y + boxH);
    ctx.quadraticCurveTo(x - boxW/2, y + boxH, x - boxW/2, y + boxH - rx);
    ctx.lineTo(x - boxW/2, y + rx);
    ctx.quadraticCurveTo(x - boxW/2, y, x - boxW/2 + rx, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + boxH / 2);
    ctx.restore();
  }, 50);
}

}