import { Component, ElementRef, OnInit } from '@angular/core';
import * as d3 from 'd3';
import data from './data.json';
import { faker } from '@faker-js/faker';
import { SharedService } from '../shared.service';
import { HttpClient } from '@angular/common/http';
import { IpServiceService } from '../ip-service.service';

@Component({
  selector: 'app-directed',
  templateUrl: './directed.component.html',
  styleUrls: ['./directed.component.css'],
})
export class DirectedComponent implements OnInit {
  constructor(
    private elementRef: ElementRef,
    private sharedService: SharedService,
    private http: HttpClient,
    private ipService: IpServiceService
  ) {}

  private color = d3.scaleOrdinal(d3.schemeCategory10);
  private svg: any;
  private simulation: any;
  trafficVolume: string | undefined;
  averageBandwidth: string | undefined;
  averageLatency: string | undefined;

  ngOnInit(): void {
    // const newdata = this.preprocessJSON(data);
    //this.createLineChart()
    this.updateIP();

    this.updateGraph();
    //this.createSunburstGraph()
    this.generatePeriodicTraffic(5000);
  }

  addRandomNode(): void {
    const connectionPreferences: { [key: string]: string[] } = {
      Router: ['Switch', 'Gateway'],
      Switch: ['Router', 'Server'],
      Firewall: ['Server'],
      Gateway: ['Router', 'Server'],
      Server: ['Switch', 'Firewall', 'Gateway'],
    };

    const newNodeIdNumber = Math.random().toFixed(2);

    const deviceTypes = ['Router', 'Switch', 'Firewall', 'Gateway', 'Server'];
    const operatingSystems = ['Linux', 'Windows', 'MacOS', 'iOS', 'Android'];

    const deviceType =
      deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const newNodeId = `${deviceType} ${newNodeIdNumber}`;

    const newNode = {
      id: newNodeId,
      group: 1,
      ipAddress: faker.internet.ipv4(),
      macAddress: faker.internet.mac(),
      deviceType: deviceType,
      operatingSystem:
        operatingSystems[Math.floor(Math.random() * operatingSystems.length)],
      protocol: faker.internet.protocol(),
    };

    const suitableConnections = connectionPreferences[deviceType];
    console.log(suitableConnections);

    let existingNode = data.nodes[0];

    const suitableNodes = data.nodes.filter((node: any) =>
      suitableConnections.includes(node.deviceType)
    );

    if (suitableNodes.length > 0) {
      const randomIndex = Math.floor(Math.random() * suitableNodes.length);
      existingNode = suitableNodes[randomIndex];
    } else {
      existingNode = data.nodes[Math.floor(Math.random() * data.nodes.length)];
    }

    const newLink = {
      source: existingNode.id,
      target: newNodeId,
      traffic: 1,
      bandwidth: 100,
      latency: 1,
    };

    data.nodes.push(newNode);
    data.links.push(newLink);

    this.updateGraph();
  }

  removeNode(): void {
    const nonRootNodes = data.nodes.filter((node: any) => node.id !== 'root');

    const randomIndex = Math.floor(Math.random() * nonRootNodes.length);
    const removedNode = nonRootNodes[randomIndex];

    const removedNodeId = removedNode.id;
    const removedNodeIndex = data.nodes.findIndex(
      (node: any) => node.id === removedNodeId
    );
    if (removedNodeIndex !== -1) {
      data.nodes.splice(removedNodeIndex, 1);
    }

    data.links = data.links.filter(
      (link: any) =>
        link.source !== removedNodeId && link.target !== removedNodeId
    );

    this.updateGraph();
  }

  // generateRandomName(): string {
  //   const networkTerms = ['Router', 'Switch', 'Firewall', 'Gateway', 'Server'];
  //   const newNodeId = Math.random().toFixed(2);

  //   const randomAdjective =
  //     networkTerms[Math.floor(Math.random() * networkTerms.length)];

  //   return `${randomAdjective} ${newNodeId}`;
  // }

  /* createLineChart() {
    var dataset = [
      { date: "01/01/2016", pizzas: 10000 },
      { date: "01/02/2016", pizzas: 20000 },
      { date: "01/03/2016", pizzas: 40000 },
      { date: "01/04/2016", pizzas: 30000 },
      { date: "01/05/2016", pizzas: 30000 },
      { date: "01/06/2016", pizzas: 50000 },
      { date: "01/07/2016", pizzas: 30000 },
      { date: "01/08/2016", pizzas: 50000 },
      { date: "01/09/2016", pizzas: 60000 },
      { date: "01/10/2016", pizzas: 20000 },
      { date: "01/11/2016", pizzas: 10000 },
      { date: "01/12/2016", pizzas: 90000 },
    ];

    var margin = { top: 40, right: 40, bottom: 40, left: 60 },
      width = 700 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    var parseTime = (dateString: string) => {
      const parsedDate = d3.timeParse("%d/%m/%Y")(dateString);
      return parsedDate ? parsedDate : new Date(); // Return a default value if parsing fails
    };
    var formatTime = d3.timeFormat("%a/%b/%Y");

    var x = d3.scaleTime()
      .range([0, width]);

    var y = d3.scaleLinear()
      .range([height, 0]);

    var svg = d3.select("body").append("svg")
      .style("background-color", '#888')
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Calculate domain
    var minPizzas = d3.min(dataset, function (d) { return d.pizzas; }) || 0;
    var maxPizzas = d3.max(dataset, function (d) { return d.pizzas; }) || 0;

    // Set domain
    x.domain(d3.extent<Date>(dataset, function (d) { return parseTime(d.date) || new Date(); }) as [Date, Date]);
    y.domain([minPizzas / 1000, maxPizzas / 1000]);

    // ...

    // Line
    var line = d3.line<{ date: string; pizzas: number; }>()
      .x(function (d) { return x(parseTime(d.date) || new Date())!; })
      .y(function (d) { return y(d.pizzas / 1000); });

    // ...
    // Axes
    svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y));

    // Labels
    svg.append("text")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .attr("transform", "translate(" + (margin.left - 94) + "," + (height / 2) + ")rotate(-90)")
      .text("Pizzas (Thousands)");

    svg.append("text")
      .style("font-size", "14px")
      .attr("text-anchor", "middle")
      .attr("transform", "translate(" + (width / 2) + "," + (height - (margin.bottom - 74)) + ")")
      .text("Date");

    // Chart Title
    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", 20 - (margin.top / 2))
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Pizza Consumption");

    // Data Line
    svg.append("path")
      .datum(dataset)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none");

    // ...
  }*/

  generatePeriodicTraffic(interval: number): void {
    setInterval(() => {
      // Logic to generate traffic between nodes
      this.generateTraffic();
    }, interval);
  }

  generateTraffic(): void {
    for (const link of data.links) {
      link.traffic += Math.random() * 10;
      if (link.traffic > 5) {
        link.traffic -= Math.random() * 5;
      }
      link.bandwidth = Math.random() * 1000;
      link.latency = Math.random() * 10;
    }

    this.updateLinkTooltip();
  }

  updateLinkTooltip(): void {
    const link = this.svg.selectAll('line');

    link.select('title').text((d: any) => {
      let tooltipText = `Source: ${d.source}`;
      tooltipText += `\nTarget: ${d.target}`;
      tooltipText += `\nTraffic: ${d.traffic}`;
      tooltipText += `\nBandwidth: ${d.bandwidth}`;
      tooltipText += `\nLatency: ${d.latency}`;
      return tooltipText;
    });

    const trafficVolume2 = d3.sum(data.links, (d: any) => d.traffic);
    const averageBandwidth2 = d3.mean(data.links, (d: any) => d.bandwidth);
    const averageLatency2 = d3.mean(data.links, (d: any) => d.latency);

    // Update statistics in the HTML template
    this.trafficVolume = trafficVolume2.toFixed(2);
    if (averageBandwidth2) this.averageBandwidth = averageBandwidth2.toFixed(2);
    if (averageLatency2) this.averageLatency = averageLatency2.toFixed(2);
  }

  send(data: any): void {
    this.sharedService.sendData(data);
  }

  sendDataToApi() {
    const apiUrl = 'http://localhost:8000/network-data'; 

    this.http.post(apiUrl, data).subscribe(
      (response) => {
        console.log(response);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  updateIP() {
    const apiUrl = 'http://localhost:8000/ips';

    this.http.get<any>(apiUrl).subscribe(
      (data) => {
        this.ipService.setIpData(data); 
      },
      (error) => {
        console.log('An error occurred:', error);
      }
    );
  }

  updateGraph(): void {
    const links = data.links.map((d: object | null) => Object.create(d));
    const nodes = data.nodes.map((d: object | null) => Object.create(d));

    this.sendDataToApi();
    this.updateIP();
    const trafficVolume2 = d3.sum(links, (d: any) => d.traffic);
    const averageBandwidth2 = d3.mean(links, (d: any) => d.bandwidth);
    const averageLatency2 = d3.mean(links, (d: any) => d.latency);

    this.trafficVolume = trafficVolume2.toFixed(2);
    if (averageBandwidth2) this.averageBandwidth = averageBandwidth2.toFixed(2);
    if (averageLatency2) this.averageLatency = averageLatency2.toFixed(2);

    const width = 1500;
    const height = 1500;

    if (this.svg) {
      this.svg.selectAll('*').remove();
    } else {
      this.svg = d3
        .select(this.elementRef.nativeElement)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 1500 1500`)
        .style('position', 'relative')
        .style('left', '0')
        .style('width', '100%')
        .style('height', '100%');
    }

    function calculatePathFromLeafToRoot(nodeId: string): string[] {
      const path: string[] = [nodeId];

      const findParent = (currentNode: string) => {
        const parentLink = data.links.find(
          (link: { target: string }) => link.target === currentNode
        );
        if (parentLink) {
          const parent = parentLink.source;
          path.push(parent);
          findParent(parent);
        }
      };

      findParent(nodeId);
      return path.reverse();
    }

    const paths = new Map<string, string[]>();

    function calculatePaths(source: string, connectedToRoot: boolean) {
      paths.set(source, calculatePathFromLeafToRoot(source));

      for (const link of links) {
        if (link.source === source && !paths.has(link.target)) {
          calculatePaths(
            link.target,
            connectedToRoot || link.target === 'root'
          );
        }
      }
    }

    calculatePaths('root', true);
    console.log(paths);
    if (paths) {
      console.log('31');
    }
    this.send(paths);
    const pathColors = ['blue', 'green', 'red', 'orange', 'purple'];

    const link = this.svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll()
      .data(links)
      .join('line')
      .attr('stroke-width', 2)
      .attr('stroke', (d: any) => {
        const path = paths.get(d.target);
        if (path) {
          const nodeIndex = path.indexOf(d.source);
          if (nodeIndex !== -1) {
            return pathColors[nodeIndex % pathColors.length];
          }
        }
        return '#ccc';
      });

    const node = this.svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g');

    node.append('title').text((d: any) => {
      let tooltipText = `ID: ${d.id}`;
      tooltipText += `\nIP Address: ${d.ipAddress}`;
      tooltipText += `\nMAC Address: ${d.macAddress}`;
      tooltipText += `\nDevice Type: ${d.deviceType}`;
      tooltipText += `\nOperating System: ${d.operatingSystem}`;
      tooltipText += `\nProtocol: ${d.protocol}`;
      return tooltipText;
    });

    link.append('title').text((d: any) => {
      let tooltipText = `Source: ${d.prototype}`;
      tooltipText += `\nTarget: ${d.target}`;
      tooltipText += `\nTraffic: ${d.traffic}`;
      tooltipText += `\nBandwith: ${d.bandwith}`;
      tooltipText += `\nLatency: ${d.latency}`;
      return tooltipText;
    });

    const rootRadius = 20;
    const rootFontSize = '12px';

    // links.forEach(function (value: any) {
    //   console.log(value);
    // });

    node
      .append('svg:image')
      .attr('xlink:href', (d: any) => `./assets/${d.deviceType}.png`)
      .attr('x', -16)
      .attr('y', -16)
      .attr('width', 32)
      .attr('height', 32);

    node
      .append('text')
      .attr('dx', 12)
      .attr('dy', 4)
      .style('font-size', (d: any) => (d.id === 'root' ? rootFontSize : '10px'))
      .text((d: any) => d.id);

    this.simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => (d.target === 'root' ? 300 : 200))
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('root', (alpha) => {
        nodes.forEach((node: any) => {
          if (node.id === 'root') {
            node.fx = width / 2;
            node.fy = height / 2;
          }
        });
      });

    this.simulation.on('tick', ticked);

    function ticked() {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    }
  }

  createSunburstGraph(): void {
    const width = 600;
    const height = 600;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const root = { id: 'root', children: data.nodes };

    const partition = (data: any) => {
      const root = d3
        .hierarchy(data)
        .sum((d: any) => (d.children ? 0 : 1))
        .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

      return d3.partition().size([2 * Math.PI, root.height + 1])(root);
    };

    const rootPartition = partition(root);

    const arcGenerator: d3.Arc<any, any> = d3
      .arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .innerRadius((d: any) => d.y0 * (width / 2))
      .outerRadius((d: any) =>
        Math.max(d.y0 * (width / 2), d.y1 * (width / 2) - 1)
      );

    const sunburstSvg = d3
      .select(this.elementRef.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`);

    const sunburstPaths = sunburstSvg
      .selectAll('path')
      .data(rootPartition.descendants().slice(1))
      .enter()
      .append('path')
      .attr('d', arcGenerator)
      .style('fill', (d: any) => color((d.children ? d : d.parent).data.id));

    sunburstPaths.append('title').text((d: any) => {
      let tooltipText = `ID: ${d.data.id}`;
      tooltipText += `\nIP Address: ${d.data.ipAddress}`;
      tooltipText += `\nMAC Address: ${d.data.macAddress}`;
      tooltipText += `\nDevice Type: ${d.data.deviceType}`;
      tooltipText += `\nOperating System: ${d.data.operatingSystem}`;
      tooltipText += `\nProtocol: ${d.data.protocol}`;
      return tooltipText;
    });
  }
}
