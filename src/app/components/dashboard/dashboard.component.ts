import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DependencyService } from '../../services/dependency.service';
import { Service, Dependency, ServiceType, ServiceStatus } from '../../models/service.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  dependencies: Dependency[] = [];
  filteredServices: Service[] = [];
  searchQuery = '';
  selectedServiceType = '';
  selectedStatus = '';
  
  // Statistics
  totalServices = 0;
  activeServices = 0;
  totalDependencies = 0;
  serviceTypeCounts: { [key: string]: number } = {};
  
  private destroy$ = new Subject<void>();

  constructor(private dependencyService: DependencyService) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.dependencyService.services$
      .pipe(takeUntil(this.destroy$))
      .subscribe(services => {
        this.services = services;
        this.filteredServices = services;
        this.updateStatistics();
        this.applyFilters();
      });

    this.dependencyService.dependencies$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dependencies => {
        this.dependencies = dependencies;
        this.updateStatistics();
      });
  }

  private setupSubscriptions(): void {
    // Additional subscriptions can be added here
  }

  private updateStatistics(): void {
    this.totalServices = this.services.length;
    this.activeServices = this.services.filter(s => s.status === ServiceStatus.ACTIVE).length;
    this.totalDependencies = this.dependencies.length;
    
    // Count services by type
    this.serviceTypeCounts = {};
    this.services.forEach(service => {
      this.serviceTypeCounts[service.type] = (this.serviceTypeCounts[service.type] || 0) + 1;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onServiceTypeChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.services];

    // Apply search filter
    if (this.searchQuery.trim()) {
      filtered = this.dependencyService.searchServices(this.searchQuery);
    }

    // Apply service type filter
    if (this.selectedServiceType) {
      filtered = filtered.filter(service => service.type === this.selectedServiceType);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(service => service.status === this.selectedStatus);
    }

    this.filteredServices = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedServiceType = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  getServiceTypeOptions(): string[] {
    return Object.values(ServiceType);
  }

  getStatusOptions(): string[] {
    return Object.values(ServiceStatus);
  }

  getServiceTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getDependenciesForService(serviceId: string): Dependency[] {
    return this.dependencies.filter(
      dep => dep.sourceServiceId === serviceId || dep.targetServiceId === serviceId
    );
  }

  getServiceById(serviceId: string): Service | undefined {
    return this.services.find(s => s.id === serviceId);
  }

  getServiceTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'JAVA_APP': '☕',
      'DOTNET_APP': '🔷',
      'ANGULAR_APP': '🅰️',
      'DATABASE': '🗄️',
      'API': '🔌',
      'QUEUE': '📨',
      'EXTERNAL_SERVICE': '🌐'
    };
    return iconMap[type] || '❓';
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'ACTIVE': 'green',
      'INACTIVE': 'red',
      'DEPRECATED': 'orange',
      'UNKNOWN': 'gray'
    };
    return colorMap[status] || 'gray';
  }
}
