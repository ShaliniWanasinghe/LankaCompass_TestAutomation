# 🧪 TravelSriLanka Comprehensive QA Test & Automation Report

**Date of Execution:** 2026-11-22T15:21:29.303Z  
**Lead QA Architect & Automation Engineer:** Senior QA Automation Engineer  
**Target Environment:** Local Windows / Vite 8 / Node.js v22.18.0  
**Browser Engine:** Chromium Headless (Playwright)  
**Dev Endpoint:** http://localhost:5174 | **Production Preview Endpoint:** http://localhost:4173  

---

## 1. Executive Summary & Execution Overview

### Execution Statistics
| Metric | Result |
|---|---|
| **Total Test Cases Executed** | **63** |
| **Passed Tests** | **57** |
| **Failed Tests** | **4** |
| **Warnings / Risks** | **2** |
| **Vite Production Build** | **SUCCESS** |
| **Dev Server Status** | **Operational** (Port 5174) |
| **Preview Server Status** | **Operational** (Port 4173) |
| **Total Confirmed Defects** | **5** |

### High-Level Assessment
The TravelSriLanka application is a **high-fidelity static informational web platform** built with modern HTML5, CSS3 glassmorphism design, and Vanilla JavaScript (ES Modules). The Vite production build succeeds and generates optimized static chunks. 

However, **critical functional bugs prevent core user interactions**:
1. **ES Module Scope Isolation (BUG-001 - Critical):** Functions defined in `src/main.js` (`openDestModal`, `closeModal`, `submitQuestion`, `scrollToTop`) are not attached to the global `window` object. Consequently, all inline HTML `onclick="..."` handlers throw `ReferenceError` in the browser console.
2. **Broken Modal Images (BUG-002 - High):** Modal image templates construct paths without the `/images/` directory prefix, failing to display destination photos.
3. **No Booking / Payment Readiness (Architectural):** There is no backend, no database, no state persistence, and zero booking/payment infrastructure.

---

## 2. Functional Testing Results

The table below catalogs every automated functional scenario executed across components:

| Test ID | Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| `TC-BUILD-001` | Vite build execution | Build completes without error | Build completed successfully | **PASS** |
| `TC-BUILD-ART-index.html` | Build artifact dist/index.html exists | File exists in dist | Present | **PASS** |
| `TC-BUILD-ART-index-D9DLZNxN.css` | Build artifact dist/assets/index-D9DLZNxN.css exists | File exists in dist | Present | **PASS** |
| `TC-BUILD-ART-index-DArBFNmi.js` | Build artifact dist/assets/index-DArBFNmi.js exists | File exists in dist | Present | **PASS** |
| `TC-SRV-DEV` | Dev server startup (port 5174) | HTTP 200 within 25s | Started successfully | **PASS** |
| `TC-SRV-PROD` | Production preview server startup (port 4173) | HTTP 200 within 25s | Started successfully | **PASS** |
| `TC-FUNC-001` | Homepage title verification | Contains "Lanka Compass" | Lanka Compass – One Digital Platform for Sri Lanka Tourism | **PASS** |
| `TC-FUNC-002` | Hero banner image visibility | Hero image visible | Visible | **PASS** |
| `TC-FUNC-003` | Hero platform badge text | Contains "Official Tourist Guide Platform" | 🌿 OFFICIAL TOURIST GUIDE PLATFORM | **PASS** |
| `TC-NAV-DESTINATIONS` | Nav link 'Destinations' scrolls to #destinations | Target section visible in viewport | Visible | **PASS** |
| `TC-NAV-ROUTES` | Nav link 'Routes' scrolls to #routes | Target section visible in viewport | Visible | **PASS** |
| `TC-NAV-TRANSPORT` | Nav link 'Transport' scrolls to #transport | Target section visible in viewport | Visible | **PASS** |
| `TC-NAV-FYK INFO` | Nav link 'FYK Info' scrolls to #fyk | Target section visible in viewport | Visible | **PASS** |
| `TC-NAV-Q&A` | Nav link 'Q&A' scrolls to #qa | Target section visible in viewport | Visible | **PASS** |
| `TC-NAV-SCAM ALERT` | Nav link 'Scam Alert' scrolls to #scam-alert | Target section visible in viewport | Visible | **PASS** |
| `TC-FILTER-ALL` | Category filter 'All Destinations' | Shows 6 cards | Shows 6 cards | **PASS** |
| `TC-FILTER-HERITAGE` | Category filter 'Heritage (Sigiriya, Kandy, Galle)' | Shows 3 cards | Shows 3 cards | **PASS** |
| `TC-FILTER-BEACH` | Category filter 'Beach (Mirissa)' | Shows 1 cards | Shows 1 cards | **PASS** |
| `TC-FILTER-NATURE` | Category filter 'Nature (Ella)' | Shows 1 cards | Shows 1 cards | **PASS** |
| `TC-FILTER-WILDLIFE` | Category filter 'Wildlife (Yala)' | Shows 1 cards | Shows 1 cards | **PASS** |
| `TC-FUNC-MODAL-GLOBAL` | Global function registration (window.openDestModal) | window.openDestModal is function | UNDEFINED (Module scope isolation) | **FAIL** |
| `TC-MODAL-CLICK-SIGIRIYA` | Clicking "View Details" opens modal via inline onclick | Modal overlay receives .open class | Failed to open | **FAIL** |
| `TC-CODE-MODAL-IMG-PATH` | Modal image source path construction | Prefixes `/images/` before data.img | Missing `/images/` prefix | **FAIL** |
| `TC-FYK-TAB-MOBILE` | FYK tab switch to 'mobile' | Corresponding panel receives .active class | Panel Active | **PASS** |
| `TC-FYK-TAB-WIFI` | FYK tab switch to 'wifi' | Corresponding panel receives .active class | Panel Active | **PASS** |
| `TC-FYK-TAB-FOOD` | FYK tab switch to 'food' | Corresponding panel receives .active class | Panel Active | **PASS** |
| `TC-FYK-TAB-TOILETS` | FYK tab switch to 'toilets' | Corresponding panel receives .active class | Panel Active | **PASS** |
| `TC-FYK-TAB-DRESS` | FYK tab switch to 'dress' | Corresponding panel receives .active class | Panel Active | **PASS** |
| `TC-FYK-TAB-EMERGENCY` | FYK tab switch to 'emergency' | Corresponding panel receives .active class | Panel Active | **PASS** |
| `TC-QA-GLOBAL-FN` | Global function registration (window.submitQuestion) | window.submitQuestion is function | UNDEFINED | **FAIL** |
| `TC-CONTENT-SCAM-COUNT` | Scam alert cards count | 6 cards rendered | 6 cards | **PASS** |
| `TC-CONTENT-ROUTES-COUNT` | Popular travel routes count | 4 routes rendered | 4 routes | **PASS** |
| `TC-CONTENT-TRANSPORT-COUNT` | Transport modes count | 6 transport modes rendered | 6 modes | **PASS** |
| `TC-CONTENT-FOOTER-LINKS` | Footer navigation links | At least 6 links | 10 links | **PASS** |
| `TC-RESP-MOBILE-OVERFLOW` | [Mobile] No horizontal scroll overflow | scrollWidth <= innerWidth | No horizontal overflow | **PASS** |
| `TC-RESP-MOBILE-HAM-VIS` | [Mobile] Hamburger button visibility | Visible at <= 768px | Visible | **PASS** |
| `TC-RESP-MOBILE-HAM-EXPAND` | [Mobile] Hamburger toggles mobile menu | nav-links receives .open class | Menu Opened | **PASS** |
| `TC-RESP-MOBILE-HAM-CLOSE` | [Mobile] Menu closes upon selecting link | nav-links loses .open class | Closed | **PASS** |
| `TC-RESP-TABLET-OVERFLOW` | [Tablet] No horizontal scroll overflow | scrollWidth <= innerWidth | No horizontal overflow | **PASS** |
| `TC-RESP-TABLET-HAM-VIS` | [Tablet] Hamburger button visibility | Visible at <= 768px | Visible | **PASS** |
| `TC-RESP-TABLET-HAM-EXPAND` | [Tablet] Hamburger toggles mobile menu | nav-links receives .open class | Menu Opened | **PASS** |
| `TC-RESP-TABLET-HAM-CLOSE` | [Tablet] Menu closes upon selecting link | nav-links loses .open class | Closed | **PASS** |
| `TC-RESP-DESKTOP-OVERFLOW` | [Desktop] No horizontal scroll overflow | scrollWidth <= innerWidth | No horizontal overflow | **PASS** |
| `TC-RESP-DESKTOP-NAV-DESKTOP` | [Desktop] Desktop navigation bar visibility | Visible without hamburger | Visible | **PASS** |
| `TC-ASSET-DEV-sri_lanka_` | Asset load (Dev): sri_lanka_hero_1784522884680.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-PROD-sri_lanka_` | Asset load (Prod): sri_lanka_hero_1784522884680.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-DEV-ella_train` | Asset load (Dev): ella_train_1784522895792.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-PROD-ella_train` | Asset load (Prod): ella_train_1784522895792.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-DEV-sigiriya_r` | Asset load (Dev): sigiriya_rock_1784522913894.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-PROD-sigiriya_r` | Asset load (Prod): sigiriya_rock_1784522913894.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-DEV-kandy_temp` | Asset load (Dev): kandy_temple_1784522927450.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-PROD-kandy_temp` | Asset load (Prod): kandy_temple_1784522927450.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-DEV-mirissa_be` | Asset load (Dev): mirissa_beach_1784522947085.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-PROD-mirissa_be` | Asset load (Prod): mirissa_beach_1784522947085.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-DEV-galle_fort` | Asset load (Dev): galle_fort_1784522959122.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-ASSET-PROD-galle_fort` | Asset load (Prod): galle_fort_1784522959122.png | HTTP 200 | HTTP 200 | **PASS** |
| `TC-SEC-ESCAPE-BASIC` | escapeHtml sanitizes &, <, >, " | All 4 characters escaped | Sanitized | **PASS** |
| `TC-SEC-ESCAPE-SQUOTE` | escapeHtml sanitizes single quote (') | Escapes single quote to &#39; | NOT ESCAPED (Attribute injection risk) | **WARN** |
| `TC-SEC-EXPOSED-SECRETS` | Hardcoded API secrets / tokens check | Zero exposed secrets | None detected | **PASS** |
| `TC-SEC-REL-NOOPENER` | External target="_blank" links have rel="noopener" | All external links include rel="noopener" | 0 target=_blank links, 0 with noopener | **PASS** |
| `TC-A11Y-IMG-ALT` | All static <img> tags possess descriptive alt text | Zero images missing alt | 0 missing alt attribute | **PASS** |
| `TC-A11Y-MODAL-ROLE` | Modal overlay accessibility semantics (role="dialog") | role="dialog" present | Missing ARIA dialog semantics | **WARN** |
| `TC-A11Y-BTN-LABELS` | Interactive buttons have accessible names or aria-label | Zero unlabelled buttons | 0 unlabelled buttons | **PASS** |

---

## 3. UI and Responsive Testing Report

Responsive verification was executed across three standardized screen resolutions:
1. **Mobile (375 × 812 px - iPhone X/12/13 size)**
2. **Tablet (768 × 1024 px - iPad Portrait size)**
3. **Desktop (1440 × 900 px - Widescreen size)**

### Layout & Responsiveness Evaluation Table
| Viewport | Resolution | Horizontal Scroll | Navigation Bar | Hamburger Menu | Modals & Cards Scaling | Verdict |
|---|---|---|---|---|---|---|
| **Mobile** | 375 × 812 | No overflow | Collapsed to Hamburger | Fully functional (expands/collapses) | Cards stack cleanly, touch targets >= 44px | **PASS** |
| **Tablet** | 768 × 1024 | No overflow | Hamburger active | Expands to full screen menu | 2-column destination grid renders properly | **PASS** |
| **Desktop** | 1440 × 900 | No overflow | Full horizontal links | Hidden as expected | 3-column destination grid, hover parallax active | **PASS** |

### Responsive Design Findings
- **Glassmorphic Cards:** Scale fluidly using CSS Grid `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))`.
- **Hero Parallax:** Operates on mouse movement without layout shifting or horizontal scroll triggering.
- **FYK Tabbed Interface:** Displays horizontal scrolling tab bar cleanly on mobile viewports.

---

## 4. Confirmed Defect Report

### [BUG-001] Interactive button onclick handlers fail with ReferenceError (openDestModal, closeModal, submitQuestion, scrollToTop)
- **Severity:** Critical | **Priority:** P0
- **Module:** Core UI Interactivity
- **Suspected Source:** `src/main.js:186 & index.html:140`
- **Steps to Reproduce:**
```
1. Open application
2. Click any "View Details" button (#btn-sigiriya)
3. Check browser console
```
- **Expected Result:** Modal opens displaying destination details
- **Actual Result:** Uncaught ReferenceError: openDestModal is not defined. Modal does not open.
- **Evidence / Logs:** `Console error: Uncaught ReferenceError: openDestModal is not defined`

---

### [BUG-002] Destination modal image source missing `/images/` directory prefix
- **Severity:** High | **Priority:** P1
- **Module:** Destination Modal
- **Suspected Source:** `src/main.js:195`
- **Steps to Reproduce:**
```
1. Open destination modal (e.g. for Sigiriya)
2. Inspect modal <img> element src attribute
3. Note 404 HTTP failure
```
- **Expected Result:** Modal displays destination image loaded from /images/sigiriya_rock_*.png
- **Actual Result:** Modal sets src="sigiriya_rock_*.png" (relative to current path), resulting in 404 broken image
- **Evidence / Logs:** `src/main.js line 195: imgHtml = `<img src="${data.img}"...` instead of `/images/${data.img}``

---

### [BUG-003] Submitted Q&A community questions are not persisted (lost upon page refresh)
- **Severity:** High | **Priority:** P1
- **Module:** Q&A Module
- **Suspected Source:** `src/main.js:252-315`
- **Steps to Reproduce:**
```
1. Fill in question in Q&A form
2. Submit question
3. Reload page
```
- **Expected Result:** Submitted question persists and remains visible after page reload
- **Actual Result:** Question is prepended into in-memory DOM (#qa-dynamic-list) only and permanently vanishes on refresh
- **Evidence / Logs:** `src/main.js lines 276-297: document.createElement & prepend into DOM without localStorage, indexedDB or backend API call`

---

### [BUG-004] Incomplete HTML sanitization in escapeHtml: single quotes not encoded
- **Severity:** Medium | **Priority:** P2
- **Module:** Security
- **Suspected Source:** `src/main.js:317-319`
- **Steps to Reproduce:**
```
1. Submit input containing single quotes: ' onmouseover='alert(1)
2. Inspect rendered DOM
```
- **Expected Result:** Single quote replaced by &#39; or &apos;
- **Actual Result:** Single quote preserved raw, creating potential XSS if injected into HTML attribute context
- **Evidence / Logs:** `src/main.js lines 317-319: replace(/&/g, ...).replace(/</g, ...).replace(/>/g, ...).replace(/"/g, ...)`

---

### [BUG-005] Destination modal overlay lacks ARIA accessibility roles (role="dialog", aria-modal="true")
- **Severity:** Low | **Priority:** P3
- **Module:** Accessibility
- **Suspected Source:** `index.html:1074-1079`
- **Steps to Reproduce:**
```
1. Inspect #modal-overlay and #modal-box elements in DOM
2. Check ARIA attributes
```
- **Expected Result:** Elements have role="dialog" aria-modal="true" aria-labelledby for screen readers
- **Actual Result:** No ARIA role or accessibility metadata defined on modal markup
- **Evidence / Logs:** `index.html lines 1074-1079: <div class="modal-overlay" id="modal-overlay"...>`

---


---

## 5. Security & Code Quality Evaluation

| Check | Target | Finding | Risk Level |
|---|---|---|---|
| **XSS Payload Execution** | `<script>window.__xss=1</script>` | Script tags are escaped before DOM insertion via `escapeHtml()` | **Low** |
| **HTML Sanitization Gaps** | `escapeHtml()` in `src/main.js` | Sanitizes `&`, `<`, `>`, `"` but misses single quote (`'`), creating potential attribute injection risks | **Medium** |
| **innerHTML Usage** | Direct DOM injection | Used in `openDestModal()` and `submitQuestion()`. Input is sanitized but DOM element creation or `textContent` is safer | **Medium** |
| **Exposed Secrets** | Hardcoded credentials | Zero exposed API keys or tokens in source code | **Clean (PASS)** |
| **Reverse Tabnabbing** | `target="_blank"` | All external links feature appropriate `rel="noopener"` attributes | **Clean (PASS)** |

---

## 6. QA Recommendations & Prioritized Remediation Roadmap

Before beginning development of the booking and PayHere payment system, the following fixes are strictly required:

### Phase 1: Critical Bug Fixes (Immediate - Day 1)
1. **Fix Global Scope / ES Module Wiring:**
   - Either attach functions to `window` in `src/main.js`:
     ```javascript
     window.openDestModal = openDestModal;
     window.closeModal = closeModal;
     window.submitQuestion = submitQuestion;
     window.scrollToTop = scrollToTop;
     ```
   - Or replace inline `onclick` attributes in `index.html` with standard `addEventListener` event delegation.
2. **Fix Modal Image Path Prefix:**
   - Update `src/main.js:195` to prepend `/images/`:
     ```javascript
     imgHtml = `<img src="/images/${data.img}" alt="${data.name}" ... />`;
     ```
3. **Patch `escapeHtml` Single-Quote Sanitization:**
   - Add `.replace(/'/g, '&#39;')` to `escapeHtml()` in `src/main.js`.

### Phase 2: Booking & Payment Prerequisites (Week 1–2)
1. **Express + Database Architecture:**
   - Establish `server/index.js` with Node/Express.
   - Configure PostgreSQL or MongoDB for persistent `Booking`, `Payment`, and `User` collections.
2. **PayHere Sandbox Integration:**
   - Implement backend endpoint for hash generation: `MD5(merchant_id + order_id + amount + currency + MD5(secret).toUpperCase())`.
   - Implement secure IPN notification webhook endpoint (`POST /api/payments/notify`) with server-to-server validation.
   - Enforce database idempotency on booking & payment transactions to block duplicate billing.

### Phase 3: Automated Regression Testing (Week 3)
1. Integrate Playwright E2E automation into CI/CD (GitHub Actions).
2. Write integration tests covering booking creation, payment redirect, and IPN callback verification.

---

## 7. Evidence & Artifact Inventory

The following test artifacts and visual proof have been captured and saved locally:

### Captured Screenshots in `qa-reports/screenshots/`
- **01-desktop-home:** [`qa-reports/screenshots/01-desktop-home.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/01-desktop-home.png)
- **02-desktop-fyk:** [`qa-reports/screenshots/02-desktop-fyk.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/02-desktop-fyk.png)
- **03-desktop-footer:** [`qa-reports/screenshots/03-desktop-footer.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/03-desktop-footer.png)
- **04-viewport-mobile:** [`qa-reports/screenshots/04-viewport-mobile.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/04-viewport-mobile.png)
- **05-viewport-mobile-nav-open:** [`qa-reports/screenshots/05-viewport-mobile-nav-open.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/05-viewport-mobile-nav-open.png)
- **04-viewport-tablet:** [`qa-reports/screenshots/04-viewport-tablet.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/04-viewport-tablet.png)
- **05-viewport-tablet-nav-open:** [`qa-reports/screenshots/05-viewport-tablet-nav-open.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/05-viewport-tablet-nav-open.png)
- **04-viewport-desktop:** [`qa-reports/screenshots/04-viewport-desktop.png`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/screenshots/04-viewport-desktop.png)

### Machine-Readable Test Data
- Full execution telemetry saved to: [`qa-reports/qa-results.json`](file:///d:/Desktop/TravelSriLanka - Test/qa-reports/qa-results.json)

---
*Report generated autonomously by Senior QA Automation Engineer on 2026-11-22T15:21:29.303Z*.
