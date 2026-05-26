export interface NoteSummary {
  id: number;
  title: string;
  content: string;
  eventTime: string;
}

export interface PlaceProperties {
  placeId: number;
  name?: string | null;
  noteCount: number;
  latestEventTime?: string | null;
  notes: NoteSummary[];
}

export interface PlaceFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: PlaceProperties;
}

export interface PlaceFeatureCollection {
  type: "FeatureCollection";
  features: PlaceFeature[];
}
