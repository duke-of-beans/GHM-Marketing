# GHM Credential Registry
# Source of truth index for the `clients` vault
# Vault entries are encrypted — this file maps what exists and where it came from
# Last updated: 2026-02-23

## Vault: `clients`

### Alaska Ocean Safaris
| Key | Description | Source | Status |
|-----|-------------|--------|--------|
| `wp-alaska-ocean-safaris-user` | WP Admin username | Basecamp message (discovered 2026-02-23) | ✅ Current as of 2026-02-17 |
| `wp-alaska-ocean-safaris-pass` | WP Admin password | Basecamp message (discovered 2026-02-23) | ✅ Current as of 2026-02-17 |

**Site:** https://alaskaoceansafaris.com  
**Notes:** Non-paying client. Friend of Gavin's.

---

### Cerrones European
| Key | Description | Source | Status |
|-----|-------------|--------|--------|
| `wp-cerrones-european-user` | WP Admin username | Previously vaulted | ⚠️ Verify currency |
| `wp-cerrones-european-pass` | WP Admin password | Previously vaulted | ⚠️ Verify currency |
| `autoops-api-key-cerrones` | AutoOps scheduling widget API key | Basecamp message | ✅ Active |

**Site:** https://www.cerroneseuropean.com  
**AutoOps portal:** https://portal.autoops.com  

---

### McIlvain Motors
| Key | Description | Source | Status |
|-----|-------------|--------|--------|
| `wp-mcilvain-motors-user` | WP Admin username (Admin) | Basecamp message Mar 17 2025 | ⚠️ May be stale — verify |
| `wp-mcilvain-motors-pass` | WP Admin password | Basecamp message Mar 17 2025 | ⚠️ May be stale — verify |

**Site:** https://www.mcilvainmotors.com  
**Notes:** Porsche-only shop. Google accounts managed under Goldenglovesmarketing@gmail.com.

---

### Sevcik's Service Center
| Key | Description | Source | Status |
|-----|-------------|--------|--------|
| `wp-sevciks-service-center-user` | WP Admin username | Previously vaulted | ⚠️ Verify currency |
| `wp-sevciks-service-center-pass` | WP Admin password | Previously vaulted | ⚠️ Verify currency |

**Sites:** https://www.sevciksservicecenter.com / https://www.collegestationautorepair.com  
**Location:** College Station, TX

---

### The German Auto Doctor
| Key | Description | Source | Status |
|-----|-------------|--------|--------|
| `wp-german-auto-doctor-user` | WP Admin username | Previously vaulted | ⚠️ Verify currency |
| `wp-german-auto-doctor-pass` | WP Admin password | Previously vaulted | ⚠️ Verify currency |
| `shopmonkey-api-key-german-auto-doctor` | ShopMonkey scheduling JWT | Basecamp (exposed in message) | ✅ Active |

**Site:** https://germanautodoctorsimivalley.com  
**ShopMonkey:** https://app.shopmonkey.cloud (lid: 5c74ecda5d0bae0ab247e5df)  
**Notes:** Client owns 62 domains. Satellite site strategy active. T1/T2/T3 product matrix in development.

---

### GHM Digital Marketing (Internal)
| Key | Description | Source | Status |
|-----|-------------|--------|--------|
| `ghm-social-logins-sheet` | Google Sheet URL with all social media logins | Basecamp message | ⚠️ Migrate to vault — creds in a Sheet is a security risk |

**Site:** https://ghmdigital.com  
**Notes:** Migrate all social platform credentials from the Sheet into individual vault entries.

---

## Vault: `ghm`
| Key | Description | Status |
|-----|-------------|--------|
| `basecamp-client-id` | Basecamp OAuth client ID | ✅ Active |
| `basecamp-client-secret` | Basecamp OAuth secret | ✅ Active |
| (other GHM operational keys) | Various | See vault |

---

## Known Gaps / Action Items
- [ ] Verify McIlvain WP creds are still current (from Mar 2025)
- [ ] Verify Cerrones, Sevcik's, GAD vault entries are current
- [ ] Migrate GHM social logins from Google Sheet to vault
- [ ] Pull ShopMonkey full JWT from Basecamp (entry truncated)
- [ ] Add hosting provider credentials for each client site
- [ ] Add Google Ads / GA4 access credentials per client
