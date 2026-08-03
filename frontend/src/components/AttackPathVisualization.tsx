import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface AttackPathVisualizationProps {
  isDarkMode: boolean;
  vulnerabilities?: Array<{
    type: string;
    severity?: string;
    description?: string;
  }>;
}

export const AttackPathVisualization = ({ isDarkMode, vulnerabilities }: AttackPathVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Default attack path data
    let data = {
      nodes: [
        { id: 'entry', label: 'Entry Point', type: 'entry' },
        { id: 'vuln1', label: 'XSS Vulnerability', type: 'vulnerability' },
        { id: 'vuln2', label: 'SQL Injection', type: 'vulnerability' },
        { id: 'target', label: 'Target System', type: 'target' }
      ],
      links: [
        { source: 'entry', target: 'vuln1', type: 'attack' },
        { source: 'vuln1', target: 'vuln2', type: 'escalation' },
        { source: 'vuln2', target: 'target', type: 'compromise' }
      ]
    };

    if (vulnerabilities && vulnerabilities.length > 0) {
      const nodes = [{ id: 'entry', label: 'Entry Point', type: 'entry' }];
      const links: any[] = [];

      vulnerabilities.forEach((vuln, index) => {
        const nodeId = `vuln_${index}`;
        const label = vuln.type.toUpperCase();
        nodes.push({ id: nodeId, label, type: 'vulnerability' });
        
        const sourceId = index === 0 ? 'entry' : `vuln_${index - 1}`;
        const linkType = index === 0 ? 'attack' : 'escalation';
        links.push({ source: sourceId, target: nodeId, type: linkType });
      });

      nodes.push({ id: 'target', label: 'Target System', type: 'target' });
      links.push({ source: `vuln_${vulnerabilities.length - 1}`, target: 'target', type: 'compromise' });

      data = { nodes, links };
    }

    const width = 800;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => {
        switch (d.type) {
          case 'attack': return '#ef4444';
          case 'escalation': return '#f97316';
          case 'compromise': return '#dc2626';
          default: return '#6b7280';
        }
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    const node = svg.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => {
        switch (d.type) {
          case 'entry': return '#3b82f6';
          case 'vulnerability': return '#ef4444';
          case 'target': return '#10b981';
          default: return '#6b7280';
        }
      });

    node.append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('fill', isDarkMode ? '#e5e7eb' : '#1f2937')
      .style('font-size', '12px');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  }, [isDarkMode, vulnerabilities]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width="800"
        height="400"
        className="mx-auto"
      />
    </div>
  );
}; 