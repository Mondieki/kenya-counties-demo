import { Component, OnInit, HostListener, NgZone } from '@angular/core';
import * as L from 'leaflet';
import { GeoJsonObject } from 'geojson'; // Ensure @types/geojson is installed
import { COUNTIES } from './counties';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  options: any;
  layersControl!: L.Control.Layers;
  map!: L.Map;
  baseLayers: L.Layer[] = [];
  counties = COUNTIES;
  currentGeoJSONLayer?: L.GeoJSON;
  isSmallScreen: boolean = window.innerWidth < 768; // Breakpoint for small screens

  constructor(private zone: NgZone) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isSmallScreen = window.innerWidth < 768;
  }

  ngOnInit(): void {
    this.initMapOptions();
  }

  private initMapOptions(): void {
    this.options = {
      layers: [
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: 'Map data © OpenStreetMap contributors'
        })
      ],
      zoom: 7,
      center: L.latLng(0, 0) // Default center, will be overridden by drawCounty
    };
    this.baseLayers.push(this.options.layers[0]);
  }

  drawCounty(county: any): void {
    if (!this.map) {
      console.error('Map is not initialized yet.');
      return; // Exit the method if the map isn't ready
    }

    if (this.currentGeoJSONLayer) {
      this.map.removeLayer(this.currentGeoJSONLayer);
    }

    this.currentGeoJSONLayer = L.geoJSON(county.geometries as GeoJsonObject, {
      onEachFeature: (feature, layer) => {
        layer.bindPopup(county.name);
      }
    }).addTo(this.map);

    this.map.setView(L.latLng(county.center[1], county.center[0]), 7);
  }

  onMapReady(map: L.Map) {
    this.map = map;
    this.drawCounty(this.counties[0]); // Draw the initial county again
  }

  onCountySelected(county: any): void {
    this.drawCounty(county);
    if (this.isSmallScreen) {
      // Ensures execution inside Angular's zone to update the view
      this.zone.run(() => {
        setTimeout(() => this.initializeOrRefreshMap(), 50); // Adjust delay as needed
      });
    }
  }

  private initializeOrRefreshMap() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}
