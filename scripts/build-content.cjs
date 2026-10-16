// Publish readable HTML using the same rate data and date rules as the calculator.
// Run after reviewing source data; do not advance review dates without checking sources.
const fs = require('node:fs');
const path = require('node:path');
const { VA, calculate, paymentDate } = require('../dist/app.js');
const dist = path.join(__dirname, '../dist');
const origin = 'https://veteranpayguide.com';
const reviewed = '2026-10-16';
const reviewLabel = 'October 16, 2026';
const ratesSource = 'https://www.va.gov/disability/compensation-rates/veteran-rates/';
const colaSource = 'https://www.ssa.gov/news/en/advocates/2026-10-14.html';
const paymentSource = 'https://www.va.gov/va-payment-history/';
const holidaysSource = 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/';
const issues = 'https://github.com/yczhaoask/webpage/issues';
const dollars = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const date = d => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(d);
const month = (y, m) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m, 1)));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const decode = s => s.replace(/&(amp|quot|apos|lt|gt);|&#39;/g, entity => ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&#39;': "'" })[entity]);
function socialHead(head, title, description, url) {
  // Remove inherited cards before adding page-specific values. Rebuilding is safe.
  const clean = head.replace(/<meta\b[^>]*(?:property|name)=["'](?:og:|twitter:)[^"']*["'][^>]*>\s*/gi, '').trimEnd();
  const image = `${origin}/social-preview.png`;
  const imageAlt = 'Veteran Pay Guide: disability pay calculator, rate estimates and payment dates. Independent educational resource.';
  const tags = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Veteran Pay Guide'],
    ['property', 'og:locale', 'en_US'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
    ['property', 'og:image:type', 'image/png'],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', imageAlt],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', imageAlt],
  ];
  return clean + '\n' + tags.map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${esc(value)}">`).join('\n') + '\n';
}
const external = (url, label) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
const review = `<p class="review-line">Source review: <time datetime="${reviewed}">${reviewLabel}</time> · <a href="/about/#editorial-policy">How we review content</a></p>`;
const footerLinks = `<nav class="footer-links" aria-label="Website information"><a href="/2027-va-disability-rates/">2027 rates</a><a href="/va-disability-payment-dates/">Payment dates</a><a href="/veteran-benefits/">Other benefits</a><a href="/about/">About &amp; sources</a><a href="/privacy/">Privacy</a><a href="${issues}" target="_blank" rel="noopener noreferrer">Report an issue ↗</a></nav>`;

function ratesTable() {
  const rows = Object.keys(VA).map(value => {
    const rating = Number(value), r = calculate({ rating });
    return `<tr><th scope="row">${rating}%</th><td>${dollars(r.base)}</td><td>${dollars(r.monthly)}</td><td>+${dollars(r.increase)}</td></tr>`;
  }).join('\n');
  return `<div class="table-scroll rate-table-scroll" tabindex="0" role="region" aria-label="Disability compensation amounts"><table class="rate-table"><caption>Monthly amounts for a Veteran with no dependents. 2027 amounts are estimates.</caption><thead><tr><th scope="col">Rating</th><th scope="col">2026 official</th><th scope="col">2027 estimated</th><th scope="col">Monthly increase</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

const schedule = Array.from({ length: 13 }, (_, i) => {
  const y = i ? 2027 : 2026, m = i ? i - 1 : 11;
  const d = paymentDate(y, m), nominal = new Date(Date.UTC(y, m + 1, 1));
  return { y, m, d, adjusted: d.getTime() !== nominal.getTime() };
});
const calendarRows = schedule.map(s => `<tr><th scope="row">${month(s.y, s.m)}</th><td><time datetime="${s.d.toISOString().slice(0, 10)}">${date(s.d)}</time></td><td>${s.adjusted ? 'Earlier: weekend or holiday' : 'Standard date'}</td></tr>`).join('\n');
function calendarTable() {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Expected VA payment dates"><table><caption>Calculated dates, not a VA-published calendar or a deposit guarantee.</caption><thead><tr><th scope="col">Benefit month covered</th><th scope="col">Expected payment date</th><th scope="col">Timing</th></tr></thead><tbody>${calendarRows}</tbody></table></div>`;
}

const guides = `<div class="guide-links"><a href="/2027-va-disability-rates/"><span class="guide-label">AMOUNTS &amp; INCREASE</span><strong>2027 VA disability rates</strong><span>Compare 2026 rates with clearly labeled 2027 estimates. →</span></a><a href="/va-disability-payment-dates/"><span class="guide-label">PLAN YOUR PAYMENT</span><strong>VA payment dates</strong><span>See the calendar and understand early payment dates. →</span></a><a href="/veteran-benefits/"><span class="guide-label">EXPLORE YOUR OPTIONS</span><strong>Other Veteran benefits</strong><span>Check which programs to explore and where to apply. →</span></a></div>`;
let home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
function block(name, content) {
  home = home.replace(new RegExp(`<!-- ${name}_START -->[\\s\\S]*?<!-- ${name}_END -->`), `<!-- ${name}_START -->${content}<!-- ${name}_END -->`);
}
block('SEO_RATE_OVERVIEW', `<section class="wrap rate-overview" id="rate-overview"><details class="rate-disclosure"><summary><span><strong>2026 &amp; 2027 amounts at a glance</strong><small>No dependents · 2027 amounts estimated</small></span><span class="disclosure-mark" aria-hidden="true">+</span></summary><div class="rate-details">${ratesTable()}<p class="small-note">Estimates use the 2026 regular compensation amount × 1.036, rounded to cents. Dependent additions begin at a 30% rating. ${external(ratesSource, 'Official 2026 VA table')}.</p><a href="/2027-va-disability-rates/">Read the increase and calculation guide →</a></div></details></section>`);
block('SEO_GUIDE_LINKS', `<section class="wrap guide-section" aria-labelledby="guides-title"><div class="section-kicker">READ THE DETAILS</div><h2 id="guides-title">A little more clarity.</h2>${guides}</section>`);
block('SEO_FOOTER', footerLinks);
home = home.replace(/<tbody id="schedule-body">[\s\S]*?<\/tbody>/, `<tbody id="schedule-body">${calendarRows}</tbody>`);
home = home.replace(/<strong id="next-date">.*?<\/strong>/, `<strong id="next-date">${date(paymentDate(2026, 9))}</strong>`);
home = home.replace(/<p id="next-description">.*?<\/p>/, '<p id="next-description">Covers October 2026 · Calculated schedule as of October 16, 2026; the date refreshes in your browser.</p>');
// Initial controls work without waiting for JS; JS binds behavior and reuses them.
home = home.replace(/<div class="rating-buttons" role="group" aria-labelledby="rating-label">[\s\S]*?<\/div>/, `<div class="rating-buttons" role="group" aria-labelledby="rating-label">${Object.keys(VA).map(n => `<button type="button" aria-pressed="${n === '70'}">${n}%</button>`).join('')}</div>`);
home = home.replace(/<div class="payment-details">(?:<p class="small-note"><a href="\/va-disability-payment-dates\/">Full payment date guide →<\/a><\/p>)?/,  '<div class="payment-details"><p class="small-note"><a href="/va-disability-payment-dates/">Full payment date guide →</a></p>');
home = home.replace(/<div class="support-banner-copy"><h2>/, '<div class="support-banner-copy"><h2>');
home = home.replace(/<p class="support-source-note">[\s\S]*?<\/p>/, '<p class="support-source-note">Official VA and SSA sources · Reviewed October 15, 2026 · <a href="/veteran-benefits/">Read the full benefits guide →</a></p>');
home = home.replace(/<head>([\s\S]*?)<\/head>/, (_, head) => {
  const title = decode(head.match(/<title>([\s\S]*?)<\/title>/)[1]);
  const description = decode(head.match(/<meta name="description" content="([^"]*)"/)[1]);
  return `<head>${socialHead(head, title, description, `${origin}/`)}</head>`;
});
fs.writeFileSync(path.join(dist, 'index.html'), home);

const head = home.match(/<head>([\s\S]*?)<\/head>/)[1];
const brand = home.match(/<a class="brand"[\s\S]*?<\/a>/)[0].replace('href="/"', 'href="/"');
const pages = [];
function page(slug, title, description, h1, intro, body) {
  const url = `${origin}/${slug}/`;
  const pageHead = socialHead(head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)} | Veteran Pay Guide</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}">`), `${title} | Veteran Pay Guide`, description, url);
  const html = `<!doctype html><html lang="en"><head>${pageHead}</head><body><a class="skip" href="#main">Skip to content</a><div class="independent"><div class="wrap">An independent guide for Veterans and their families. <span>Not affiliated with the U.S. Department of Veterans Affairs.</span></div></div><header><div class="wrap nav">${brand}<nav aria-label="Main navigation"><a href="/#calculator">Pay calculator</a><a href="/2027-va-disability-rates/">2027 rates</a><a href="/va-disability-payment-dates/">Payment dates</a><a href="/veteran-benefits/">Other benefits</a></nav></div></header><main id="main" class="wrap guide-page"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>${esc(h1.replaceAll('&amp;', '&'))}</span></nav><article><div class="guide-hero"><div class="eyebrow">VETERAN PAY GUIDE</div><h1>${h1}</h1><p class="guide-intro">${intro}</p>${review}</div>${body}</article><aside class="guide-related" aria-label="Related guides"><h2>Keep exploring.</h2>${guides}</aside></main><footer><div class="wrap footer-top"><a class="brand" href="/">Veteran Pay Guide<span class="footer-dot">.</span></a><a href="/#calculator">Go to calculator →</a></div><div class="wrap footer-bottom"><p>Independent educational resource. Not affiliated with or endorsed by VA, SSA, or the U.S. government. Confirm your individual award with VA.</p>${footerLinks}<span>© 2026 Veteran Pay Guide</span></div></footer></body></html>`;
  fs.mkdirSync(path.join(dist, slug), { recursive: true });
  fs.writeFileSync(path.join(dist, slug, 'index.html'), html);
  pages.push(url);
}

const estimateNote = `<div class="guide-callout"><strong>Confirmed percentage. Estimated dollar amounts.</strong><p>SSA announced a 3.6% COLA for 2027. The VA rate table checked for this guide still lists 2026 amounts, so all 2027 dollar amounts on this website remain estimates. ${external(colaSource, 'Read the SSA announcement')}.</p></div>`;
page('2027-va-disability-rates', '2027 VA Disability Rates & Increase Estimates', 'Compare official 2026 VA disability amounts with estimated 2027 payments at each rating. See the COLA, calculation method, and dependent rules.', '2027 VA disability rates &amp; increase', 'See what the announced COLA could mean for your regular monthly payment, with estimates clearly separated from official VA amounts.', `${estimateNote}
<section class="guide-block"><h2>How much is the 2027 increase?</h2><p>The announced cost-of-living adjustment is 3.6%. VA explains that its compensation COLA matches Social Security’s percentage. This changes payment amounts; it does not change your disability rating. ${external(ratesSource, 'Check VA’s explanation and rate table')}.</p><p>The comparison below uses regular compensation for a Veteran with no dependents. A household with eligible dependents may have a different base amount.</p>${ratesTable()}</section>
<section class="guide-block"><h2>How we calculate an estimate</h2><ol><li>Find the 2026 amount for your rating and eligible household in the official VA table.</li><li>Multiply that monthly amount by 1.036 and round to the nearest cent.</li><li>Subtract the 2026 amount to estimate the monthly increase. Multiply that rounded difference by 12 for an annual comparison.</li></ol><p>For example, a 70% rating with no dependents uses ${dollars(VA[70].base)} as its 2026 base. The projected monthly amount is ${dollars(calculate({rating:70}).monthly)}, an estimated ${dollars(calculate({rating:70}).increase)} more each month.</p><p>Final VA amounts may differ because of official rounding or other changes. This tool excludes SMC, Individual Unemployability, offsets, withholding, and individual award adjustments.</p><a class="guide-cta" href="/#calculator">Calculate with your household details →</a></section>
<section class="guide-block"><h2>Do dependents change the amount?</h2><p>At 10% or 20%, VA does not add dependent allowances. From 30%, qualifying spouses, children, and parents can affect regular compensation. Being related to you does not automatically establish eligibility. Use the VA table and your award details to check the correct household category.</p><p>Enter qualifying students separately from children under 18, and use the spouse Aid and Attendance option only if it applies to your award.</p></section>
<section class="guide-block"><h2>When would the higher payment arrive?</h2><p>Under the annual COLA timing described by VA, new annual rates take effect December 1. Our calculated first payment for the December 2026 benefit month is December 31, 2026, because January 1 is a federal holiday. This is an expected date, not confirmation of your deposit.</p><p><a href="/va-disability-payment-dates/">See the calendar and timing sources →</a></p></section>
<section class="guide-block"><h2>Confirm your personal payment</h2><p>Use your VA decision or award information and ${external(paymentSource, 'VA payment history')} to confirm what you receive. This website does not access your VA account or make eligibility decisions.</p></section>`);

page('va-disability-payment-dates', 'VA Disability Payment Dates: 2027 Calendar', 'See expected VA disability payment dates for 2027, which benefit month each payment covers, and how weekends and federal holidays affect timing.', 'VA disability payment dates', 'Match each expected payment with the benefit month it covers. Dates below are calculated, and your bank’s availability may differ.', `
<div class="guide-callout"><strong>Payment month and benefit month are different.</strong><p>Regular compensation is paid after the month it covers. A payment expected in early February covers January. These dates describe recurring payments, not the timing of a first award or back pay.</p></div>
<section class="guide-block"><h2>Expected 2027 payment calendar</h2><p>This table includes December 2026, the expected first benefit month at the 2027 annual rate, followed by the 12 benefit months of 2027. December 2027 is paid at the end of December because the observed New Year holiday falls on December 31.</p>${calendarTable()}<p class="small-note">Dates are calculated from the standard first-of-the-following-month rule, moved to the preceding business day for weekends and federal holidays. They are not a VA-published 2027 schedule.</p><p><a href="/#dates">Open the homepage calendar to download an .ics file →</a></p></section>
<section class="guide-block"><h2>Why can a payment arrive early?</h2><p>When the normal date falls on a weekend or holiday, the scheduled payment moves earlier. That can put two payments in one calendar month and none in the next. It does not create an extra month of benefits: check the benefit-month column to see what each payment covers.</p><p>For example, the January 2027 benefit month is expected to be paid on February 1. February’s benefit month is expected on March 1.</p></section>
<section class="guide-block"><h2>How these dates are calculated</h2><p>We start on the first day after each benefit month and move backward past Saturdays, Sundays, and observed federal holidays. The same date logic powers this table and the homepage calendar. The next-payment indicator uses the U.S. Eastern calendar date.</p><ul><li>${external(paymentSource, 'VA payment history and payment timing')}</li><li>${external(holidaysSource, 'OPM federal holiday schedules')}</li><li>${external('https://www.va.gov/opa/publications/factsheets/fs_disability_compensation.pdf', 'VA historical fact sheet describing annual COLA timing')} — an archived explanation, not a current rate source.</li></ul></section>
<section class="guide-block"><h2>What if my deposit is different or missing?</h2><p>A bank’s early-release policy can change when funds appear. A new award, back pay, withholding, or an award adjustment may also follow different timing. First review ${external(paymentSource, 'your VA payment history')}, then contact VA or your bank through their official channels if you need help.</p><p>Do not post bank details, claim numbers, medical records, or other personal information on this website’s public issue tracker.</p></section>`);

const cards = [...home.matchAll(/<article class="benefit-card"[\s\S]*?<\/article>/g)].map(x => x[0]);
if (cards.length !== 9) throw new Error('Expected nine benefit program cards');
page('veteran-benefits', 'Other Veteran Benefits: Payments, Health & Housing', 'Explore nine Veteran benefit programs beyond regular disability compensation, with official eligibility links and guidance on which payments can overlap.', 'Other benefits for Veterans', 'Use this guide to find programs worth checking, understand what kind of help they offer, and go directly to official eligibility and application information.', `
<div class="guide-callout"><strong>Start with the kind of help you need.</strong><p>Some programs change your compensation rate, some provide a separate benefit, and others reimburse a qualifying expense or provide a service. None are automatically added to the calculator result.</p></div>
<section class="guide-block"><h2>Which programs should I look at first?</h2><ul><li><strong>Service-connected needs or inability to work:</strong> check Special Monthly Compensation or Individual Unemployability.</li><li><strong>A separate disability program:</strong> review Social Security’s rules for SSDI.</li><li><strong>Specific costs:</strong> check travel reimbursement, clothing allowance, or adapted housing assistance.</li><li><strong>Care and education:</strong> review VA health care and GI Bill eligibility.</li><li><strong>Financial need after wartime service:</strong> explore Veterans Pension and compare it with compensation.</li></ul></section>
<section class="guide-block"><h2>Nine programs to explore</h2><p>These summaries were reviewed October 15, 2026. Use the linked official pages for current eligibility, evidence requirements, deadlines, and application steps.</p><div class="benefit-grid guide-benefit-grid">${cards.join('\n')}</div></section>
<section class="guide-block"><h2>Which payments can overlap?</h2><p>SSDI and VA disability compensation may be received together if you separately qualify for both programs. A VA rating alone does not establish Social Security eligibility. ${external('https://www.ssa.gov/people/veterans/', 'Read SSA’s Veteran guidance')}.</p><p>Individual Unemployability can pay compensation at the 100% level while your rating stays the same; it is not a second regular disability check. ${external('https://www.va.gov/disability/eligibility/special-claims/unemployability/', 'Review VA’s IU rules')}.</p><p>VA pension and disability compensation cannot be paid at the same time. VA explains that if you qualify for both, it pays the greater benefit. ${external('https://www.va.gov/resources/how-are-pension-benefits-and-disability-compensation-different/', 'Compare pension and compensation')}.</p></section>
<section class="guide-block"><h2>Before you apply</h2><ol><li>Open the official program page and check its current eligibility requirements.</li><li>Follow its instructions for evidence, forms, deadlines, and submission.</li><li>Review whether another benefit affects the amount or payment arrangement.</li></ol><p>Your state may offer additional programs. ${external('https://www.va.gov/statedva.htm', 'Find your state Veterans affairs office')}.</p><p>This guide is educational. It does not screen applicants, submit claims, or determine eligibility.</p></section>`);

page('about', 'About, Sources & Corrections', 'Learn how Veteran Pay Guide uses official sources, labels payment estimates, reviews its content, and accepts corrections.', 'About Veteran Pay Guide', 'An independent educational website that helps Veterans and their families understand regular disability compensation, payment timing, and other programs to explore.', `
<section class="guide-block"><h2>Who publishes this website?</h2><p>Veteran Pay Guide is the publishing name used for this website. It is not part of VA, SSA, or the U.S. government, and it does not claim government endorsement or accredited claims-representative status.</p><p>The site provides a browser-based calculator and plain-English explanations. It does not access personal benefit records, provide an individual award decision, or file claims.</p></section>
<section class="guide-block" id="editorial-policy"><h2>Sources and review policy</h2><p>We use VA for compensation rates and program rules, SSA for COLA announcements, and OPM for federal holidays. Official sources are linked near the relevant information so you can check the original guidance.</p><p>Updates are manual. Review dates identify actual source checks or substantive content reviews; they are not an automatic daily refresh. When reviewing a change, we compare the source, update affected explanations and data, and check the calculator and tables for consistency.</p><p>As of ${reviewLabel}, the linked VA table lists official 2026 rates. Our 2027 dollar amounts apply the announced 3.6% COLA and remain estimates until a 2027 VA table is verified. Program summaries retain their separate October 15 review date.</p></section>
<section class="guide-block"><h2>How the calculator works</h2><p>Regular compensation begins with the VA table for the selected rating and eligible household. Our 2027 estimate multiplies the 2026 household total by 1.036, then rounds to cents. It excludes SMC, Individual Unemployability, offsets, withholding, and individual award adjustments.</p><p>The rate comparison and payment calendar are generated from the same data and rules used by the interactive calculator. Expected dates are calculated, not confirmed personal deposits.</p><ul><li>${external(ratesSource, 'Official VA compensation rates')}</li><li>${external(colaSource, 'SSA 2027 COLA announcement')}</li><li>${external(paymentSource, 'VA payment history')}</li><li>${external(holidaysSource, 'OPM federal holidays')}</li></ul></section>
<section class="guide-block" id="corrections"><h2>Report an error or contact the maintainer</h2><p>Use the website’s ${external(issues, 'GitHub Issues page')} for corrections or general website questions. Include the page URL, what seems incorrect, and an official source if available. A GitHub account is required to create an issue, and submissions are public.</p><p>Do not include Social Security numbers, VA claim numbers, medical records, bank information, or private award letters. For personal benefit questions, contact VA through ${external('https://www.va.gov/contact-us/', 'its official contact page')}.</p></section>`);

page('privacy', 'Privacy Notice', 'How Veteran Pay Guide handles calculator inputs, website analytics, third-party fonts, hosting, and public correction requests.', 'Privacy notice', 'Understand what stays in your browser and which third-party services load when you visit this website.', `
<section class="guide-block"><h2>Calculator inputs</h2><p>The calculator processes your rating and household selections in your browser. Our application code does not submit those form values to a server, save them in cookies or local storage, or place them in page URLs. You do not need to provide your name, claim number, or account credentials to use it.</p></section>
<section class="guide-block"><h2>Website analytics</h2><p>This website loads Ahrefs Web Analytics to help understand visits and page usage. Ahrefs describes this product as cookie-free analytics. Page visits and technical usage information are processed by that service; calculator form values are not sent by our application code.</p><p>${external('https://ahrefs.com/web-analytics', 'About Ahrefs Web Analytics')} · ${external('https://ahrefs.com/privacy-policy', 'Ahrefs privacy policy')}.</p></section>
<section class="guide-block"><h2>Hosting and fonts</h2><p>Vercel hosts the website and receives network requests needed to serve it. Google Fonts provides the typefaces and receives requests when fonts load. Those providers handle request information under their own policies, which may include IP addresses and technical browser data.</p><p>${external('https://vercel.com/legal/privacy-policy', 'Vercel privacy policy')} · ${external('https://developers.google.com/fonts/faq/privacy', 'Google Fonts privacy information')}.</p></section>
<section class="guide-block"><h2>External links and public corrections</h2><p>Official benefit links lead to websites operated by VA, SSA, and other organizations. Their privacy policies apply once you visit them. Corrections submitted through GitHub Issues are public and handled by GitHub. Do not submit personal benefit or financial information there.</p><p>For a privacy question about this website, use ${external(issues, 'the public website issue tracker')} without including sensitive information.</p></section>
<section class="guide-block"><h2>Changes to this notice</h2><p>This notice describes the current implementation and was updated ${reviewLabel}. It should be revised when the website’s data-handling practices change.</p></section>`);

fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[origin + '/', ...pages].map(url => `  <url><loc>${url}</loc><lastmod>${reviewed}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${pages.length} guide/information pages, homepage tables, robots.txt and sitemap.xml.`);
