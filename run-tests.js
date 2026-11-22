// TravelSriLanka – QA Test Suite v3 (dev server, full coverage)
const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');
const http = require('http');

// Use DEV server — functions defined in main.js are accessible via onclick attrs
// on dev server they're module-scoped so onclick won't work unless window-exposed.
// We test the PROD build behaviour as the definitive truth (buggy) AND
// we do source analysis + direct UI tests via page.locator().click() + observe DOM.

const DEV_URL   = 'http://localhost:5174';   // vite dev (source)
const PROD_URL  = 'http://localhost:4173';   // vite preview (built)

const REPORTS_DIR = path.join(__dirname, '..', 'qa-reports');
const SCREENS_DIR = path.join(REPORTS_DIR, 'screenshots');
fs.mkdirSync(SCREENS_DIR, { recursive: true });

const R = { passed:0, failed:0, warned:0, tests:[], bugs:[] };
const consoleErrors = { dev:[], prod:[] };
const networkFails  = { dev:[], prod:[] };

function rec(id, name, expected, actual, status, notes='') {
  R.tests.push({id,name,expected,actual,status,notes});
  if(status==='PASS') R.passed++;
  else if(status==='FAIL') R.failed++;
  else R.warned++;
  const sym = status==='PASS'?'✅':status==='FAIL'?'❌':'⚠️';
  console.log(`${sym} [${id}] ${name}`);
  if(status!=='PASS'){ console.log(`   Expected : ${expected}`); console.log(`   Actual   : ${actual}`); }
  if(notes) console.log(`   Note     : ${notes}`);
}

function bug(id,title,severity,priority,module,steps,expected,actual,file) {
  R.bugs.push({id,title,severity,priority,module,steps,expected,actual,file});
  console.log(`\n🐛 BUG ${id} [${severity}/${priority}] ${title}\n`);
}

async function ss(page,name) {
  const fp=path.join(SCREENS_DIR,`${name}.png`);
  await page.screenshot({path:fp,fullPage:false});
  return fp;
}

async function httpStatus(url) {
  return new Promise(r=>http.get(url,res=>r(res.statusCode)).on('error',()=>r(0)));
}

// helper: attach event listeners
function attachListeners(page, errArr, failArr) {
  page.on('console', m => { if(m.type()==='error') errArr.push(m.text()); });
  page.on('pageerror', e => errArr.push(`PAGEERROR: ${e.message}`));
  page.on('response',  r => { if(!r.ok()&&r.status()!==0&&!r.url().startsWith('data:')) failArr.push({url:r.url(),status:r.status()}); });
  page.on('requestfailed', r => failArr.push({url:r.url(),status:'FAILED',reason:r.failure()?.errorText}));
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION A — BUILD OUTPUT VERIFICATION
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ A: Build Output Verification ═══');
  const distFiles = ['dist/index.html','dist/assets/index-D9DLZNxN.css','dist/assets/index-DArBFNmi.js'];
  for (const f of distFiles) {
    const exists = fs.existsSync(path.join(__dirname,'..', f));
    rec(`TC-BUILD-${f.split('/').pop()}`, `Build output: ${f} exists`, 'File present', exists?'Present ✓':'MISSING', exists?'PASS':'FAIL');
  }

  // Check openDestModal exposed in bundle
  const bundleJS = fs.readFileSync(path.join(__dirname,'..','dist','assets','index-DArBFNmi.js'),'utf8');
  const modalFnInBundle = bundleJS.includes('openDestModal') || bundleJS.includes('modal-overlay');
  rec('TC-BUILD-modal-fn', 'openDestModal() present in production bundle', 'Function bundled', modalFnInBundle?'modal-overlay found, function logic present':'MISSING from bundle', modalFnInBundle?'WARN':'FAIL',
    'openDestModal defined in main.js but NOT exposed to window — inline onclick attrs fail in production build');
  if (!bundleJS.includes('function openDestModal') && !bundleJS.includes('openDestModal=') && !bundleJS.includes('openDestModal:')) {
    bug('BUG-001','openDestModal() not exported to window scope — inline onclick attrs broken in production build','Critical','P0','Destination Modal',
      '1. Build with vite build\n2. Open dist/index.html in browser\n3. Click any "View Details" button\n4. Inspect console: openDestModal is not defined',
      'Modal opens correctly',
      'ReferenceError: openDestModal is not defined — modal never opens in production',
      'src/main.js:186 — function not assigned to window.openDestModal');
  }

  // Check closeModal and submitQuestion too
  const closeInBundle  = bundleJS.includes('closeModal') || bundleJS.includes('modal-overlay');
  const submitInBundle = bundleJS.includes('submitQuestion') || bundleJS.includes('qa-submit');
  rec('TC-BUILD-close-fn',  'closeModal exposed / present', 'In bundle', closeInBundle?'Yes (via inline logic)':'MISSING', closeInBundle?'WARN':'FAIL');
  rec('TC-BUILD-submit-fn', 'submitQuestion exposed / present', 'In bundle', submitInBundle?'Yes':'MISSING', submitInBundle?'WARN':'FAIL');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION B — DEV SERVER: PAGE LOAD
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ B: Dev Server — Page Load ═══');
  const devCtx  = await browser.newContext({ viewport:{width:1440,height:900} });
  const devPage = await devCtx.newPage();
  attachListeners(devPage, consoleErrors.dev, networkFails.dev);

  try {
    const res = await devPage.goto(DEV_URL, {waitUntil:'networkidle',timeout:20000});
    rec('TC-DEV-001', 'Dev server responds HTTP 200', 'HTTP 200', `HTTP ${res.status()}`, res.status()===200?'PASS':'FAIL');
  } catch(e) { rec('TC-DEV-001','Dev server HTTP 200','HTTP 200',`Error: ${e.message}`,'FAIL'); }

  const devTitle = await devPage.title();
  rec('TC-DEV-002', 'Page title correct', 'Lanka Compass', devTitle, devTitle.includes('Lanka Compass')?'PASS':'FAIL');
  await ss(devPage, '01-dev-homepage-desktop');

  const heroVis = await devPage.locator('.hero-img').isVisible();
  rec('TC-DEV-003', 'Hero image visible', 'Visible', heroVis?'Visible ✓':'NOT visible', heroVis?'PASS':'FAIL');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION C — PRODUCTION SERVER: PAGE LOAD
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ C: Prod Server — Page Load ═══');
  const prodCtx  = await browser.newContext({ viewport:{width:1440,height:900} });
  const prodPage = await prodCtx.newPage();
  attachListeners(prodPage, consoleErrors.prod, networkFails.prod);

  try {
    const res = await prodPage.goto(PROD_URL, {waitUntil:'networkidle',timeout:20000});
    rec('TC-PROD-001', 'Production server HTTP 200', 'HTTP 200', `HTTP ${res.status()}`, res.status()===200?'PASS':'FAIL');
  } catch(e) { rec('TC-PROD-001','Production HTTP 200','HTTP 200',`Error: ${e.message}`,'FAIL'); }

  await ss(prodPage, '02-prod-homepage-desktop');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION D — NAVIGATION (dev server)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ D: Navigation ═══');
  const navCount = await devPage.locator('.nav-link').count();
  rec('TC-NAV-001', 'Nav has 6 links', '6', `${navCount}`, navCount===6?'PASS':'FAIL');

  const navItems = [['#nav-dest','#destinations'],['#nav-routes','#routes'],['#nav-transport','#transport'],['#nav-fyk','#fyk'],['#nav-qa','#qa'],['#nav-scam','#scam-alert']];
  for(const [link,section] of navItems) {
    await devPage.locator(link).click();
    await devPage.waitForTimeout(500);
    const vis = await devPage.locator(section).isVisible();
    rec(`TC-NAV-${section.replace('#','')}`, `Nav ${link} → ${section}`, 'Visible', vis?'Visible ✓':'NOT visible', vis?'PASS':'FAIL');
  }
  await ss(devPage,'03-nav-active');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION E — DESTINATION FILTER (dev server)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ E: Destination Filter ═══');
  await devPage.locator('#destinations').scrollIntoViewIfNeeded();
  await devPage.waitForTimeout(300);

  const filters = [['all',6],['heritage',3],['beach',1],['nature',1],['wildlife',1]];
  for(const [f,expected] of filters) {
    await devPage.locator(`[data-filter="${f}"]`).click();
    await devPage.waitForTimeout(400);
    const count = await devPage.evaluate(()=>document.querySelectorAll('.dest-card:not(.hidden)').length);
    rec(`TC-FILTER-${f}`, `Filter "${f}": ${expected} card(s)`, `${expected}`, `${count}`, count===expected?'PASS':'FAIL');
  }
  await ss(devPage,'04-filter-wildlife');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION F — DESTINATION MODALS (dev server — onclick calls module fn)
  // We use page.locator().click() which triggers the onclick attr in the browser
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ F: Destination Modals (dev server) ═══');

  // Reset to ALL
  await devPage.locator('[data-filter="all"]').click();
  await devPage.waitForTimeout(500);

  const dests = ['sigiriya','ella','kandy','mirissa','galle','yala'];
  const brokenImages = [];

  for(const dest of dests) {
    // Click the button — this calls onclick="openDestModal(...)" in the browser
    await devPage.locator(`#btn-${dest}`).scrollIntoViewIfNeeded();
    await devPage.waitForTimeout(300);
    await devPage.locator(`#btn-${dest}`).click();
    await devPage.waitForTimeout(700);

    const isOpen = await devPage.evaluate(()=>document.getElementById('modal-overlay').classList.contains('open'));
    rec(`TC-MODAL-${dest}-open`, `Modal opens for ${dest}`, '.open on overlay', isOpen?'Open ✓':'NOT open', isOpen?'PASS':'FAIL');

    if(isOpen) {
      await ss(devPage, `modal-${dest}`);
      const contentLen = await devPage.evaluate(()=>document.getElementById('modal-content').innerText.length);
      rec(`TC-MODAL-${dest}-content`, `Modal content populated (${dest})`, '>50 chars', `${contentLen} chars`, contentLen>50?'PASS':'FAIL');

      if(dest!=='yala') {
        const imgData = await devPage.evaluate(()=>{
          const img=document.querySelector('#modal-content img');
          if(!img) return {src:null,loaded:false};
          return {src:img.src,loaded:img.complete&&img.naturalWidth>0};
        });
        rec(`TC-MODAL-${dest}-img`, `Modal image loads (${dest})`, 'naturalWidth>0', imgData.loaded?`OK src=${imgData.src}`:`BROKEN src=${imgData.src}`, imgData.loaded?'PASS':'FAIL');
        if(!imgData.loaded) brokenImages.push({dest,src:imgData.src});
      }

      // Close via X
      await devPage.locator('#modal-close-btn').click();
      await devPage.waitForTimeout(400);
      const closedX = !(await devPage.evaluate(()=>document.getElementById('modal-overlay').classList.contains('open')));
      rec(`TC-MODAL-${dest}-closeX`, `Modal closes via ✕ (${dest})`, 'No .open', closedX?'Closed ✓':'Still open', closedX?'PASS':'FAIL');
    } else {
      // Log as confirmed bug — modal never opens
      bug(`BUG-MODAL-${dest}`,`Modal does not open for "${dest}" (onclick not wired to window scope in production)`,'High','P1','Destination Modal',
        `1. Click "View Details" on ${dest} card\n2. Observe modal-overlay`,
        '#modal-overlay.open present','Not present','src/main.js:186 + index.html onclick attr');
    }
  }

  if(brokenImages.length>0) {
    bug('BUG-002',`Modal images fail to load — src path missing /images/ prefix (${brokenImages.length} affected)`,
      'High','P1','Destination Modal',
      '1. Click View Details\n2. Inspect modal img src\n3. Open URL in browser',
      'Image loads from /images/filename.png','404 — src is bare filename without /images/',
      'src/main.js:195 — `src: "${data.img}"` should be `/images/${data.img}`');
    for(const b of brokenImages) console.log(`   ⤷ ${b.dest}: src="${b.src}"`);
  }

  // Close via overlay background click
  await devPage.locator('#btn-sigiriya').click();
  await devPage.waitForTimeout(500);
  const modalOverlay = devPage.locator('#modal-overlay');
  await modalOverlay.click({position:{x:5,y:5}});
  await devPage.waitForTimeout(500);
  const closedOverlay = !(await devPage.evaluate(()=>document.getElementById('modal-overlay').classList.contains('open')));
  rec('TC-MODAL-overlay-close','Modal closes clicking overlay background','No .open',closedOverlay?'Closed ✓':'Still open',closedOverlay?'PASS':'FAIL');

  // ESC close
  await devPage.locator('#btn-sigiriya').click();
  await devPage.waitForTimeout(500);
  await devPage.keyboard.press('Escape');
  await devPage.waitForTimeout(400);
  const closedEsc = !(await devPage.evaluate(()=>document.getElementById('modal-overlay').classList.contains('open')));
  rec('TC-MODAL-esc-close','Modal closes via Escape key','No .open',closedEsc?'Closed ✓':'Still open',closedEsc?'PASS':'FAIL');

  // Now test PROD build modal (expects to fail — confirms BUG-001)
  console.log('\n  [Production modal verification]');
  await prodPage.evaluate(()=>window.scrollTo(0,500));
  await prodPage.waitForTimeout(300);
  await prodPage.locator('#btn-sigiriya').scrollIntoViewIfNeeded();
  await prodPage.waitForTimeout(300);
  await prodPage.locator('#btn-sigiriya').click();
  await prodPage.waitForTimeout(700);
  const prodModalOpen = await prodPage.evaluate(()=>document.getElementById('modal-overlay').classList.contains('open'));
  rec('TC-PROD-modal','[PROD BUILD] Modal opens on "View Details" click','Modal opens','Prod modal: '+(prodModalOpen?'OPEN':'NOT OPEN — BUG-001 confirmed'),prodModalOpen?'PASS':'FAIL',
    'Production build tree-shakes openDestModal — inline onclick has no target');
  await ss(prodPage,'05-prod-modal-failure');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION G — FYK TABS (dev server)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ G: FYK Tabs ═══');
  await devPage.locator('#fyk').scrollIntoViewIfNeeded();
  await devPage.waitForTimeout(300);
  for(const tab of ['mobile','wifi','food','toilets','dress','emergency']) {
    await devPage.locator(`#fyk-tab-${tab}`).click();
    await devPage.waitForTimeout(300);
    const active = await devPage.evaluate(t=>document.getElementById(`fyk-panel-${t}`)?.classList.contains('active'),tab);
    rec(`TC-FYK-${tab}`, `FYK tab "${tab}" shows panel`, 'Panel .active', active?'Active ✓':'NOT active', active?'PASS':'FAIL');
  }
  await ss(devPage,'06-fyk-mobile-tab');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION H — Q&A (dev server)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ H: Q&A Section ═══');
  await devPage.locator('#qa').scrollIntoViewIfNeeded();
  await devPage.waitForTimeout(300);

  // Empty submit
  await devPage.locator('#qa-submit-btn').click();
  await devPage.waitForTimeout(500);
  const emptyBorder = await devPage.locator('#qa-question-input').evaluate(el=>el.style.borderColor);
  rec('TC-QA-001','Empty question blocked (visual error)','borderColor set',emptyBorder||'(none)',emptyBorder!==''?'PASS':'FAIL');

  // Whitespace only
  await devPage.locator('#qa-question-input').fill('   \t  ');
  await devPage.locator('#qa-submit-btn').click();
  await devPage.waitForTimeout(500);
  const wsBorder = await devPage.locator('#qa-question-input').evaluate(el=>el.style.borderColor);
  rec('TC-QA-002','Whitespace input blocked','borderColor set',wsBorder||'(none)',wsBorder!==''?'PASS':'FAIL');

  // Valid submit
  await devPage.locator('#qa-name-input').fill('QA Tester Bot');
  await devPage.locator('#qa-category-select').selectOption('transport');
  await devPage.locator('#qa-question-input').fill('What is the best train from Colombo to Kandy?');
  await devPage.locator('#qa-submit-btn').click();
  await devPage.waitForTimeout(1000);

  const qaItems = await devPage.locator('#qa-dynamic-list .qa-item').count();
  rec('TC-QA-003','Valid question appears in list','≥1 item',`${qaItems} item(s)`,qaItems>=1?'PASS':'FAIL');

  const qText = qaItems>0 ? await devPage.locator('#qa-dynamic-list .qa-item strong').first().innerText() : '';
  rec('TC-QA-004','Question text rendered correctly','Contains "Colombo"',qText,qText.includes('Colombo')?'PASS':'FAIL');

  const nameClr = await devPage.locator('#qa-name-input').inputValue();
  const qClr    = await devPage.locator('#qa-question-input').inputValue();
  rec('TC-QA-005','Form cleared after submit','Both empty',`name="${nameClr}" q="${qClr}"`,nameClr===''&&qClr===''?'PASS':'FAIL');

  // Persistence check
  const beforeReload = await devPage.locator('#qa-dynamic-list .qa-item').count();
  await devPage.reload({waitUntil:'networkidle'});
  await devPage.waitForTimeout(500);
  const afterReload = await devPage.locator('#qa-dynamic-list .qa-item').count();
  rec('TC-QA-006','Q&A persists after reload',`${beforeReload} items`,`${afterReload} after reload`,afterReload>=beforeReload&&beforeReload>0?'PASS':'FAIL','No backend — in-memory only');
  if(afterReload<beforeReload) bug('BUG-003','Q&A submissions lost on page refresh — no backend persistence','High','P1','Q&A',
    '1. Submit question\n2. Reload page\n3. Check #qa-dynamic-list','Question visible','All questions gone',
    'src/main.js:252 — data stored in DOM only, no fetch/localStorage');

  // Long question (500 chars)
  await devPage.locator('#qa').scrollIntoViewIfNeeded();
  await devPage.locator('#qa-question-input').fill('B'.repeat(500));
  await devPage.locator('#qa-submit-btn').click();
  await devPage.waitForTimeout(600);
  const longAdded = await devPage.locator('#qa-dynamic-list .qa-item').count()>0;
  rec('TC-QA-007','500-char question: no maxlength enforcement','Accepted or rejected gracefully',longAdded?'Accepted (no limit)':'Blocked','WARN','textarea has no maxlength — recommend 2000 char limit');

  // XSS — script execution test
  await devPage.locator('#qa-question-input').fill('<script>window.__xss=99</script>safe text');
  await devPage.locator('#qa-submit-btn').click();
  await devPage.waitForTimeout(600);
  const xssRan = await devPage.evaluate(()=>window.__xss===99);
  rec('TC-QA-008','XSS: <script> tag NOT executed','window.__xss undefined',xssRan?'🚨 SCRIPT EXECUTED':'Not executed ✓',xssRan?'FAIL':'PASS');
  if(xssRan) bug('BUG-SEC-001','Critical XSS — script executes via Q&A input','Critical','P0','Q&A Security',
    '1. Enter: <script>window.__xss=99</script>\n2. Submit\n3. window.__xss === 99','Not executed','Executed — XSS',
    'src/main.js:276-294');

  // HTML injection check
  const latestItemHTML = await devPage.locator('#qa-dynamic-list .qa-item').first().evaluate(el=>el.innerHTML);
  const hasRawScript = latestItemHTML.includes('<script>');
  rec('TC-QA-009','HTML injection: <script> tag escaped in output','&lt;script&gt; (escaped)',hasRawScript?'Raw <script> in DOM':'Escaped ✓',hasRawScript?'FAIL':'PASS');

  await ss(devPage,'07-qa-section');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION I — SCROLL TO TOP
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ I: Scroll-to-top ═══');
  await devPage.evaluate(()=>window.scrollTo(0,3000));
  await devPage.waitForTimeout(600);
  const scrollBtnVis = await devPage.evaluate(()=>document.getElementById('scroll-top-btn').classList.contains('visible'));
  rec('TC-SCROLL-001','Scroll-to-top appears after scroll down','.visible class added',scrollBtnVis?'Visible ✓':'NOT visible',scrollBtnVis?'PASS':'FAIL');
  if(scrollBtnVis) {
    await devPage.locator('#scroll-top-btn').click();
    await devPage.waitForTimeout(900);
    const sy = await devPage.evaluate(()=>window.scrollY);
    rec('TC-SCROLL-002','Scroll-to-top scrolls to top','scrollY<100',`scrollY=${sy}`,sy<100?'PASS':'FAIL');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION J — SCAM / ROUTES / TRANSPORT / FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ J: Content Sections ═══');
  await devPage.locator('#scam-alert').scrollIntoViewIfNeeded();
  const scamCount = await devPage.locator('.scam-card').count();
  rec('TC-SCAM-001','Scam section: 6 cards','6',`${scamCount}`,scamCount===6?'PASS':'FAIL');
  await ss(devPage,'08-scam-section');

  await devPage.locator('#routes').scrollIntoViewIfNeeded();
  const routeCount = await devPage.locator('.route-card').count();
  rec('TC-ROUTES-001','Routes: 4 cards','4',`${routeCount}`,routeCount===4?'PASS':'FAIL');

  await devPage.locator('#transport').scrollIntoViewIfNeeded();
  const transCount = await devPage.locator('.transport-card').count();
  rec('TC-TRANS-001','Transport: 6 cards','6',`${transCount}`,transCount===6?'PASS':'FAIL');

  await devPage.locator('.footer').scrollIntoViewIfNeeded();
  const footLinks = await devPage.locator('.footer-links a').count();
  rec('TC-FOOTER-001','Footer: ≥6 links','≥6',`${footLinks}`,footLinks>=6?'PASS':'FAIL');
  await ss(devPage,'09-footer');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION K — CONSOLE ERRORS & NETWORK (both servers)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ K: Console Errors & Network ═══');
  rec('TC-CONSOLE-dev','Dev: 0 JS console errors','0',`${consoleErrors.dev.length} error(s)`,consoleErrors.dev.length===0?'PASS':'FAIL',consoleErrors.dev.join(' | '));
  rec('TC-CONSOLE-prod','Prod: 0 JS console errors','0',`${consoleErrors.prod.length} error(s)`,consoleErrors.prod.length===0?'PASS':'FAIL',consoleErrors.prod.join(' | '));
  rec('TC-NETWORK-dev','Dev: 0 failed requests','0',`${networkFails.dev.length}`,networkFails.dev.length===0?'PASS':'FAIL',networkFails.dev.map(f=>`${f.status} ${f.url}`).join(' | '));
  rec('TC-NETWORK-prod','Prod: 0 failed requests','0',`${networkFails.prod.length}`,networkFails.prod.length===0?'PASS':'FAIL',networkFails.prod.map(f=>`${f.status} ${f.url}`).join(' | '));

  if(consoleErrors.prod.length>0) bug('BUG-004','JS console errors in production build','High','P1','JavaScript',
    '1. Open prod build\n2. Open DevTools console\n3. Load page','0 errors',
    consoleErrors.prod.slice(0,3).join('\n'),'src/main.js / dist build');
  if(networkFails.prod.length>0) bug('BUG-005',`${networkFails.prod.length} failed network request(s) in prod build`,'Medium','P2','Network',
    '1. Load prod build\n2. Check Network tab','All 200',networkFails.prod.map(f=>`${f.status} ${f.url}`).join('\n'),'index.html');

  await devCtx.close();
  await prodCtx.close();

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION L — STATIC RESOURCE HTTP CHECK
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ L: Static Resources ═══');
  const images = [
    '/images/sri_lanka_hero_1784522884680.png',
    '/images/ella_train_1784522895792.png',
    '/images/sigiriya_rock_1784522913894.png',
    '/images/kandy_temple_1784522927450.png',
    '/images/mirissa_beach_1784522947085.png',
    '/images/galle_fort_1784522959122.png',
  ];
  for(const img of images) {
    const devCode  = await httpStatus(`${DEV_URL}${img}`);
    const prodCode = await httpStatus(`${PROD_URL}${img}`);
    const name = img.split('/').pop().replace('_'+img.split('_').slice(-1)[0],'').replace(/^images\//,'');
    rec(`TC-IMG-dev-${img.split('/')[2]}`, `DEV image: ${img.split('/').pop()}`, 'HTTP 200', `HTTP ${devCode}`, devCode===200?'PASS':'FAIL');
    rec(`TC-IMG-prod-${img.split('/')[2]}`, `PROD image: ${img.split('/').pop()}`, 'HTTP 200', `HTTP ${prodCode}`, prodCode===200?'PASS':'FAIL');
    if(devCode!==200||prodCode!==200) bug('BUG-IMG','Static image missing',`High`,'P1','Static Assets',`GET ${img}`,'200',`dev=${devCode} prod=${prodCode}`,'public/images/');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION M — RESPONSIVE TESTING (3 viewports)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ M: Responsive Testing ═══');
  const viewports = [{name:'mobile',w:375,h:812},{name:'tablet',w:768,h:1024},{name:'desktop',w:1440,h:900}];

  for(const vp of viewports) {
    console.log(`\n  [${vp.name} ${vp.w}×${vp.h}]`);
    const vpCtx  = await browser.newContext({viewport:{width:vp.w,height:vp.h}});
    const vpPage = await vpCtx.newPage();
    const vpErrs = [];
    vpPage.on('console', m=>{if(m.type()==='error') vpErrs.push(m.text());});
    await vpPage.goto(DEV_URL,{waitUntil:'networkidle'});
    await ss(vpPage,`vp-${vp.name}-homepage`);

    // Horizontal overflow
    const overflow = await vpPage.evaluate(()=>document.body.scrollWidth>window.innerWidth);
    const scrollW  = await vpPage.evaluate(()=>document.body.scrollWidth);
    rec(`TC-VP-${vp.name}-overflow`,`[${vp.name}] No horizontal overflow`,'No overflow',overflow?`scrollWidth=${scrollW} > ${vp.w}`:'No overflow ✓',overflow?'FAIL':'PASS');
    if(overflow) bug(`BUG-RES-${vp.name}`,`Horizontal overflow at ${vp.name} viewport (${vp.w}px)`,'Medium','P2','Responsive',`1. Open at ${vp.w}px\n2. Measure scrollWidth`,'No scroll',`scrollWidth=${scrollW}`,'src/style.css');

    // Hamburger menu at ≤768
    if(vp.w<=768) {
      const hamVis = await vpPage.locator('#hamburger').isVisible();
      rec(`TC-VP-${vp.name}-ham`,`[${vp.name}] Hamburger visible`,'Visible',hamVis?'Visible ✓':'NOT visible',hamVis?'PASS':'FAIL');
      if(hamVis) {
        await vpPage.locator('#hamburger').click();
        await vpPage.waitForTimeout(400);
        const navOpen = await vpPage.evaluate(()=>document.getElementById('nav-links').classList.contains('open'));
        rec(`TC-VP-${vp.name}-nav-open`,`[${vp.name}] Hamburger opens nav`,'.open added',navOpen?'Open ✓':'Not open',navOpen?'PASS':'FAIL');
        await ss(vpPage,`vp-${vp.name}-nav-open`);
        await vpPage.locator('.nav-link').first().click();
        await vpPage.waitForTimeout(400);
        const navClosed = !(await vpPage.evaluate(()=>document.getElementById('nav-links').classList.contains('open')));
        rec(`TC-VP-${vp.name}-nav-close`,`[${vp.name}] Nav closes on link click`,'.open removed',navClosed?'Closed ✓':'Still open',navClosed?'PASS':'FAIL');
      }
    } else {
      const desktopNavVis = await vpPage.locator('#nav-links').isVisible();
      rec(`TC-VP-${vp.name}-nav-vis`,`[${vp.name}] Nav links always visible at desktop`,'Visible',desktopNavVis?'Visible ✓':'Hidden',desktopNavVis?'PASS':'FAIL');
    }

    // Destinations visible
    await vpPage.locator('#destinations').scrollIntoViewIfNeeded();
    const dvis = await vpPage.locator('#destinations').isVisible();
    rec(`TC-VP-${vp.name}-dest`,`[${vp.name}] Destinations section visible`,'Visible',dvis?'Visible ✓':'Hidden',dvis?'PASS':'FAIL');

    // Modal responsive
    await vpPage.locator('[data-filter="all"]').click();
    await vpPage.waitForTimeout(400);
    await vpPage.locator('#btn-sigiriya').scrollIntoViewIfNeeded();
    await vpPage.waitForTimeout(300);
    await vpPage.locator('#btn-sigiriya').click();
    await vpPage.waitForTimeout(700);
    const mOpen = await vpPage.evaluate(()=>document.getElementById('modal-overlay').classList.contains('open'));
    rec(`TC-VP-${vp.name}-modal`,`[${vp.name}] Modal opens`,'Open',mOpen?'Open ✓':'NOT open',mOpen?'PASS':'FAIL');
    if(mOpen) {
      const mb = await vpPage.locator('#modal-box').boundingBox();
      rec(`TC-VP-${vp.name}-modal-fit`,`[${vp.name}] Modal fits viewport`,`≤${vp.w}px`,mb?`${mb.width.toFixed(0)}px`:'unmeasured',mb&&mb.width<=vp.w?'PASS':'FAIL');
      await ss(vpPage,`vp-${vp.name}-modal`);
      await vpPage.locator('#modal-close-btn').click();
      await vpPage.waitForTimeout(300);
    }

    rec(`TC-VP-${vp.name}-console`,`[${vp.name}] No console errors`,'0',`${vpErrs.length}`,vpErrs.length===0?'PASS':'FAIL',vpErrs.join(' | '));
    await vpCtx.close();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION N — SECURITY ANALYSIS (source code)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ N: Security Analysis ═══');
  const mainJS    = fs.readFileSync(path.join(__dirname,'..','src','main.js'),'utf8');
  const indexHTML = fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

  const innerHTMLCount = (mainJS.match(/\.innerHTML\s*=/g)||[]).length;
  rec('TC-SEC-001',`innerHTML= count in main.js (${innerHTMLCount})`,`≤3 (expected)`,`${innerHTMLCount}`,innerHTMLCount<=3?'WARN':'FAIL',
    'innerHTML used for modal content and Q&A items — passes through escapeHtml()');

  const escapesAmp   = mainJS.includes("replace(/&/");
  const escapesLT    = mainJS.includes("replace(/</");
  const escapesGT    = mainJS.includes("replace(/>/");
  const escapesQuote = mainJS.includes('replace(/"');
  const escapesSingle= mainJS.includes("replace(/'/") || mainJS.includes("'\\''");
  rec('TC-SEC-002','escapeHtml sanitizes &, <, >, "',escapesAmp&&escapesLT&&escapesGT&&escapesQuote?'All 4 ✓':'Missing',
    `& ${escapesAmp?'✓':'✗'} < ${escapesLT?'✓':'✗'} > ${escapesGT?'✓':'✗'} " ${escapesQuote?'✓':'✗'}`,
    escapesAmp&&escapesLT&&escapesGT&&escapesQuote?'PASS':'FAIL');
  rec('TC-SEC-003',"escapeHtml escapes single quotes","Yes",(escapesSingle?'Yes ✓':"No — gap"),escapesSingle?'PASS':'FAIL');
  if(!escapesSingle) bug('BUG-006',"escapeHtml() missing single-quote escape — potential attribute injection",'Medium','P2','Q&A Security',
    "1. Submit: ' onerror='alert(1)\n2. Inspect output HTML","&#39; in output","Raw ' in HTML output","src/main.js:317-319");

  const hasSecret = /(?:api[_-]?key|password|secret)\s*[:=]\s*['"][^'"]{5,}/i.test(mainJS+indexHTML);
  rec('TC-SEC-004','No hardcoded secrets in source','None',hasSecret?'⚠️ Possible secret found':'None ✓',hasSecret?'WARN':'PASS');

  // Check target=_blank safety
  const blankLinks = (indexHTML.match(/target="_blank"/g)||[]).length;
  const noopenerLinks = (indexHTML.match(/rel="[^"]*noopener[^"]*"/g)||[]).length;
  rec('TC-SEC-005','target=_blank links have noopener',`${blankLinks} blank → all with noopener`,`${blankLinks} blank, ${noopenerLinks} with noopener`,blankLinks===0||noopenerLinks>=blankLinks?'PASS':'WARN');

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION O — ACCESSIBILITY
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n═══ O: Accessibility ═══');
  const a11yCtx  = await browser.newContext({viewport:{width:1440,height:900}});
  const a11yPage = await a11yCtx.newPage();
  await a11yPage.goto(DEV_URL,{waitUntil:'networkidle'});

  const noAlt = await a11yPage.evaluate(()=>
    Array.from(document.querySelectorAll('img')).filter(i=>!i.alt||!i.alt.trim()).map(i=>i.src.split('/').pop())
  );
  rec('TC-A11Y-001','All images have alt text','0 missing',`${noAlt.length} missing`,noAlt.length===0?'PASS':'FAIL',noAlt.join(', '));

  const hasLang = await a11yPage.evaluate(()=>!!document.documentElement.getAttribute('lang'));
  rec('TC-A11Y-002','<html lang="en"> present','lang="en"',hasLang?'lang set ✓':'lang MISSING',hasLang?'PASS':'FAIL');
  if(!hasLang) bug('BUG-007','HTML element missing lang attribute','Low','P3','Accessibility','1. Inspect <html>','lang="en"','No lang attr','index.html:2');

  const modalARIA = await a11yPage.evaluate(()=>{
    const o=document.getElementById('modal-overlay');
    return {role:o?.getAttribute('role'),ariaModal:o?.getAttribute('aria-modal')};
  });
  const hasModalARIA = !!(modalARIA.role||modalARIA.ariaModal);
  rec('TC-A11Y-003','Modal has ARIA role','role="dialog"',JSON.stringify(modalARIA),hasModalARIA?'PASS':'FAIL');
  if(!hasModalARIA) bug('BUG-008','Modal missing ARIA role/aria-modal attribute','Low','P3','Accessibility',
    '1. Inspect #modal-overlay','role="dialog" aria-modal="true"','No ARIA attrs','index.html:1074');

  const noBtnLabel = await a11yPage.evaluate(()=>
    Array.from(document.querySelectorAll('button')).filter(b=>!b.textContent.trim()&&!b.getAttribute('aria-label')).map(b=>b.id||b.className)
  );
  rec('TC-A11Y-004','All buttons have label or aria-label','0 unlabelled',`${noBtnLabel.length}`,noBtnLabel.length===0?'PASS':'WARN',noBtnLabel.join(', '));

  await a11yCtx.close();

  // ══════════════════════════════════════════════════════════════════════════
  // SAVE JSON
  // ══════════════════════════════════════════════════════════════════════════
  const summary = {
    executedAt: new Date().toISOString(),
    total:   R.passed+R.failed+R.warned,
    passed:  R.passed,
    failed:  R.failed,
    warned:  R.warned,
    bugsFound: R.bugs.length,
    consoleErrors, networkFails,
    tests: R.tests,
    bugs:  R.bugs,
  };
  fs.writeFileSync(path.join(REPORTS_DIR,'qa-results.json'), JSON.stringify(summary,null,2));

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📊 FINAL: ${R.passed} PASSED | ${R.failed} FAILED | ${R.warned} WARNED | ${R.bugs.length} BUGS FILED`);
  console.log(`💾 Saved: qa-reports/qa-results.json`);
  console.log(`📸 Screenshots in: qa-reports/screenshots/`);

  await browser.close();
})();
