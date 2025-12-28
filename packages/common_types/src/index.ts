export interface Venue {
  id?: number;
  name: string;
  gmaps_place_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  website: string | null;
  phone_number: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface VenueInput {
  name: string;
  gmaps_place_id: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  website?: string | null;
  phone_number?: string | null;
}

export interface FetchVenuesWorkflowInput {
  neighborhood?: string;
  limit?: number;
}

export interface FetchVenuesWorkflowOutput {
  venuesProcessed: number;
  venuesInserted: number;
  venuesUpdated: number;
}

export interface GoogleMapsPlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  website?: string;
  formatted_phone_number?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
}


