import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { IpServiceService } from '../ip-service.service';

@Component({
  selector: 'app-leafmap',
  templateUrl: './leafmap.component.html',
  styleUrls: ['./leafmap.component.css'],
})
export class LeafmapComponent implements OnInit {
  private map: L.Map | undefined;
  private centroid: L.LatLngExpression = [
    40.78949666186294, 29.418076998192614,
  ]; //
  private randomPoints: L.LatLngExpression[] = [];

  private initMap(): void {
    this.map = L.map('map', {
      center: this.centroid,
      zoom: 12,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 10,
      }
    );

    const centroidIcon = L.icon({
      iconUrl: './assets/marker.png',
      iconSize: [32, 32],
    });

    L.marker(this.centroid, { icon: centroidIcon }).addTo(this.map);

    this.randomPoints.forEach((point) => {
      L.marker(point).addTo(<any>this.map);
    });

    tiles.addTo(this.map);
  }

  ngOnInit() {
    this.initMap();
    this.fetchIPs();
  }

  constructor(private http: HttpClient, private ipService: IpServiceService) {}

  fetchIPs() {
    const apiUrl = 'http://localhost:8000/ips';

    this.ipService.ipData$.subscribe(
      (data) => {
        const geoInfo = data.geo_info;
        const ipAddress = Object.keys(geoInfo)[0]; // Assuming there is only one IP in the "geo_info" object
        const [latitude, longitude] = geoInfo[ipAddress];
        // Assign the coordinates to the "private centroid" variable
        this.centroid = [latitude, longitude];

        this.randomPoints = data.device_locations;
        const deviceLocations: number[][] = data.device_locations || [];

        for (const node of data.connection_data.nodes) {
          if (node.id === 'root') {
            node.location = geoInfo[ipAddress];
          } else if (node.id !== 'root') {
            const index = data.connection_data.nodes.findIndex(
              (n: any) => n.id === node.id
            );
            if (index !== -1) {
              node.location = deviceLocations[index - 1];
            }
          }
        }
        this.connection_data = data.connection_data;
        console.log(data.connection_data.nodes);
        this.updateMap();
      },
      (error) => {
        console.log('An error occurred:', error);
      }
    );
  }
  private connection_data: any;
  private polylines: L.Polyline[] = [];
  private popups: L.Popup[] = [];

  updateMap() {
    if (this.map) {
      this.map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) {
          this.map!.removeLayer(layer);
        }
      });

      const centroidIcon = L.icon({
        iconUrl: './assets/marker.png',
        iconSize: [32, 32],
      });
      L.marker(this.centroid, { icon: centroidIcon }).addTo(this.map!);

      this.randomPoints.forEach((point) => {
        L.marker(point).addTo(this.map!);
      });

      this.connection_data.links.forEach((link: any) => {
        const sourcenode = this.connection_data.nodes.find(
          (point: any) => point.id === link.source
        );
        const targetnode = this.connection_data.nodes.find(
          (point: any) => point.id === link.target
        );

        const startPoint = sourcenode.location;
        const endPoint = targetnode.location;

        if (endPoint) {
          const polyline = L.polyline([startPoint, endPoint], {
            color: 'blue',
          }).addTo(<any>this.map);
          this.polylines.push(polyline);

          const popupContent = `Node Info: ${sourcenode.ipAddress}`;
          if (sourcenode.id !== 'root') {
            const popup = L.popup()
              .setLatLng(startPoint)
              .setContent(popupContent);
            this.popups.push(popup);
            L.marker(startPoint)
              .bindPopup(popup)
              .addTo(<any>this.map);
          }

          const endPointPopupContent = `Node Info: ${targetnode.ipAddress}`;
          const endPointPopup = L.popup()
            .setLatLng(endPoint)
            .setContent(endPointPopupContent);
          this.popups.push(endPointPopup);
          L.marker(endPoint)
            .bindPopup(endPointPopup)
            .addTo(<any>this.map);
        }
      });
    }
  }
}
