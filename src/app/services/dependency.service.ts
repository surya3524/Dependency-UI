import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Service, Dependency, UsageAnalytics, ServiceType, ServiceStatus, CriticalityLevel, DependencyType } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class DependencyService {
  private servicesSubject = new BehaviorSubject<Service[]>([]);
  private dependenciesSubject = new BehaviorSubject<Dependency[]>([]);
  private analyticsSubject = new BehaviorSubject<UsageAnalytics[]>([]);

  public services$ = this.servicesSubject.asObservable();
  public dependencies$ = this.dependenciesSubject.asObservable();
  public analytics$ = this.analyticsSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

  // Service Management
  addService(service: Service): void {
    const currentServices = this.servicesSubject.value;
    this.servicesSubject.next([...currentServices, service]);
  }

  updateService(service: Service): void {
    const currentServices = this.servicesSubject.value;
    const index = currentServices.findIndex(s => s.id === service.id);
    if (index !== -1) {
      currentServices[index] = service;
      this.servicesSubject.next([...currentServices]);
    }
  }

  deleteService(serviceId: string): void {
    const currentServices = this.servicesSubject.value;
    const filteredServices = currentServices.filter(s => s.id !== serviceId);
    this.servicesSubject.next(filteredServices);
    
    // Remove related dependencies
    const currentDependencies = this.dependenciesSubject.value;
    const filteredDependencies = currentDependencies.filter(
      d => d.sourceServiceId !== serviceId && d.targetServiceId !== serviceId
    );
    this.dependenciesSubject.next(filteredDependencies);
  }

  getServiceById(id: string): Service | undefined {
    return this.servicesSubject.value.find(s => s.id === id);
  }

  // Dependency Management
  addDependency(dependency: Dependency): void {
    const currentDependencies = this.dependenciesSubject.value;
    this.dependenciesSubject.next([...currentDependencies, dependency]);
  }

  updateDependency(dependency: Dependency): void {
    const currentDependencies = this.dependenciesSubject.value;
    const index = currentDependencies.findIndex(d => d.id === dependency.id);
    if (index !== -1) {
      currentDependencies[index] = dependency;
      this.dependenciesSubject.next([...currentDependencies]);
    }
  }

  deleteDependency(dependencyId: string): void {
    const currentDependencies = this.dependenciesSubject.value;
    const filteredDependencies = currentDependencies.filter(d => d.id !== dependencyId);
    this.dependenciesSubject.next(filteredDependencies);
  }

  getDependenciesForService(serviceId: string): Dependency[] {
    return this.dependenciesSubject.value.filter(
      d => d.sourceServiceId === serviceId || d.targetServiceId === serviceId
    );
  }

  // Analytics
  updateUsageAnalytics(analytics: UsageAnalytics): void {
    const currentAnalytics = this.analyticsSubject.value;
    const index = currentAnalytics.findIndex(a => a.serviceId === analytics.serviceId);
    if (index !== -1) {
      currentAnalytics[index] = analytics;
    } else {
      currentAnalytics.push(analytics);
    }
    this.analyticsSubject.next([...currentAnalytics]);
  }

  getAnalyticsForService(serviceId: string): UsageAnalytics | undefined {
    return this.analyticsSubject.value.find(a => a.serviceId === serviceId);
  }

  // Search and Filter
  searchServices(query: string): Service[] {
    const services = this.servicesSubject.value;
    const lowerQuery = query.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(lowerQuery) ||
      service.description?.toLowerCase().includes(lowerQuery) ||
      service.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getServicesByType(type: string): Service[] {
    return this.servicesSubject.value.filter(service => service.type === type);
  }

  getServicesByStatus(status: string): Service[] {
    return this.servicesSubject.value.filter(service => service.status === status);
  }

  private loadInitialData(): void {
    // Always generate fresh mock data; do not use localStorage
    this.generateMockApplications(10, 15);
  }
  private generateMockApplications(numApps: number, depsPerApp: number): void {
    const services: Service[] = [];
    const dependencies: Dependency[] = [];

    // Create primary applications
    for (let i = 1; i <= numApps; i++) {
      services.push({
        id: `app-${i}`,
        name: `Application ${i}`,
        type: ServiceType.MICROSERVICE,
        description: `Generated application ${i}`,
        environment: 'production',
        team: 'Team ' + ((i % 5) + 1),
        owner: 'Owner ' + ((i % 3) + 1),
        version: `v${(i % 4) + 1}.0.${(i % 10)}`,
        lastSeen: new Date(),
        status: ServiceStatus.ACTIVE,
        criticality: [CriticalityLevel.CRITICAL, CriticalityLevel.HIGH, CriticalityLevel.MEDIUM, CriticalityLevel.LOW][i % 4],
        uptime: 99 + Math.random(),
        responseTime: Math.floor(50 + Math.random() * 150),
        errorRate: parseFloat((Math.random() * 1).toFixed(2)),
        tags: ['generated', 'app'],
        metadata: { language: ['Java', 'Node', 'Python'][i % 3] }
      });
    }

    // Create a pool of additional applications to depend on
    const extraPoolSize = Math.max(depsPerApp + 5, 25);
    for (let j = 1; j <= extraPoolSize; j++) {
      services.push({
        id: `svc-${j}`,
        name: `Service ${j}`,
        type: ServiceType.MICROSERVICE,
        description: `Support service ${j}`,
        environment: 'production',
        team: 'Shared Services',
        owner: 'Platform',
        version: `v${(j % 3) + 1}.${(j % 9)}`,
        lastSeen: new Date(),
        status: ServiceStatus.ACTIVE,
        criticality: [CriticalityLevel.HIGH, CriticalityLevel.MEDIUM, CriticalityLevel.LOW][j % 3],
        uptime: 99 + Math.random(),
        responseTime: Math.floor(20 + Math.random() * 100),
        errorRate: parseFloat((Math.random() * 1).toFixed(2)),
        tags: ['generated', 'support'],
        metadata: {}
      });
    }

    // Build dependencies: each primary app depends on depsPerApp distinct services from pool
    const poolIds = services.filter(s => s.id.startsWith('svc-')).map(s => s.id);
    const depTypes = [
      DependencyType.API_CALL,
      DependencyType.GRPC_CALL,
      DependencyType.REST_API,
      DependencyType.WEBSOCKET,
      DependencyType.DIRECT_DEPENDENCY
    ];

    for (let i = 1; i <= numApps; i++) {
      const sourceId = `app-${i}`;
      const chosen = new Set<string>();
      while (chosen.size < depsPerApp) {
        const target = poolIds[Math.floor(Math.random() * poolIds.length)];
        if (!chosen.has(target) && target !== sourceId) {
          chosen.add(target);
        }
      }
      Array.from(chosen).forEach((targetId, idx) => {
        const t = depTypes[idx % depTypes.length];
        dependencies.push({
          id: `dep-${sourceId}-${idx}`,
          sourceServiceId: sourceId,
          targetServiceId: targetId,
          dependencyType: t,
          usageCount: Math.floor(1000 + Math.random() * 100000),
          lastUsed: new Date(),
          description: `${sourceId} -> ${targetId}`,
          isActive: true,
          weight: Math.max(1, Math.floor(Math.random() * 10)),
          frequency: ['HIGH', 'MEDIUM', 'LOW'][idx % 3] as 'HIGH' | 'MEDIUM' | 'LOW',
          isCritical: Math.random() < 0.4,
          failureImpact: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)] as 'HIGH' | 'MEDIUM' | 'LOW',
          latency: Math.floor(5 + Math.random() * 200),
          errorRate: parseFloat((Math.random() * 2).toFixed(2)),
          metadata: {}
        });
      });
    }

    this.servicesSubject.next(services);
    this.dependenciesSubject.next(dependencies);
  }

  // Export/Import
  exportData(): string {
    return JSON.stringify({
      services: this.servicesSubject.value,
      dependencies: this.dependenciesSubject.value,
      analytics: this.analyticsSubject.value,
      exportDate: new Date().toISOString()
    });
  }

  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.services) {
        this.servicesSubject.next(parsed.services);
      }
      if (parsed.dependencies) {
        this.dependenciesSubject.next(parsed.dependencies);
      }
      if (parsed.analytics) {
        this.analyticsSubject.next(parsed.analytics);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}
