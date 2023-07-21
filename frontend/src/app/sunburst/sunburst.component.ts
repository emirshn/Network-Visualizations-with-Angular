import { Component, ElementRef, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import * as d3 from "d3"
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../shared.service';
import { Subscription } from 'rxjs';
import { Node } from '../node.interface';

@Component({
  selector: 'app-sunburst',
  templateUrl: './sunburst.component.html',
  styleUrls: ['./sunburst.component.css']
})

export class SunburstComponent implements OnInit {
  receivedData: Map<string, string[]> | undefined;
  transformedData: any;
  private subscription: Subscription;
  constructor(private elementRef: ElementRef, private http: HttpClient
    , private sharedService: SharedService) {
    this.subscription = this.sharedService.data$.subscribe(
      (data: Map<string, string[]>) => {
        this.receivedData = data;
        const obj = Object.fromEntries(this.receivedData)
        this.transformedData = this.transformData(obj);
        console.log(JSON.stringify(this.transformedData));
        this.createChart()
      }
    );
  }

  transformData(data: any): Node | undefined {
    if (!data) {
      return undefined;
    }
    const root: Node = { name: 'root', children: [] };
    for (const [key, value] of Object.entries(data)) {
      let current: Node = root;
      for (const name of <any>value) {
        let found = false;
        for (const child of current.children || []) {
          if (child.name === name) {
            current = child;
            found = true;
            break;
          }
        }
        if (!found) {
          const newNode: Node = { name, children: [] };
          (current.children || []).push(newNode);
          current = newNode;
        }
      }
    }
    const assignRandomSize = (node: Node) => {
      if (!node.children || node.children.length === 0) {
        node.size = 1
      } else {
        for (const child of node.children) {
          assignRandomSize(child);
        }
      }
    };
    assignRandomSize(root);
    return root;
  }


  ngOnInit() {
    // function preprocessData(data: any): any {
    //   // Function to create a new node with aggregated data
    //   function createAggregatedNode(name: string, children: any[]): any {
    //     return { name, children };
    //   }

    //   // Recursive function to preprocess and aggregate nodes
    //   function aggregateNodes(node: any): any {
    //     if (node.children) {
    //       const childMap = new Map<string, any>();

    //       // Iterate over the child nodes and aggregate nodes with the same name
    //       for (const child of node.children) {
    //         const { name } = child;
    //         if (childMap.has(name)) {
    //           // Node with the same name exists, aggregate it
    //           const existingChild = childMap.get(name);
    //           if (existingChild.children) {
    //             existingChild.children.push(...child.children);
    //           } else {
    //             existingChild.children = child.children;
    //           }
    //         } else {
    //           // Node with the same name doesn't exist, add it to the map
    //           childMap.set(name, { ...child });
    //         }
    //       }

    //       // Recursively aggregate child nodes
    //       const aggregatedChildren = Array.from(childMap.values()).map(aggregateNodes);

    //       // Return the node with aggregated children
    //       return createAggregatedNode(node.name, aggregatedChildren);
    //     }

    //     // Add a size property only to leaf nodes
    //     return { ...node, size: 1 };
    //   }

    //   // Preprocess the data by aggregating nodes
    //   const aggregatedData = aggregateNodes(data);

    //   return aggregatedData;
    // }



  }

  loadData() {
    console.log("32")
    const url = 'https://gist.githubusercontent.com/emirshn/ff11982b0567efcb4fef145d1e0723ba/raw/2ad48f5eed4b3de2ce6409efeef1955bc97f1697/h&m.json';

    this.http.get(url).subscribe((data: any) => {
      console.log(JSON.stringify(this.transformedData));

      // Call the method that needs to be executed
      this.createChart();
    });
  }
  createChart() {
    let data = this.transformedData
    console.log(data)
    //data = preprocessData(data);
    //console.log(data);
    const partition = (data: any) => {
      const root = d3.hierarchy(data)
        .sum((d) => d.size)
        .sort((a: any, b: any) => b.value - a.value);
      return d3.partition()
        .size([2 * Math.PI, root.height + 1])
        (root);
    };

    const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));
    const format = d3.format(",d");

    const width = 632;
    const radius = width / 6;

    const arc = d3.arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d: any) => d.y0 * radius)
      .outerRadius((d: any) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const root = partition(data);

    root.each((d: any) => d.current = d);

    const svg = d3.select(this.elementRef.nativeElement)
      .append("svg")
      .style("width", width)
      .style("height", width)
      .style("font", "10px sans-serif");

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${width / 2})`);

    const path = g.append("g")
      .selectAll("path")
      .data(root.descendants().slice(1))
      .enter().append("path")
      .attr("fill", (d: any) => {
        while (d.depth > 2) d = d.parent;
        return color(d.data.name);
      })
      .attr("fill-opacity", (d: any) => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", (d: any) => arc(d.current));


    path.filter((d: any) => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

    path.append("title")
      .text((d: any) => `${d.ancestors().map((d: any) => d.data.name).reverse().join("/")}\n${format(d.value)}`);

    const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants().slice(1))
      .enter().append("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", (d: any) => +labelVisible(d.current))
      .attr("transform", (d: any) => labelTransform(d.current))
      .text((d: any) => d.data.name);


    const parent = g.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

    function clicked(p: any) {
      parent.datum(p.parent || root);

      console.log(p.target)
      root.each((d: any) => (d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      }));

      root.each((d: any) => (console.log(d.target)));

      console.log(p)
      console.log(root)
      const t = g.transition().duration(750);

      console.log(g)
      path.transition(<any>t)
        .tween("data", (d: any) => {
          const i = d3.interpolate(d.current, d.target);
          return (t: any) => (d.current = i(t));
        })
        .filter(function (d: any): any {
          return this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
        .attr("fill-opacity", (d: any) => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween("d", (d: any) => (): any => arc(d.current));

      label.filter(function (d: any): any {
        return this.getAttribute("fill-opacity") || labelVisible(d.target);
      }).transition(<any>t)
        .attr("fill-opacity", (d: any) => +labelVisible(d.target))
        .attrTween("transform", (d: any) => () => labelTransform(d.current));
    }


    function arcVisible(d: any) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    function labelVisible(d: any) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d: any) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = (d.y0 + d.y1) / 2 * radius;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }
  }

}
