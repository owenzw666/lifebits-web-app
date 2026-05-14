
export interface NoteProperties {
  id: number;
  title?: string;
  content: string;
  eventTime: string;
}

export interface GeoJsonFeature {
  type: "Feature";

  geometry: {
    type: "Point";
    coordinates: [number, number];
  };

  properties: NoteProperties;
}

export interface GeoJsonFeatureCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}