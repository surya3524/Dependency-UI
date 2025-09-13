import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DependencyService } from '../../services/dependency.service';
import { Service, Dependency, ServiceType, ServiceStatus, CriticalityLevel, FilterOptions, ServiceGroup, Alert } from '../../models/service.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  
  // Enhanced filtering
  selectedServiceTypes: string[] = [];
  selectedStatuses: string[] = [];
  selectedCriticalityLevels: string[] = [];
  selectedTeams: string[] = [];
  selectedEnvironments: string[] = [];
  showAdvancedFilters = false;
  activeFilters: Array<{label: string, value: string, type: string}> = [];
  
  // View controls
  viewMode: 'grid' | 'list' | 'table' = 'grid';
  expandedServices = new Set<string>();
  
  // Statistics
  totalServices = 0;
  activeServices = 0;
  totalDependencies = 0;
  criticalDependencies = 0;
  uniqueTeams: string[] = [];
  environments: string[] = [];
  unreadAlerts = 0;
  serviceTypeCounts: { [key: string]: number } = {};
  
  // Date range
  dateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  };
  
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
    this.criticalDependencies = this.dependencies.filter(d => d.isCritical).length;
    
    // Count unique teams and environments
    const teams = new Set(this.services.map(s => s.team).filter((team): team is string => Boolean(team)));
    this.uniqueTeams = Array.from(teams);
    
    const envs = new Set(this.services.map(s => s.environment));
    this.environments = Array.from(envs);
    
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

  applyFilters(): void {
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

    // Apply advanced filters
    if (this.selectedServiceTypes.length > 0) {
      filtered = filtered.filter(service => this.selectedServiceTypes.includes(service.type));
    }

    if (this.selectedStatuses.length > 0) {
      filtered = filtered.filter(service => this.selectedStatuses.includes(service.status));
    }

    if (this.selectedCriticalityLevels.length > 0) {
      filtered = filtered.filter(service => this.selectedCriticalityLevels.includes(service.criticality));
    }

    if (this.selectedTeams.length > 0) {
      filtered = filtered.filter(service => service.team && this.selectedTeams.includes(service.team));
    }

    if (this.selectedEnvironments.length > 0) {
      filtered = filtered.filter(service => this.selectedEnvironments.includes(service.environment));
    }

    // Apply date range filter
    filtered = filtered.filter(service => {
      const serviceDate = new Date(service.lastSeen);
      return serviceDate >= this.dateRange.start && serviceDate <= this.dateRange.end;
    });

    this.filteredServices = filtered;
    this.updateActiveFilters();
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
      'UNKNOWN': 'gray',
      'MAINTENANCE': 'blue',
      'ERROR': 'red'
    };
    return colorMap[status] || 'gray';
  }

  // Enhanced filtering methods
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onServiceTypeFilterChange(type: string, event: any): void {
    if (event.target.checked) {
      this.selectedServiceTypes.push(type);
    } else {
      this.selectedServiceTypes = this.selectedServiceTypes.filter(t => t !== type);
    }
    this.applyFilters();
  }

  onStatusFilterChange(status: string, event: any): void {
    if (event.target.checked) {
      this.selectedStatuses.push(status);
    } else {
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    }
    this.applyFilters();
  }

  onCriticalityFilterChange(level: string, event: any): void {
    if (event.target.checked) {
      this.selectedCriticalityLevels.push(level);
    } else {
      this.selectedCriticalityLevels = this.selectedCriticalityLevels.filter(l => l !== level);
    }
    this.applyFilters();
  }

  removeFilter(filter: any): void {
    switch (filter.type) {
      case 'serviceType':
        this.selectedServiceTypes = this.selectedServiceTypes.filter(t => t !== filter.value);
        break;
      case 'status':
        this.selectedStatuses = this.selectedStatuses.filter(s => s !== filter.value);
        break;
      case 'criticality':
        this.selectedCriticalityLevels = this.selectedCriticalityLevels.filter(l => l !== filter.value);
        break;
      case 'team':
        this.selectedTeams = this.selectedTeams.filter(t => t !== filter.value);
        break;
      case 'environment':
        this.selectedEnvironments = this.selectedEnvironments.filter(e => e !== filter.value);
        break;
    }
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.selectedServiceType = '';
    this.selectedStatus = '';
    this.selectedServiceTypes = [];
    this.selectedStatuses = [];
    this.selectedCriticalityLevels = [];
    this.selectedTeams = [];
    this.selectedEnvironments = [];
    this.dateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    };
    this.applyFilters();
  }

  private updateActiveFilters(): void {
    this.activeFilters = [];
    
    if (this.searchQuery) {
      this.activeFilters.push({ label: 'Search', value: this.searchQuery, type: 'search' });
    }
    
    this.selectedServiceTypes.forEach(type => {
      this.activeFilters.push({ label: 'Type', value: this.getServiceTypeLabel(type), type: 'serviceType' });
    });
    
    this.selectedStatuses.forEach(status => {
      this.activeFilters.push({ label: 'Status', value: this.getStatusLabel(status), type: 'status' });
    });
    
    this.selectedCriticalityLevels.forEach(level => {
      this.activeFilters.push({ label: 'Criticality', value: this.getCriticalityLabel(level), type: 'criticality' });
    });
    
    this.selectedTeams.forEach(team => {
      this.activeFilters.push({ label: 'Team', value: team, type: 'team' });
    });
    
    this.selectedEnvironments.forEach(env => {
      this.activeFilters.push({ label: 'Environment', value: env, type: 'environment' });
    });
  }

  // View control methods
  setViewMode(mode: 'grid' | 'list' | 'table'): void {
    this.viewMode = mode;
  }

  toggleDependencies(serviceId: string): void {
    if (this.expandedServices.has(serviceId)) {
      this.expandedServices.delete(serviceId);
    } else {
      this.expandedServices.add(serviceId);
    }
  }

  // Utility methods
  getCriticalityLevels(): string[] {
    return Object.values(CriticalityLevel);
  }

  getCriticalityLabel(level: string): string {
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  getDependencyTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getServiceCardClass(service: Service): string {
    const classes = ['service-card'];
    if (service.status === ServiceStatus.ACTIVE) classes.push('active');
    if (service.status === ServiceStatus.ERROR) classes.push('error');
    if (service.criticality === CriticalityLevel.CRITICAL) classes.push('critical');
    return classes.join(' ');
  }

  getWeightClass(weight: number): string {
    if (weight >= 8) return 'high';
    if (weight >= 5) return 'medium';
    return 'low';
  }

  getServiceTypeDistribution(): Array<{type: string, count: number}> {
    return Object.entries(this.serviceTypeCounts).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);
  }

  // Action methods
  exportData(): void {
    const data = this.dependencyService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dependency-mapping-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  importData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const success = this.dependencyService.importData(e.target.result);
          if (success) {
            this.loadData();
            alert('Data imported successfully!');
          } else {
            alert('Error importing data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  refreshData(): void {
    this.loadData();
  }

  showAlerts(): void {
    // TODO: Implement alerts view
    console.log('Show alerts');
  }

  showServiceDetails(service: Service): void {
    // TODO: Implement service details modal
    console.log('Show service details:', service);
  }
}
