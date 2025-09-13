import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import avsdf from 'cytoscape-avsdf';
import klay from 'cytoscape-klay';
import { DependencyService } from '../../services/dependency.service';
import { Service, Dependency, ServiceType, ServiceStatus, CriticalityLevel, DependencyType, GraphLayout } from '../../models/service.model';

interface CytoscapeNode {
  data: {
  id: string;
  name: string;
    type: ServiceType;
    status: ServiceStatus;
    criticality: CriticalityLevel;
    team?: string;
    environment: string;
    uptime?: number;
    responseTime?: number;
    errorRate?: number;
    dependencies?: number;
    weight?: number;
  };
  position?: { x: number; y: number };
  classes?: string[];
}

interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    type: DependencyType;
  usageCount: number;
  isActive: boolean;
    weight: number;
    frequency: string;
    isCritical: boolean;
    failureImpact: string;
    latency?: number;
    errorRate?: number;
  };
  classes?: string[];
}

@Component({
  selector: 'app-dependency-graph',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dependency-graph.component.html',
  styleUrls: ['./dependency-graph.component.scss']
})
export class DependencyGraphComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;

  services: Service[] = [];
  dependencies: Dependency[] = [];
  cy: any;
  
  // Graph controls
  selectedLayout = 'cose-bilkent';
  showLabels = true;
  showEdgeLabels = true;
  showMetrics = true;
  filterByType: string[] = [];
  filterByStatus: string[] = [];
  filterByCriticality: string[] = [];
  searchQuery = '';
  
  // Layout options
  layouts: GraphLayout[] = [
    { name: 'cose-bilkent', displayName: 'Force Directed', description: 'Natural force-directed layout', config: {} },
    { name: 'dagre', displayName: 'Hierarchical', description: 'Top-down hierarchical layout', config: {} },
    { name: 'cola', displayName: 'Constraint', description: 'Constraint-based layout', config: {} },
    { name: 'avsdf', displayName: 'Circular', description: 'Circular arrangement', config: {} },
    { name: 'klay', displayName: 'Layered', description: 'Layered graph layout', config: {} }
  ];
  
  // Statistics
  totalNodes = 0;
  totalEdges = 0;
  selectedNode: any = null;
  selectedEdge: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(private dependencyService: DependencyService) {
    // Register Cytoscape extensions
    cytoscape.use(dagre);
    cytoscape.use(cola);
    cytoscape.use(coseBilkent);
    cytoscape.use(avsdf);
    cytoscape.use(klay);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initializeGraph();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.cy) {
      this.cy.destroy();
    }
  }

  private loadData(): void {
    this.dependencyService.services$
      .pipe(takeUntil(this.destroy$))
      .subscribe(services => {
        this.services = services;
        this.updateGraph();
      });

    this.dependencyService.dependencies$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dependencies => {
        this.dependencies = dependencies;
        this.updateGraph();
      });
  }

  private initializeGraph(): void {
    const container = this.graphContainer.nativeElement;
    
    this.cy = cytoscape({
      container: container,
      elements: this.prepareGraphData(),
      style: this.getGraphStyle(),
      layout: this.getLayoutConfig(),
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'single',
      wheelSensitivity: 0.1,
      minZoom: 0.1,
      maxZoom: 3
    });

    this.setupEventHandlers();
    this.updateStatistics();
  }

  private prepareGraphData(): { nodes: CytoscapeNode[], edges: CytoscapeEdge[] } {
    const nodes: CytoscapeNode[] = this.services.map(service => ({
      data: {
      id: service.id,
      name: service.name,
      type: service.type,
        status: service.status,
        criticality: service.criticality || CriticalityLevel.MEDIUM,
        team: service.team,
        environment: service.environment,
        uptime: service.uptime,
        responseTime: service.responseTime,
        errorRate: service.errorRate,
        dependencies: this.dependencies.filter(d => d.sourceServiceId === service.id).length,
        weight: this.calculateNodeWeight(service)
      },
      classes: this.getNodeClasses(service)
    }));

    const edges: CytoscapeEdge[] = this.dependencies.map(dep => ({
      data: {
        id: dep.id,
      source: dep.sourceServiceId,
      target: dep.targetServiceId,
      type: dep.dependencyType,
      usageCount: dep.usageCount,
        isActive: dep.isActive,
        weight: dep.weight || 5,
        frequency: dep.frequency || 'MEDIUM',
        isCritical: dep.isCritical,
        failureImpact: dep.failureImpact || 'MEDIUM',
        latency: dep.latency,
        errorRate: dep.errorRate
      },
      classes: this.getEdgeClasses(dep)
    }));

    return { nodes, edges };
  }

  private getGraphStyle(): any[] {
    return [
      {
        selector: 'node',
        style: {
          'background-color': (ele: any) => this.getNodeColor(ele.data('status')),
          'border-color': (ele: any) => this.getCriticalityColor(ele.data('criticality')),
          'border-width': 3,
          'width': (ele: any) => this.getNodeSize(ele.data('dependencies')),
          'height': (ele: any) => this.getNodeSize(ele.data('dependencies')),
          'label': (ele: any) => this.showLabels ? ele.data('name') : '',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '12px',
          'font-weight': 'bold',
          'color': '#2d3748',
          'text-outline-width': 2,
          'text-outline-color': '#ffffff',
          'shape': 'round-rectangle'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#667eea',
          'border-width': 5,
          'background-color': '#e0e7ff'
        }
      },
      {
        selector: 'node[criticality="CRITICAL"]',
        style: {
          'border-color': '#ef4444',
          'border-width': 4
        }
      },
      {
        selector: 'edge',
        style: {
          'width': (ele: any) => Math.max(1, Math.log(ele.data('usageCount')) * 2),
          'line-color': (ele: any) => this.getEdgeColor(ele.data('type')),
          'target-arrow-color': (ele: any) => this.getEdgeColor(ele.data('type')),
          'target-arrow-shape': 'triangle',
          'target-arrow-size': 8,
          'curve-style': 'bezier',
          'opacity': (ele: any) => ele.data('isActive') ? 0.8 : 0.3,
          'line-style': (ele: any) => ele.data('isActive') ? 'solid' : 'dashed',
          'label': (ele: any) => this.showEdgeLabels ? this.formatUsageCount(ele.data('usageCount')) : '',
          'font-size': '10px',
          'font-weight': 'bold',
          'color': '#2d3748',
          'text-outline-width': 1,
          'text-outline-color': '#ffffff',
          'text-rotation': 'autorotate'
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#667eea',
          'target-arrow-color': '#667eea',
          'width': (ele: any) => Math.max(3, Math.log(ele.data('usageCount')) * 2 + 2)
        }
      },
      {
        selector: 'edge[isCritical="true"]',
        style: {
          'line-color': '#ef4444',
          'target-arrow-color': '#ef4444',
          'width': (ele: any) => Math.max(2, Math.log(ele.data('usageCount')) * 2 + 1)
        }
      }
    ];
  }

  private getLayoutConfig(): any {
    const layouts: { [key: string]: any } = {
      'cose-bilkent': {
        name: 'cose-bilkent',
        quality: 'default',
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 100,
        nodeRepulsion: 4000,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 1000,
        tile: true,
        animate: true,
        animationDuration: 1000,
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10,
        gravityRangeCompound: 1.5,
        gravityCompound: 0.25,
        gravityRange: 1.5,
        initialEnergyOnIncremental: 0.3
      },
      'dagre': {
        name: 'dagre',
        rankDir: 'TB',
        nodeDimensionsIncludeLabels: true,
        animate: true,
        animationDuration: 1000
      },
      'cola': {
        name: 'cola',
        animate: true,
        animationDuration: 1000,
        randomize: false,
        maxSimulationTime: 4000,
        ungrabifyWhileSimulating: false,
        fit: true,
        padding: 30,
        nodeDimensionsIncludeLabels: true,
        ready: () => {},
        stop: () => {}
      },
      'avsdf': {
        name: 'avsdf',
        nodeSep: 20,
        edgeSep: 10,
        animate: true,
        animationDuration: 1000
      },
      'klay': {
        name: 'klay',
        animate: true,
        animationDuration: 1000,
        nodeDimensionsIncludeLabels: true,
        klay: {
          direction: 'DOWN',
          nodeLayering: 'LONGEST_PATH',
          nodePlacement: 'SIMPLE',
          edgeRouting: 'ORTHOGONAL',
          spacing: 40
        }
      }
    };

    return layouts[this.selectedLayout] || layouts['cose-bilkent'];
  }

  private setupEventHandlers(): void {
    // Node events
    this.cy.on('tap', 'node', (evt: any) => {
      this.selectedNode = evt.target;
      this.selectedEdge = null;
    });

    // Edge events
    this.cy.on('tap', 'edge', (evt: any) => {
      this.selectedEdge = evt.target;
      this.selectedNode = null;
    });

    // Background click
    this.cy.on('tap', (evt: any) => {
      if (evt.target === this.cy) {
        this.selectedNode = null;
        this.selectedEdge = null;
      }
    });

    // Hover effects
    this.cy.on('mouseover', 'node', (evt: any) => {
      const node = evt.target;
      const connectedEdges = node.connectedEdges();
      const connectedNodes = node.neighborhood('node');
      
      // Highlight connected elements
      this.cy.elements().style('opacity', 0.3);
      node.style('opacity', 1);
      connectedEdges.style('opacity', 1);
      connectedNodes.style('opacity', 1);
    });

    this.cy.on('mouseout', 'node', () => {
      this.cy.elements().style('opacity', 1);
    });

    // Layout change
    this.cy.on('layoutstop', () => {
      this.updateStatistics();
    });
  }

  private updateGraph(): void {
    if (!this.cy) return;

    const elements = this.prepareGraphData();
    this.cy.elements().remove();
    this.cy.add(elements);
    this.cy.layout(this.getLayoutConfig()).run();
    this.updateStatistics();
  }

  private updateStatistics(): void {
    this.totalNodes = this.cy.nodes().length;
    this.totalEdges = this.cy.edges().length;
  }

  // Utility methods
  private calculateNodeWeight(service: Service): number {
    const dependencies = this.dependencies.filter(d => d.sourceServiceId === service.id).length;
    const criticality = service.criticality === CriticalityLevel.CRITICAL ? 10 : 
                      service.criticality === CriticalityLevel.HIGH ? 8 :
                      service.criticality === CriticalityLevel.MEDIUM ? 5 : 3;
    return Math.min(10, dependencies + criticality);
  }

  private getNodeClasses(service: Service): string[] {
    const classes = [service.status.toLowerCase(), service.criticality.toLowerCase()];
    if (service.criticality === CriticalityLevel.CRITICAL) classes.push('critical');
    return classes;
  }

  private getEdgeClasses(dep: Dependency): string[] {
    const classes = [dep.dependencyType.toLowerCase()];
    if (dep.isCritical) classes.push('critical');
    if (!dep.isActive) classes.push('inactive');
    return classes;
  }

  private getNodeColor(status: string): string {
    const colors: { [key: string]: string } = {
      'ACTIVE': '#10b981',
      'INACTIVE': '#ef4444',
      'DEPRECATED': '#f59e0b',
      'UNKNOWN': '#6b7280',
      'MAINTENANCE': '#3b82f6',
      'ERROR': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  private getCriticalityColor(criticality: string): string {
    const colors: { [key: string]: string } = {
      'CRITICAL': '#ef4444',
      'HIGH': '#f59e0b',
      'MEDIUM': '#3b82f6',
      'LOW': '#10b981'
    };
    return colors[criticality] || '#3b82f6';
  }

  private getEdgeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'HTTP_REQUEST': '#667eea',
      'DATABASE_QUERY': '#10b981',
      'MESSAGE_QUEUE': '#f59e0b',
      'FILE_SYSTEM': '#8b5cf6',
      'API_CALL': '#ef4444',
      'DIRECT_DEPENDENCY': '#3b82f6',
      'GRPC_CALL': '#06b6d4',
      'WEBSOCKET': '#84cc16',
      'REST_API': '#f97316',
      'GRAPHQL': '#ec4899',
      'SOAP': '#6366f1',
      'EVENT_STREAM': '#14b8a6',
      'CACHE_ACCESS': '#f59e0b',
      'SERVICE_DISCOVERY': '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  }

  private getNodeSize(dependencies: number): number {
    const baseSize = 30;
    const maxSize = 80;
    return Math.min(maxSize, baseSize + (dependencies * 3));
  }

  private formatUsageCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  }

  // Public methods for UI controls
  changeLayout(layout: string): void {
    this.selectedLayout = layout;
    this.cy.layout(this.getLayoutConfig()).run();
  }

  toggleLabels(): void {
    this.showLabels = !this.showLabels;
    this.cy.style().update();
  }

  toggleEdgeLabels(): void {
    this.showEdgeLabels = !this.showEdgeLabels;
    this.cy.style().update();
  }

  toggleMetrics(): void {
    this.showMetrics = !this.showMetrics;
    this.cy.style().update();
  }

  applyFilters(): void {
    if (!this.cy) return;

    this.cy.elements().style('display', 'element');

    // Apply type filter
    if (this.filterByType.length > 0) {
      this.cy.nodes().forEach((node: any) => {
        if (!this.filterByType.includes(node.data('type'))) {
          node.style('display', 'none');
        }
      });
    }

    // Apply status filter
    if (this.filterByStatus.length > 0) {
      this.cy.nodes().forEach((node: any) => {
        if (!this.filterByStatus.includes(node.data('status'))) {
          node.style('display', 'none');
        }
      });
    }

    // Apply criticality filter
    if (this.filterByCriticality.length > 0) {
      this.cy.nodes().forEach((node: any) => {
        if (!this.filterByCriticality.includes(node.data('criticality'))) {
          node.style('display', 'none');
        }
      });
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      this.cy.nodes().forEach((node: any) => {
        const name = node.data('name').toLowerCase();
        const type = node.data('type').toLowerCase();
        if (!name.includes(query) && !type.includes(query)) {
          node.style('display', 'none');
        }
      });
    }

    this.cy.layout(this.getLayoutConfig()).run();
  }

  clearFilters(): void {
    this.filterByType = [];
    this.filterByStatus = [];
    this.filterByCriticality = [];
    this.searchQuery = '';
    this.cy.elements().style('display', 'element');
    this.cy.layout(this.getLayoutConfig()).run();
  }

  resetZoom(): void {
    this.cy.animate({
      zoom: 1,
      center: { eles: this.cy.elements() }
    }, {
      duration: 1000
    });
  }

  fitToScreen(): void {
    this.cy.fit(undefined, 50);
  }

  exportGraph(): void {
    const png = this.cy.png({ 
      output: 'blob',
      bg: 'white',
      full: true
    });
      
      const link = document.createElement('a');
    link.href = URL.createObjectURL(png);
    link.download = `dependency-graph-${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  }

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

  // Getters for template
  getServiceTypeOptions(): string[] {
    return Object.values(ServiceType);
  }

  getStatusOptions(): string[] {
    return Object.values(ServiceStatus);
  }

  getCriticalityOptions(): string[] {
    return Object.values(CriticalityLevel);
  }

  getServiceTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getCriticalityLabel(criticality: string): string {
    return criticality.charAt(0) + criticality.slice(1).toLowerCase();
  }

  getDependencyTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}
