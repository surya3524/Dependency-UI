declare module 'cytoscape-dagre' {
  import { Core } from 'cytoscape';
  interface DagreLayoutOptions {
    name: string;
    nodeDimensionsIncludeLabels?: boolean;
    fit?: boolean;
    padding?: number;
    animate?: boolean;
    animationDuration?: number;
    animationEasing?: string;
    animateFilter?: (node: any, i: number) => boolean;
    transform?: (node: any, pos: any) => any;
    ready?: () => void;
    stop?: () => void;
    rankDir?: 'TB' | 'BT' | 'LR' | 'RL';
    rankSep?: number;
    nodeSep?: number;
    edgeSep?: number;
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    minLen?: (edge: any) => number;
    edgeWeight?: (edge: any) => number;
  }
  function dagre(cytoscape: (options?: any) => Core): void;
  export = dagre;
}

declare module 'cytoscape-cola' {
  import { Core } from 'cytoscape';
  interface ColaLayoutOptions {
    name: string;
    animate?: boolean;
    refresh?: number;
    maxSimulationTime?: number;
    ungrabifyWhileSimulating?: boolean;
    fit?: boolean;
    padding?: number;
    randomize?: boolean;
    avoidOverlap?: boolean;
    handleDisconnected?: boolean;
    convergenceThreshold?: number;
    nodeSpacing?: (node: any) => number;
    flow?: { axis: 'x' | 'y'; minSeparation: number };
    alignment?: (node: any) => any;
    gapInequalities?: any[];
    centerGraph?: boolean;
    edgeLength?: (edge: any) => number;
    nodeRepulsion?: (node: any) => number;
    edgeSymDiffLength?: (edge: any) => number;
    edgeJaccardLength?: (edge: any) => number;
    unconstrIter?: number;
    userConstIter?: number;
    allConstIter?: number;
    infinite?: boolean;
  }
  function cola(cytoscape: (options?: any) => Core): void;
  export = cola;
}

declare module 'cytoscape-cose-bilkent' {
  import { Core } from 'cytoscape';
  interface CoseBilkentLayoutOptions {
    name: string;
    quality?: 'default' | 'draft' | 'proof';
    randomize?: boolean;
    animate?: boolean | 'end';
    animationDuration?: number;
    animationEasing?: string;
    animateFilter?: (node: any, i: number) => boolean;
    ready?: () => void;
    stop?: () => void;
    fit?: boolean;
    padding?: number;
    nodeDimensionsIncludeLabels?: boolean;
    uniformNodeDimensions?: boolean;
    packComponents?: boolean;
    step?: 'all' | 'end';
    samplingType?: boolean;
    sampleSize?: number;
    nodeRepulsion?: (node: any) => number;
    nodeOverlap?: number;
    idealEdgeLength?: (edge: any) => number;
    edgeElasticity?: (edge: any) => number;
    nestingFactor?: number;
    gravity?: number;
    numIter?: number;
    gravityRange?: number;
    initialTemp?: number;
    coolingFactor?: number;
    minTemp?: number;
  }
  function coseBilkent(cytoscape: (options?: any) => Core): void;
  export = coseBilkent;
}

declare module 'cytoscape-avsdf' {
  import { Core } from 'cytoscape';
  interface AvsdfLayoutOptions {
    name: string;
    nodeSeparation?: number;
    ready?: () => void;
    stop?: () => void;
    fit?: boolean;
    padding?: number;
    animate?: boolean;
    animationDuration?: number;
    animationEasing?: string;
    animateFilter?: (node: any, i: number) => boolean;
    transform?: (node: any, pos: any) => any;
  }
  function avsdf(cytoscape: (options?: any) => Core): void;
  export = avsdf;
}

declare module 'cytoscape-klay' {
  import { Core } from 'cytoscape';
  interface KlayLayoutOptions {
    name: string;
    nodeDimensionsIncludeLabels?: boolean;
    fit?: boolean;
    padding?: number;
    animate?: boolean;
    animationDuration?: number;
    animationEasing?: string;
    animateFilter?: (node: any, i: number) => boolean;
    transform?: (node: any, pos: any) => any;
    ready?: () => void;
    stop?: () => void;
    klay?: {
      addUnnecessaryBendpoints?: boolean;
      aspectRatio?: number;
      borderSpacing?: number;
      compactComponents?: boolean;
      crossingMinimization?: 'LAYER_SWEEP' | 'INTERACTIVE' | 'NONE';
      cycleBreaking?: 'GREEDY' | 'INTERACTIVE' | 'NONE';
      direction?: 'UNDEFINED' | 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
      edgeRouting?: 'ORTHOGONAL' | 'SPLINES';
      edgeSpacingFactor?: number;
      feedbackEdges?: boolean;
      fixedAlignment?: 'NONE' | 'BALANCED' | 'LEFTUP' | 'RIGHTUP' | 'LEFTDOWN' | 'RIGHTDOWN';
      inLayerSpacingFactor?: number;
      layoutHierarchy?: boolean;
      linearSegmentsDeflectionDampening?: number;
      mergeEdges?: boolean;
      mergeHierarchyCrossingEdges?: boolean;
      nodeLayering?: 'NETWORK_SIMPLEX' | 'LONGEST_PATH' | 'INTERACTIVE';
      nodePlacement?: 'BRANDES_KOEPF' | 'LINEAR_SEGMENTS' | 'NETWORK_SIMPLEX' | 'SIMPLE';
      orthogonalRouting?: boolean;
      portAlignment?: 'NONE' | 'BALANCED' | 'JUSTIFIED' | 'CENTER' | 'LEADING' | 'TRAILING';
      portConstraints?: 'FIXED_ORDER' | 'FIXED_RATIO' | 'FIXED_SIDES' | 'FREE';
      portSpacing?: number;
      priority?: 'NONE' | 'BALANCED' | 'LEFTUP' | 'RIGHTUP' | 'LEFTDOWN' | 'RIGHTDOWN';
      routing?: 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES';
      separateConnectedComponents?: boolean;
      spacing?: number;
      thoroughness?: number;
    };
    priority?: (edge: any) => number;
  }
  function klay(cytoscape: (options?: any) => Core): void;
  export = klay;
}
