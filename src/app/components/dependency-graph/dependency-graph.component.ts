import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import * as d3 from 'd3';
import { DependencyService } from '../../services/dependency.service';
import { Service, Dependency } from '../../models/service.model';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  status: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  usageCount: number;
  isActive: boolean;
}

@Component({
  selector: 'app-dependency-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dependency-graph.component.html',
  styleUrls: ['./dependency-graph.component.scss']
})
export class DependencyGraphComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;

  services: Service[] = [];
  dependencies: Dependency[] = [];
  nodes: GraphNode[] = [];
  links: GraphLink[] = [];
  
  private svg: any;
  private simulation: any;
  private destroy$ = new Subject<void>();
  private width = 800;
  private height = 600;

  constructor(private dependencyService: DependencyService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initializeGraph();
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
        this.updateGraphData();
      });

    this.dependencyService.dependencies$
      .pipe(takeUntil(this.destroy$))
      .subscribe(dependencies => {
        this.dependencies = dependencies;
        this.updateGraphData();
      });
  }

  private updateGraphData(): void {
    this.prepareGraphData();
    if (this.svg) {
      this.renderGraph();
    }
  }

  private prepareGraphData(): void {
    // Convert services to nodes
    this.nodes = this.services.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      status: service.status
    }));

    // Convert dependencies to links
    this.links = this.dependencies.map(dep => ({
      source: dep.sourceServiceId,
      target: dep.targetServiceId,
      type: dep.dependencyType,
      usageCount: dep.usageCount,
      isActive: dep.isActive
    }));
  }

  private initializeGraph(): void {
    const container = this.graphContainer.nativeElement;
    this.width = container.offsetWidth || 800;
    this.height = container.offsetHeight || 600;

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .style('background', '#f8fafc');

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        this.svg.select('g').attr('transform', event.transform);
      });

    this.svg.call(zoom);

    // Create main group for zoom
    this.svg.append('g');

    this.renderGraph();
  }

  private renderGraph(): void {
    if (!this.svg || this.nodes.length === 0) return;

    const g = this.svg.select('g');

    // Clear previous graph
    g.selectAll('*').remove();

    // Create force simulation
    this.simulation = d3.forceSimulation(this.nodes as any)
      .force('link', d3.forceLink(this.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.links)
      .enter().append('line')
      .attr('stroke', (d: any) => this.getLinkColor(d))
      .attr('stroke-width', (d: any) => Math.max(1, Math.log(d.usageCount) * 2))
      .attr('stroke-opacity', (d: any) => d.isActive ? 0.8 : 0.3)
      .attr('stroke-dasharray', (d: any) => d.isActive ? '0' : '5,5');

    // Create link labels
    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(this.links)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d: any) => d.usageCount > 1000 ? `${(d.usageCount / 1000).toFixed(1)}k` : d.usageCount.toString())
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none');

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(this.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    // Add circles for nodes
    node.append('circle')
      .attr('r', (d: any) => this.getNodeRadius(d))
      .attr('fill', (d: any) => this.getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add node labels
    node.append('text')
      .attr('dx', 0)
      .attr('dy', (d: any) => this.getNodeRadius(d) + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', '#2d3748')
      .text((d: any) => d.name)
      .style('pointer-events', 'none');

    // Add type icons
    node.append('text')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', '#fff')
      .text((d: any) => this.getTypeIcon(d.type))
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add hover effects
    node
      .on('mouseover', this.handleNodeHover.bind(this))
      .on('mouseout', this.handleNodeOut.bind(this));
  }

  private getNodeRadius(node: GraphNode): number {
    const baseRadius = 25;
    const dependencies = this.dependencies.filter(
      d => d.sourceServiceId === node.id || d.targetServiceId === node.id
    ).length;
    return baseRadius + (dependencies * 2);
  }

  private getNodeColor(node: GraphNode): string {
    const colorMap: { [key: string]: string } = {
      'ACTIVE': '#48bb78',
      'INACTIVE': '#f56565',
      'DEPRECATED': '#ed8936',
      'UNKNOWN': '#a0aec0'
    };
    return colorMap[node.status] || '#a0aec0';
  }

  private getLinkColor(link: GraphLink): string {
    const colorMap: { [key: string]: string } = {
      'HTTP_REQUEST': '#667eea',
      'DATABASE_QUERY': '#48bb78',
      'MESSAGE_QUEUE': '#ed8936',
      'FILE_SYSTEM': '#9f7aea',
      'API_CALL': '#f56565',
      'DIRECT_DEPENDENCY': '#4299e1'
    };
    return colorMap[link.type] || '#a0aec0';
  }

  private getTypeIcon(type: string): string {
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

  private dragstarted(event: any, d: any): void {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: any, d: any): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragended(event: any, d: any): void {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  private handleNodeHover(event: any, d: any): void {
    // Highlight connected nodes and links
    const connectedNodes = new Set();
    const connectedLinks = this.links.filter(link => 
      link.source === d.id || link.target === d.id
    );

    connectedLinks.forEach(link => {
      connectedNodes.add(link.source);
      connectedNodes.add(link.target);
    });

    // Update link opacity
    this.svg.selectAll('.links line')
      .style('opacity', (link: any) => 
        connectedLinks.includes(link) ? 1 : 0.1
      );

    // Update node opacity
    this.svg.selectAll('.nodes g')
      .style('opacity', (node: any) => 
        connectedNodes.has(node.id) ? 1 : 0.3
      );
  }

  private handleNodeOut(event: any, d: any): void {
    // Reset all elements to full opacity
    this.svg.selectAll('.links line')
      .style('opacity', 0.8);

    this.svg.selectAll('.nodes g')
      .style('opacity', 1);
  }

  // Public methods for external control
  resetZoom(): void {
    this.svg.transition().duration(750).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  }

  centerGraph(): void {
    if (this.simulation) {
      this.simulation.alpha(0.3).restart();
    }
  }

  exportGraph(): void {
    const svgData = new XMLSerializer().serializeToString(this.svg.node());
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = this.width;
      canvas.height = this.height;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = 'dependency-graph.png';
      link.href = canvas.toDataURL();
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }
}
