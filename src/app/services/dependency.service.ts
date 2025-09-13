import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Service, Dependency, UsageAnalytics } from '../models/service.model';

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
    this.saveToLocalStorage();
  }

  updateService(service: Service): void {
    const currentServices = this.servicesSubject.value;
    const index = currentServices.findIndex(s => s.id === service.id);
    if (index !== -1) {
      currentServices[index] = service;
      this.servicesSubject.next([...currentServices]);
      this.saveToLocalStorage();
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
    
    this.saveToLocalStorage();
  }

  getServiceById(id: string): Service | undefined {
    return this.servicesSubject.value.find(s => s.id === id);
  }

  // Dependency Management
  addDependency(dependency: Dependency): void {
    const currentDependencies = this.dependenciesSubject.value;
    this.dependenciesSubject.next([...currentDependencies, dependency]);
    this.saveToLocalStorage();
  }

  updateDependency(dependency: Dependency): void {
    const currentDependencies = this.dependenciesSubject.value;
    const index = currentDependencies.findIndex(d => d.id === dependency.id);
    if (index !== -1) {
      currentDependencies[index] = dependency;
      this.dependenciesSubject.next([...currentDependencies]);
      this.saveToLocalStorage();
    }
  }

  deleteDependency(dependencyId: string): void {
    const currentDependencies = this.dependenciesSubject.value;
    const filteredDependencies = currentDependencies.filter(d => d.id !== dependencyId);
    this.dependenciesSubject.next(filteredDependencies);
    this.saveToLocalStorage();
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
    this.saveToLocalStorage();
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

  // Data Persistence
  private saveToLocalStorage(): void {
    localStorage.setItem('dependency-mapping-services', JSON.stringify(this.servicesSubject.value));
    localStorage.setItem('dependency-mapping-dependencies', JSON.stringify(this.dependenciesSubject.value));
    localStorage.setItem('dependency-mapping-analytics', JSON.stringify(this.analyticsSubject.value));
  }

  private loadFromLocalStorage(): void {
    const services = localStorage.getItem('dependency-mapping-services');
    const dependencies = localStorage.getItem('dependency-mapping-dependencies');
    const analytics = localStorage.getItem('dependency-mapping-analytics');

    if (services) {
      this.servicesSubject.next(JSON.parse(services));
    }
    if (dependencies) {
      this.dependenciesSubject.next(JSON.parse(dependencies));
    }
    if (analytics) {
      this.analyticsSubject.next(JSON.parse(analytics));
    }
  }

  private loadInitialData(): void {
    this.loadFromLocalStorage();
    
    // If no data exists, load sample data
    if (this.servicesSubject.value.length === 0) {
      this.loadSampleData();
    }
  }

  private loadSampleData(): void {
    const sampleServices: Service[] = [
      {
        id: '1',
        name: 'User Service',
        type: 'JAVA_APP' as any,
        description: 'Handles user authentication and profile management',
        url: 'https://user-service.company.com',
        port: 8080,
        environment: 'production',
        team: 'Platform Team',
        owner: 'John Doe',
        version: '2.1.0',
        lastSeen: new Date(),
        status: 'ACTIVE' as any,
        criticality: 'HIGH' as any,
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1,
        tags: ['authentication', 'user-management'],
        metadata: { version: '2.1.0', framework: 'Spring Boot' }
      },
      {
        id: '2',
        name: 'Order Service',
        type: 'DOTNET_APP' as any,
        description: 'Manages order processing and fulfillment',
        url: 'https://order-service.company.com',
        port: 5000,
        environment: 'production',
        team: 'E-commerce Team',
        owner: 'Jane Smith',
        version: '1.5.2',
        lastSeen: new Date(),
        status: 'ACTIVE' as any,
        criticality: 'CRITICAL' as any,
        uptime: 99.95,
        responseTime: 85,
        errorRate: 0.05,
        tags: ['orders', 'e-commerce'],
        metadata: { version: '1.5.2', framework: '.NET Core' }
      },
      {
        id: '3',
        name: 'Payment Gateway',
        type: 'EXTERNAL_SERVICE' as any,
        description: 'Third-party payment processing service',
        url: 'https://api.stripe.com',
        environment: 'production',
        team: 'External',
        owner: 'Stripe Inc.',
        version: '2020-08-27',
        lastSeen: new Date(),
        status: 'ACTIVE' as any,
        criticality: 'CRITICAL' as any,
        uptime: 99.99,
        responseTime: 200,
        errorRate: 0.01,
        tags: ['payment', 'external'],
        metadata: { provider: 'Stripe', version: '2020-08-27' }
      },
      {
        id: '4',
        name: 'User Database',
        type: 'DATABASE' as any,
        description: 'PostgreSQL database for user data',
        url: 'user-db.company.com',
        port: 5432,
        environment: 'production',
        team: 'Platform Team',
        owner: 'Database Team',
        version: '13.4',
        lastSeen: new Date(),
        status: 'ACTIVE' as any,
        criticality: 'HIGH' as any,
        uptime: 99.8,
        responseTime: 5,
        errorRate: 0.02,
        tags: ['database', 'postgresql'],
        metadata: { engine: 'PostgreSQL', version: '13.4' }
      }
    ];

    const sampleDependencies: Dependency[] = [
      {
        id: 'dep1',
        sourceServiceId: '2',
        targetServiceId: '1',
        dependencyType: 'HTTP_REQUEST' as any,
        usageCount: 1250,
        lastUsed: new Date(),
        description: 'Order service calls user service for customer validation',
        isActive: true,
        weight: 8,
        frequency: 'HIGH' as any,
        isCritical: true,
        failureImpact: 'HIGH' as any,
        latency: 150,
        errorRate: 0.5,
        metadata: { endpoint: '/api/users/validate', method: 'POST' }
      },
      {
        id: 'dep2',
        sourceServiceId: '2',
        targetServiceId: '3',
        dependencyType: 'API_CALL' as any,
        usageCount: 890,
        lastUsed: new Date(),
        description: 'Order service processes payments via Stripe',
        isActive: true,
        weight: 10,
        frequency: 'HIGH' as any,
        isCritical: true,
        failureImpact: 'HIGH' as any,
        latency: 200,
        errorRate: 0.1,
        metadata: { endpoint: '/v1/charges', method: 'POST' }
      },
      {
        id: 'dep3',
        sourceServiceId: '1',
        targetServiceId: '4',
        dependencyType: 'DATABASE_QUERY' as any,
        usageCount: 5000,
        lastUsed: new Date(),
        description: 'User service queries user database',
        isActive: true,
        weight: 9,
        frequency: 'HIGH' as any,
        isCritical: true,
        failureImpact: 'HIGH' as any,
        latency: 5,
        errorRate: 0.02,
        metadata: { table: 'users', operation: 'SELECT' }
      }
    ];

    this.servicesSubject.next(sampleServices);
    this.dependenciesSubject.next(sampleDependencies);
    this.saveToLocalStorage();
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
      this.saveToLocalStorage();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}
