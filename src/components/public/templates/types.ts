import type { ReactNode } from "react";

// Lineup artist type matching the Prisma JSON structure
export interface LineupArtist {
  name: string;
  role?: string;
  imageUrl?: string;
  socialUrl?: string;
  showtime?: string;
  showShowtime?: boolean;
}

// Live design overrides
export interface LiveDesign {
  accentColor?: string;
  backgroundColor?: string;
  pageTheme?: string;
  typography?: string;
  showLocationOnPage?: boolean;
  showMapOnPage?: boolean;
  isAddressHidden?: boolean;
}

// Event data fetched from Prisma
export interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  flyerUrl: string | null;
  startsAt: Date;
  timezone: string;
  venueName: string;
  venueAddress: string | null;
  city: string;
  state: string | null;
  isAddressHidden: boolean;
  ageRestriction: string | null;
  lineup: any;
  isPublished: boolean;
  accentColor: string | null;
  backgroundColor: string | null;
  pageTheme: string | null;
  typography: string | null;
  showLocationOnPage: boolean;
  showMapOnPage: boolean;
  locationPrecision: string | null;
  isRsvpOnly: boolean;
  rsvpCapacity: number | null;
  rsvpAllowPlusOnes: boolean;
  rsvpMaxPlusOnes: number | null;
  rsvpCount: number;
  about: string | null;
  refundPolicy: string | null;
  faqs: any;
  previousStartsAt: Date | null;
  previousEndsAt: Date | null;
  rescheduledAt: Date | null;
  organizer: {
    id: string;
    displayName: string;
    slug: string;
    logoUrl: string | null;
    instagramUrl: string | null;
    stripeChargesEnabled: boolean;
  };
  seriesId: string | null;
  seriesOccurrence: number | null;
  series: {
    id: string;
    title: string;
  } | null;
  ticketTiers: any[];
}

export interface SeriesOccurrence {
  id: string;
  title: string;
  slug: string;
  startsAt: Date;
  seriesOccurrence: number | null;
}

export interface EventTemplateProps {
  event: EventData;
  liveDesign?: LiveDesign;
  
  // Theme & Styling
  accentColor: string;
  backgroundColor: string;
  typographyClass: string;
  textColor: string;
  accentTextColor: string;
  
  // Dates & Times
  dateStr: string;
  timeStr: string;
  dayStr: string;
  
  // Locations & Maps
  showLocation: boolean;
  showMap: boolean;
  locationPrecision: string;
  mapUrl: string | null;
  mapEmbedUrl: string | null;
  
  // Banners
  rescheduledBannerElement: ReactNode | null;
  
  // Pricing & Availability
  lowestPrice: number;
  hasAvailability: boolean;
  isRsvpEvent: boolean;
  ctaUrl: string;
  ctaText: string;
  ctaTextLower: string;
  
  // Derived Data
  lineup: LineupArtist[];
  seriesOccurrences: SeriesOccurrence[];
  isOwner: boolean;
}
