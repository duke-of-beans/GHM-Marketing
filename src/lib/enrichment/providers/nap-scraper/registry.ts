/**
 * NAP Scraper — Directory Registry
 *
 * Configuration for all directories we check citation consistency on.
 * Each entry describes how to search for a business and where to find NAP data.
 *
 * NOTE: selector-based scraping is fragile by nature. The healthCheck cron
 * runs weekly to detect broken adapters and mark them isDegraded so they're
 * excluded from client health scores rather than producing false negatives.
 */

export type SearchMethod = "url" | "outscraper";
export type Importance = "critical" | "high" | "medium";

export interface DirectoryConfig {
  key: string;
  displayName: string;
  importance: Importance;
  searchMethod: SearchMethod;
  // For url-based: template with {business}, {city}, {state} placeholders
  searchUrlPattern?: string;
  // CSS selectors on the search result page (before clicking into listing)
  selectors?: {
    listingLink: string;    // anchor to the business detail page
    name: string;
    address: string;
    phone: string;
  };
  // Some directories need a second fetch (search → detail page)
  requiresDetailPage?: boolean;
  detailSelectors?: {
    name: string;
    address: string;
    phone: string;
  };
}

export const DIRECTORY_REGISTRY: DirectoryConfig[] = [
  // ── CRITICAL ───────────────────────────────────────────────────────────────
  {
    key: "google_business",
    displayName: "Google Business Profile",
    importance: "critical",
    searchMethod: "outscraper",
    // Outscraper GMB data already fetched during competitive scan; reuse it
  },
  {
    key: "yelp",
    displayName: "Yelp",
    importance: "critical",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.yelp.com/search?find_desc={business}&find_loc={city}+{state}",
    selectors: {
      listingLink: 'h3.css-1agk4wl a[href^="/biz/"]',
      name: "h1.css-1se897c",
      address: 'address[id="map-box-address"]',
      phone: 'p[class*="css-"] a[href^="tel:"]',
    },
    requiresDetailPage: true,
    detailSelectors: {
      name: "h1.css-1se897c",
      address: 'address[id="map-box-address"]',
      phone: 'p[class*="css-"] a[href^="tel:"]',
    },
  },
  {
    key: "facebook",
    displayName: "Facebook",
    importance: "critical",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.facebook.com/search/pages/?q={business}+{city}+{state}",
    selectors: {
      listingLink: 'a[href*="facebook.com/"][role="link"]',
      name: 'h1[class*="x1heor9g"]',
      address: '[data-testid="profile-address"]',
      phone: '[data-testid="profile-phone"]',
    },
    requiresDetailPage: true,
    detailSelectors: {
      name: 'h1[class*="x1heor9g"]',
      address: '[data-testid="profile-address"]',
      phone: '[data-testid="profile-phone"]',
    },
  },

  // ── HIGH ───────────────────────────────────────────────────────────────────
  {
    key: "bbb",
    displayName: "Better Business Bureau",
    importance: "high",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.bbb.org/search?find_text={business}&find_loc={city}+{state}",
    selectors: {
      listingLink: 'a[data-component="Link"][href*="/profile/"]',
      name: 'span[itemprop="name"]',
      address: 'address span[itemprop="streetAddress"]',
      phone: 'a[href^="tel:"]',
    },
    requiresDetailPage: true,
    detailSelectors: {
      name: 'h1[data-cy="business-name"]',
      address: '[data-cy="address-line1"]',
      phone: 'a[data-cy="phone-number"]',
    },
  },
  {
    key: "yellowpages",
    displayName: "Yellow Pages",
    importance: "high",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.yellowpages.com/search?search_terms={business}&geo_location_terms={city}+{state}",
    selectors: {
      listingLink: 'a.business-name',
      name: 'h1[itemprop="name"]',
      address: 'span[itemprop="streetAddress"]',
      phone: 'a[class*="phone"]',
    },
    requiresDetailPage: true,
    detailSelectors: {
      name: 'h1[itemprop="name"]',
      address: 'span[itemprop="streetAddress"]',
      phone: 'a[class*="phone"]',
    },
  },
  {
    key: "bing_places",
    displayName: "Bing Places",
    importance: "high",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.bing.com/maps?q={business}+{city}+{state}&lvl=13",
    selectors: {
      listingLink: 'a.listings-item',
      name: 'div[class*="business-name"]',
      address: 'div[class*="address"]',
      phone: 'a[href^="tel:"]',
    },
  },
  {
    key: "apple_maps",
    displayName: "Apple Maps",
    importance: "high",
    searchMethod: "url",
    searchUrlPattern:
      "https://maps.apple.com/?q={business}+{city}+{state}",
    selectors: {
      listingLink: 'a[data-testid="place-result"]',
      name: 'h1[data-testid="place-name"]',
      address: '[data-testid="place-address"]',
      phone: 'a[href^="tel:"]',
    },
  },
  {
    key: "mapquest",
    displayName: "MapQuest",
    importance: "high",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.mapquest.com/search/results?query={business}+{city}+{state}",
    selectors: {
      listingLink: 'a.result-name',
      name: 'h1.name',
      address: 'div.address',
      phone: 'a.phone',
    },
  },

  // ── MEDIUM ─────────────────────────────────────────────────────────────────
  {
    key: "foursquare",
    displayName: "Foursquare",
    importance: "medium",
    searchMethod: "url",
    searchUrlPattern:
      "https://foursquare.com/v/{business}-{city}",
    selectors: {
      listingLink: 'a[href*="/v/"]',
      name: 'h1[class*="venueHeaderName"]',
      address: 'span[class*="venueAddress"]',
      phone: 'a[href^="tel:"]',
    },
  },
  {
    key: "hotfrog",
    displayName: "Hotfrog",
    importance: "medium",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.hotfrog.com/search/{state}/{city}/{business}",
    selectors: {
      listingLink: 'h3.business-name a',
      name: 'h1.businessName',
      address: 'span.address',
      phone: 'span.phonenumber',
    },
  },
  {
    key: "manta",
    displayName: "Manta",
    importance: "medium",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.manta.com/search?search_source=nav&search={business}&location={city}+{state}",
    selectors: {
      listingLink: 'a[data-click-type="company"]',
      name: 'h1[data-cy="company-name"]',
      address: 'address[data-cy="address"]',
      phone: 'a[data-cy="phone"]',
    },
    requiresDetailPage: true,
    detailSelectors: {
      name: 'h1[data-cy="company-name"]',
      address: 'address[data-cy="address"]',
      phone: 'a[data-cy="phone"]',
    },
  },
  {
    key: "superpages",
    displayName: "Superpages",
    importance: "medium",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.superpages.com/search?search_terms={business}&geo_location_terms={city}+{state}",
    selectors: {
      listingLink: 'a.business-name',
      name: 'span[itemprop="name"]',
      address: 'span[itemprop="streetAddress"]',
      phone: 'a[class*="phone"]',
    },
  },
  {
    key: "citysearch",
    displayName: "Citysearch",
    importance: "medium",
    searchMethod: "url",
    searchUrlPattern:
      "https://www.citysearch.com/find/{business}/{city}-{state}",
    selectors: {
      listingLink: 'a.cs-listing-title',
      name: 'h1.businessName',
      address: 'address.businessAddress',
      phone: 'span.phoneNumber',
    },
  },
];

// Fast lookup by key
export const DIRECTORY_MAP = new Map<string, DirectoryConfig>(
  DIRECTORY_REGISTRY.map((d) => [d.key, d])
);

// Importance weights for health score calculation
export const IMPORTANCE_WEIGHTS: Record<Importance, number> = {
  critical: 3,
  high: 2,
  medium: 1,
};
