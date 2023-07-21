import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';

@Component({
  selector: 'app-ipheatmap',
  templateUrl: './ipheatmap.component.html',
  styleUrls: ['./ipheatmap.component.css'],
})
export class IpheatmapComponent implements OnInit {
  usedIPs: string[] = [];
  unusedIPs: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchIPs();
  }

  fetchIPs() {
    const apiUrl = 'http://localhost:8000/ips'; 

    this.http.get<any>(apiUrl).subscribe(
      (data) => {
        this.usedIPs = data.used_ips;
        this.unusedIPs = data.unused_ips;

        const combined_ips = this.usedIPs
          .map((ip) => ({ ip, status: 1 }))
          .concat(this.unusedIPs.map((ip) => ({ ip, status: 0 })));

        console.log(combined_ips);
        this.generateHeatMap(combined_ips);
      },
      (error) => {
        console.log('An error occurred:', error);
      }
    );
  }

  generateHeatMap(combined_ips: any[]): void {
    const squareSize = 20;
    const numColumns = 20; 
    const padding = 2; 

    const sorted_ips = combined_ips.sort((a, b) => a.ip.localeCompare(b.ip)); 
    const numRows = Math.ceil(sorted_ips.length / numColumns); 

    const svg = d3
      .select('svg') 
      .attr('width', numColumns * (squareSize + padding)) 
      .attr('height', numRows * (squareSize + padding)); 

    const squares = svg
      .selectAll('rect')
      .data(sorted_ips) 
      .enter()
      .append('rect') 
      .attr('width', squareSize) 
      .attr('height', squareSize)
      .attr('x', (d, i) => (i % numColumns) * (squareSize + padding)) 
      .attr('y', (d, i) => Math.floor(i / numColumns) * (squareSize + padding)) 
      .attr('rx', 4) 
      .attr('ry', 4); 

    squares.style('fill', (d) => (d.status === 1 ? 'red' : 'green')); 

    squares.append('title').text((d: any) => {
      let tooltipText = `${d.ip}`;
      return tooltipText;
    });

    this.generatePieChart();
  }

  generatePieChart(): void {
    const usedIPsCount = this.usedIPs.length;
    const unusedIPsCount = this.unusedIPs.length;

    const data = [
      { label: 'Used', count: usedIPsCount },
      { label: 'Available', count: unusedIPsCount },
    ];

    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;

    // Create a color scale for the pie chart slices
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create a pie layout and pass in the data
    const pie = d3
      .pie<{ label: string; count: number }>()
      .value((d) => d.count);

    // Create an arc generator based on the radius
    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; count: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    // Create an SVG element and set its dimensions
    const svg = d3
      .select('body')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Generate the pie chart slices
    const slices = svg
      .selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d, i: any) => color(i));

    // Add labels to the pie chart slices
    const labels = svg
      .selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text((d) => `${d.data.label}: ${d.data.count}`);
  }
}
