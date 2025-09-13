export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description?: string;
  url?: string;
  port?: number;
  environment: string;
  team?: string;
  lastSeen: Date;
  status: ServiceStatus;
  tags: string[];
  metadata: Record<string, any>;
  healthCheck?: HealthCheck;
  criticality: CriticalityLevel;
  owner?: string;
  version?: string;
  deploymentDate?: Date;
  lastDeployment?: Date;
  uptime?: number;
  responseTime?: number;
  errorRate?: number;
}

export enum ServiceType {
  JAVA_APP = 'JAVA_APP',
  DOTNET_APP = 'DOTNET_APP',
  ANGULAR_APP = 'ANGULAR_APP',
  REACT_APP = 'REACT_APP',
  VUE_APP = 'VUE_APP',
  NODE_APP = 'NODE_APP',
  PYTHON_APP = 'PYTHON_APP',
  DATABASE = 'DATABASE',
  API = 'API',
  QUEUE = 'QUEUE',
  MESSAGE_BROKER = 'MESSAGE_BROKER',
  CACHE = 'CACHE',
  LOAD_BALANCER = 'LOAD_BALANCER',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  MICROSERVICE = 'MICROSERVICE',
  MONOLITH = 'MONOLITH'
}

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEPRECATED = 'DEPRECATED',
  UNKNOWN = 'UNKNOWN',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
}

export enum CriticalityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface HealthCheck {
  endpoint: string;
  interval: number; // in seconds
  timeout: number; // in seconds
  lastCheck?: Date;
  status: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';
  responseTime?: number;
  errorMessage?: string;
}

export interface Dependency {
  id: string;
  sourceServiceId: string;
  targetServiceId: string;
  dependencyType: DependencyType;
  usageCount: number;
  lastUsed: Date;
  description?: string;
  isActive: boolean;
  metadata: Record<string, any>;
  weight: number; // 1-10 scale for dependency strength
  frequency: 'HIGH' | 'MEDIUM' | 'LOW';
  isCritical: boolean;
  failureImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  latency?: number; // in milliseconds
  errorRate?: number; // percentage
  retryPolicy?: RetryPolicy;
}

export enum DependencyType {
  HTTP_REQUEST = 'HTTP_REQUEST',
  DATABASE_QUERY = 'DATABASE_QUERY',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  FILE_SYSTEM = 'FILE_SYSTEM',
  API_CALL = 'API_CALL',
  DIRECT_DEPENDENCY = 'DIRECT_DEPENDENCY',
  GRPC_CALL = 'GRPC_CALL',
  WEBSOCKET = 'WEBSOCKET',
  REST_API = 'REST_API',
  GRAPHQL = 'GRAPHQL',
  SOAP = 'SOAP',
  EVENT_STREAM = 'EVENT_STREAM',
  CACHE_ACCESS = 'CACHE_ACCESS',
  SERVICE_DISCOVERY = 'SERVICE_DISCOVERY'
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'LINEAR' | 'EXPONENTIAL' | 'FIXED';
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
}

export interface UsageAnalytics {
  serviceId: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastActivity: Date;
  peakUsageTime: Date;
  dependencies: DependencyUsage[];
}

export interface DependencyUsage {
  dependencyId: string;
  usageCount: number;
  lastUsed: Date;
  averageResponseTime: number;
  errorCount: number;
}

export interface ServiceMetrics {
  serviceId: string;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface FilterOptions {
  serviceTypes: string[];
  statuses: string[];
  environments: string[];
  teams: string[];
  criticalityLevels: string[];
  tags: string[];
  searchQuery: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  showInactive: boolean;
  showDeprecated: boolean;
}

export interface GraphLayout {
  name: string;
  displayName: string;
  description: string;
  config: any;
}

export interface ServiceGroup {
  id: string;
  name: string;
  description?: string;
  serviceIds: string[];
  color: string;
  tags: string[];
}

export interface Alert {
  id: string;
  serviceId: string;
  type: 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isResolved: boolean;
  metadata: Record<string, any>;
}
