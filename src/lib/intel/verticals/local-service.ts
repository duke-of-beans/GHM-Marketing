import type { VerticalProfile } from "../types";

/**
 * Local Service Business Vertical Profile
 *
 * Covers: plumbers, electricians, HVAC, landscaping, cleaning services, etc.
 * Key signals: GBP performance, local pack rankings, review velocity, citation consistency
 */
export const localServiceProfile: VerticalProfile = {
  verticalId: "local-service",
  displayName: "Local Service Business",
  description:
    "Service-area businesses that rely on local search visibility, Google Business Profile, and review reputation.",

  sensors: [
    {
      sensorId: "gbp",
      displayName: "Google Business Profile",
      description: "GBP listing health, posts, Q&A, attributes",
      verticals: ["local-service", "local-retail", "hospitality"],
      requiresCredentials: true,
      defaultEnabled: true,
    },
    {
      sensorId: "reviews",
      displayName: "Review Aggregator",
      description: "Google, Yelp, and niche review platforms",
      verticals: ["local-service", "local-retail", "hospitality"],
      requiresCredentials: false,
      defaultEnabled: true,
    },
    {
      sensorId: "local-rank",
      displayName: "Local Rank Tracker",
      description: "Local pack and map pack position tracking",
      verticals: ["local-service", "local-retail"],
      requiresCredentials: true,
      defaultEnabled: true,
    },
    {
      sensorId: "citations",
      displayName: "Citation Auditor",
      description: "NAP consistency across directories",
      verticals: ["local-service", "local-retail"],
      requiresCredentials: false,
      defaultEnabled: true,
    },
    {
      sensorId: "pagespeed",
      displayName: "PageSpeed & Core Web Vitals",
      description: "Lighthouse performance, CWV metrics",
      verticals: ["local-service", "local-retail", "ecommerce", "saas"],
      requiresCredentials: false,
      defaultEnabled: true,
    },
    {
      sensorId: "backlinks",
      displayName: "Backlink Monitor",
      description: "New/lost links, DA tracking, toxic link detection",
      verticals: ["local-service", "local-retail", "ecommerce", "saas"],
      requiresCredentials: true,
      defaultEnabled: false,
      costPerCall: 0.02,
    },
  ],
  metrics: [
    {
      key: "gbp_completeness",
      label: "GBP Completeness",
      description: "Percentage of GBP fields populated (hours, photos, services, attributes)",
      unit: "percentage",
      source: "gbp",
      higherIsBetter: true,
      thresholds: { warning: 70, critical: 50 },
    },
    {
      key: "review_rating_avg",
      label: "Average Review Rating",
      description: "Weighted average across Google and Yelp",
      unit: "score",
      source: "reviews",
      higherIsBetter: true,
      thresholds: { warning: 3.8, critical: 3.0 },
    },
    {
      key: "review_count_30d",
      label: "Reviews (30 days)",
      description: "New reviews received in the last 30 days",
      unit: "count",
      source: "reviews",
      higherIsBetter: true,
      thresholds: { warning: 2, critical: 0 },
    },
    {
      key: "review_response_rate",
      label: "Review Response Rate",
      description: "Percentage of reviews responded to by owner",
      unit: "percentage",
      source: "reviews",
      higherIsBetter: true,
      thresholds: { warning: 60, critical: 30 },
    },
    {
      key: "local_pack_position",
      label: "Local Pack Position",
      description: "Average position in local 3-pack for tracked keywords",
      unit: "number",
      source: "local-rank",
      higherIsBetter: false,
      thresholds: { warning: 5, critical: 10 },
    },
    {
      key: "citation_consistency",
      label: "NAP Consistency",
      description: "Percentage of citations with correct Name/Address/Phone",
      unit: "percentage",
      source: "citations",
      higherIsBetter: true,
      thresholds: { warning: 80, critical: 60 },
    },
    {
      key: "lcp",
      label: "Largest Contentful Paint",
      description: "Core Web Vital: main content load time in ms",
      unit: "number",
      source: "pagespeed",
      higherIsBetter: false,
      thresholds: { warning: 2500, critical: 4000 },
    },
    {
      key: "domain_authority",
      label: "Domain Authority",
      description: "Moz DA or equivalent authority score",
      unit: "score",
      source: "backlinks",
      higherIsBetter: true,
    },
  ],
  healthScore: {
    weights: [
      { metricKey: "gbp_completeness", weight: 0.20, label: "GBP Health" },
      { metricKey: "review_rating_avg", weight: 0.20, label: "Review Quality" },
      { metricKey: "review_count_30d", weight: 0.10, label: "Review Velocity" },
      { metricKey: "review_response_rate", weight: 0.10, label: "Engagement" },
      { metricKey: "local_pack_position", weight: 0.20, label: "Local Visibility" },
      { metricKey: "citation_consistency", weight: 0.10, label: "Citation Health" },
      { metricKey: "lcp", weight: 0.10, label: "Site Speed" },
    ],
    minScore: 0,
    maxScore: 100,
    defaultScore: 50,
  },

  thresholdRules: [
    {
      ruleId: "ls-review-drop",
      label: "Review Rating Drop",
      description: "Average rating dropped significantly in 30-day window",
      metric: "review_rating_avg",
      condition: "delta_lt",
      value: -0.3,
      priority: "P1",
      taskTemplate: {
        category: "reputation",
        title: "Review rating declined — investigate and respond",
        descriptionTemplate:
          "Rating for {{assetName}} dropped by {{delta}} to {{currentValue}}. Review recent negative feedback and draft responses.",
        estimatedMinutes: 45,
      },
    },
    {
      ruleId: "ls-gbp-incomplete",
      label: "GBP Completeness Below Threshold",
      description: "Google Business Profile is missing key fields",
      metric: "gbp_completeness",
      condition: "lt",
      value: 70,
      priority: "P2",
      taskTemplate: {
        category: "gbp",
        title: "Complete GBP listing for {{assetName}}",
        descriptionTemplate:
          "GBP completeness is {{currentValue}}%. Fill in missing fields: hours, services, photos, attributes.",
        estimatedMinutes: 30,
      },
    },
    {
      ruleId: "ls-no-reviews",
      label: "Zero Reviews in 30 Days",
      description: "No new reviews received — review generation campaign needed",
      metric: "review_count_30d",
      condition: "lt",
      value: 1,
      priority: "P2",
      taskTemplate: {
        category: "reputation",
        title: "Launch review generation for {{assetName}}",
        descriptionTemplate:
          "{{assetName}} received 0 reviews in the past 30 days. Set up review request automation or outreach.",
        estimatedMinutes: 60,
      },
    },
    {
      ruleId: "ls-local-pack-lost",
      label: "Lost Local Pack Position",
      description: "Dropped out of local 3-pack for primary keywords",
      metric: "local_pack_position",
      condition: "gt",
      value: 3,
      priority: "P1",
      taskTemplate: {
        category: "local-seo",
        title: "Recover local pack ranking for {{assetName}}",
        descriptionTemplate:
          "{{assetName}} dropped to position {{currentValue}} in local pack. Audit GBP, citations, and on-page signals.",
        estimatedMinutes: 90,
      },
    },
    {
      ruleId: "ls-nap-inconsistent",
      label: "NAP Inconsistency Detected",
      description: "Citation accuracy fell below acceptable threshold",
      metric: "citation_consistency",
      condition: "lt",
      value: 80,
      priority: "P2",
      taskTemplate: {
        category: "citations",
        title: "Fix NAP inconsistencies for {{assetName}}",
        descriptionTemplate:
          "NAP consistency is {{currentValue}}%. Identify and correct mismatched listings across directories.",
        estimatedMinutes: 60,
      },
    },
    {
      ruleId: "ls-slow-site",
      label: "Poor Core Web Vitals",
      description: "LCP exceeds Google's 'good' threshold",
      metric: "lcp",
      condition: "gt",
      value: 2500,
      priority: "P3",
      taskTemplate: {
        category: "technical-seo",
        title: "Improve page speed for {{assetName}}",
        descriptionTemplate:
          "LCP is {{currentValue}}ms (target: <2500ms). Optimize images, reduce render-blocking resources.",
        estimatedMinutes: 120,
      },
    },
  ],

  assetTypes: ["website", "gbp_listing", "landing_page"],
  groupTypes: ["client", "franchise_network", "multi_location"],
};
