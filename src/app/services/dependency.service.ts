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
    // Focused mock: a single subject system interacting with HP NonStop ITP,
    // multiple databases, and message queues/brokers.
    const subjectSystem: Service = {
      id: 'sys',
      name: 'Payment Orchestrator',
      type: ServiceType.MICROSERVICE,
      description: 'Subject system whose interactions are being mapped',
      environment: 'production',
      team: 'Core Payments',
      owner: 'Payments Platform',
      version: '3.4.0',
      lastSeen: new Date(),
      status: ServiceStatus.ACTIVE,
      criticality: CriticalityLevel.CRITICAL,
      uptime: 99.97,
      responseTime: 95,
      errorRate: 0.08,
      tags: ['payments', 'core', 'subject-system'],
      metadata: { language: 'Java', framework: 'Spring Boot' }
    };

    const hpNonStopItp: Service = {
      id: 'itp',
      name: 'HP NonStop ITP',
      type: ServiceType.EXTERNAL_SERVICE,
      description: 'Transaction processing on HP NonStop ITP',
      environment: 'production',
      team: 'Mainframe Ops',
      owner: 'Mainframe Team',
      version: 'v1',
      lastSeen: new Date(),
      status: ServiceStatus.ACTIVE,
      criticality: CriticalityLevel.CRITICAL,
      uptime: 99.99,
      responseTime: 40,
      errorRate: 0.02,
      tags: ['nonstop', 'itp', 'transaction'],
      metadata: { protocol: 'TCP', port: 1025 }
    };

    // Databases (multiple)
    const oracleCore: Service = {
      id: 'db-oracle',
      name: 'Core Banking DB (Oracle)',
      type: ServiceType.DATABASE,
      description: 'Oracle database for core banking',
      environment: 'production',
      team: 'DBA',
      owner: 'Data Platform',
      version: '19c',
      lastSeen: new Date(),
      status: ServiceStatus.ACTIVE,
      criticality: CriticalityLevel.CRITICAL,
      uptime: 99.95,
      responseTime: 7,
      errorRate: 0.03,
      tags: ['oracle', 'core-banking'],
      metadata: { engine: 'Oracle', host: 'oracle-core.company.com' }
    };

    const postgresCustomer: Service = {
      id: 'db-pg',
      name: 'Customer DB (PostgreSQL)',
      type: ServiceType.DATABASE,
      description: 'Customer data store',
      environment: 'production',
      team: 'DBA',
      owner: 'Customer Data',
      version: '14',
      lastSeen: new Date(),
      status: ServiceStatus.ACTIVE,
      criticality: CriticalityLevel.HIGH,
      uptime: 99.9,
      responseTime: 6,
      errorRate: 0.02,
      tags: ['postgresql', 'customers'],
      metadata: { engine: 'PostgreSQL', host: 'pg-customers.company.com' }
    };

    const db2Ledger: Service = {
      id: 'db-db2',
      name: 'Ledger DB (DB2)',
      type: ServiceType.DATABASE,
      description: 'Financial ledger',
      environment: 'production',
      team: 'Finance IT',
      owner: 'Finance',
      version: '11.5',
      lastSeen: new Date(),
      status: ServiceStatus.ACTIVE,
      criticality: CriticalityLevel.CRITICAL,
      uptime: 99.9,
      responseTime: 9,
      errorRate: 0.05,
      tags: ['db2', 'ledger'],
      metadata: { engine: 'DB2', host: 'db2-ledger.company.com' }
    };

    // Messaging
    const ibmMq: Service = {
      id: 'mq-ibm',
      name: 'Payments MQ (IBM MQ)',
      type: ServiceType.QUEUE,
      description: 'Synchronous/async payments queue',
      environment: 'production',
      team: 'Messaging',
      owner: 'Middleware',
      version: '9.3',
      lastSeen: new Date(),
      status: ServiceStatus.ACTIVE,
      criticality: CriticalityLevel.HIGH,
      uptime: 99.99,
      responseTime: 3,
      errorRate: 0.01,
      tags: ['ibm-mq', 'payments'],
      metadata: { queueManager: 'QM1', channel: 'SYSTEM.DEF.SVRCONN' }
    };

    const kafkaBroker: Service = {
      id: 'mq-kafka',
      name: 'Events Kafka',
      type: ServiceType.MESSAGE_BROKER,
      description: 'Event streaming for notifications & audit',
      environment: 'production',
      team: 'Messaging',
      owner: 'Data Streaming',
      version: '3.6',
      lastSeen: new Date(),
      status: ServiceStatus.ACTIVE,
      criticality: CriticalityLevel.MEDIUM,
      uptime: 99.9,
      responseTime: 4,
      errorRate: 0.02,
      tags: ['kafka', 'events'],
      metadata: { cluster: 'kafka-prod', topics: ['payments.events', 'notifications.events'] }
    };

    const sampleServices: Service[] = [
      subjectSystem,
      hpNonStopItp,
      oracleCore,
      postgresCustomer,
      db2Ledger,
      ibmMq,
      kafkaBroker
    ];

    const sampleDependencies: Dependency[] = [
      // Subject system interactions
      {
        id: 'dep-itp',
        sourceServiceId: 'sys',
        targetServiceId: 'itp',
        dependencyType: DependencyType.API_CALL,
        usageCount: 25000,
        lastUsed: new Date(),
        description: 'Submit and inquire transactions on HP NonStop ITP',
        isActive: true,
        weight: 9,
        frequency: 'HIGH',
        isCritical: true,
        failureImpact: 'HIGH',
        latency: 40,
        errorRate: 0.08,
        metadata: { protocol: 'TCP', operation: 'TRANSACTION', endpoint: 'itp:1025' }
      },
      {
        id: 'dep-oracle',
        sourceServiceId: 'sys',
        targetServiceId: 'db-oracle',
        dependencyType: DependencyType.DATABASE_QUERY,
        usageCount: 120000,
        lastUsed: new Date(),
        description: 'Core account writes & reads',
        isActive: true,
        weight: 10,
        frequency: 'HIGH',
        isCritical: true,
        failureImpact: 'HIGH',
        latency: 7,
        errorRate: 0.03,
        metadata: { schema: 'CORE', operation: 'SELECT/UPDATE' }
      },
      {
        id: 'dep-pg',
        sourceServiceId: 'sys',
        targetServiceId: 'db-pg',
        dependencyType: DependencyType.DATABASE_QUERY,
        usageCount: 65000,
        lastUsed: new Date(),
        description: 'Customer profile reads',
        isActive: true,
        weight: 7,
        frequency: 'HIGH',
        isCritical: true,
        failureImpact: 'MEDIUM',
        latency: 6,
        errorRate: 0.02,
        metadata: { schema: 'customers', operation: 'SELECT' }
      },
      {
        id: 'dep-db2',
        sourceServiceId: 'sys',
        targetServiceId: 'db-db2',
        dependencyType: DependencyType.DATABASE_QUERY,
        usageCount: 42000,
        lastUsed: new Date(),
        description: 'Ledger postings',
        isActive: true,
        weight: 8,
        frequency: 'HIGH',
        isCritical: true,
        failureImpact: 'HIGH',
        latency: 9,
        errorRate: 0.05,
        metadata: { schema: 'ledger', operation: 'INSERT' }
      },
      {
        id: 'dep-mq',
        sourceServiceId: 'sys',
        targetServiceId: 'mq-ibm',
        dependencyType: DependencyType.MESSAGE_QUEUE,
        usageCount: 90000,
        lastUsed: new Date(),
        description: 'Enqueue payment instructions and status updates',
        isActive: true,
        weight: 8,
        frequency: 'HIGH',
        isCritical: true,
        failureImpact: 'MEDIUM',
        latency: 12,
        errorRate: 0.02,
        metadata: { queue: 'PAYMENTS.IN', dlq: 'DLQ.PAYMENTS' }
      },
      {
        id: 'dep-kafka',
        sourceServiceId: 'sys',
        targetServiceId: 'mq-kafka',
        dependencyType: DependencyType.EVENT_STREAM,
        usageCount: 30000,
        lastUsed: new Date(),
        description: 'Publish payment event notifications',
        isActive: true,
        weight: 6,
        frequency: 'MEDIUM',
        isCritical: false,
        failureImpact: 'LOW',
        latency: 8,
        errorRate: 0.01,
        metadata: { topic: 'payments.events', key: 'paymentId' }
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
