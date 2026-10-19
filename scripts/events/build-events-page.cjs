// WO-008: builds the paste-in block markup for the Events page, the "Event card"
// pattern, and one all-day .ics per event, from events.json.
//
// Markup is created with WordPress's own block serializer, then re-parsed and
// checked, so the editor will not report "unexpected or invalid content".
//
//   cd scripts/events && npm install && node build-events-page.cjs

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.test/' });
for (const k of ['window', 'document', 'navigator', 'Node', 'HTMLElement', 'Element', 'DOMParser', 'MutationObserver', 'getComputedStyle', 'Range', 'Text', 'DocumentFragment']) {
	if (globalThis[k] === undefined) globalThis[k] = dom.window[k];
}
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
globalThis.matchMedia = window.matchMedia;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

const originalConsoleError = console.error;
console.error = (...args) => { if (!String(args[0]).includes('Could not parse CSS')) originalConsoleError(...args); };

const { registerCoreBlocks } = require('@wordpress/block-library');
const { createBlock: b, serialize, parse } = require('@wordpress/blocks');
registerCoreBlocks();

const ROOT = path.resolve(__dirname, '..', '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'events.json'), 'utf8'));
const UTM = 'utm_source=website&utm_medium=events&utm_campaign=';

// ---- Dates -----------------------------------------------------------------

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const day = (iso) => new Date(`${iso}T12:00:00Z`);

// Written out in full for screen readers: "Wednesday 4 to Thursday 5 November 2026".
function fullDate(start, end) {
	const s = day(start), e = day(end);
	const part = (d, withMonth, withYear) =>
		`${DAYS[d.getUTCDay()]} ${d.getUTCDate()}${withMonth ? ` ${MONTHS[d.getUTCMonth()]}` : ''}${withYear ? ` ${d.getUTCFullYear()}` : ''}`;
	if (start === end) return part(s, true, true);
	const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
	const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
	return `${part(s, !sameMonth, !sameYear)} to ${part(e, true, true)}`;
}

// ---- Blocks ----------------------------------------------------------------

const tag = (text) => b('core/paragraph', {
	content: text,
	textColor: 'secondary',
	fontSize: 'small',
	style: { typography: { textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1px' }, spacing: { margin: { bottom: '0' } } },
});

function card({ type, where, name, when, venue, description, bookingHref, bookingText, icsHref, websiteHref }) {
	const outline = (text, url) => b('core/button', { text, url, className: 'is-style-outline', textColor: 'secondary' });
	const buttons = [
		b('core/button', { text: bookingText, url: bookingHref, backgroundColor: 'secondary', textColor: 'white' }),
	];
	if (icsHref) buttons.push(outline('Add to calendar', icsHref));
	if (websiteHref) buttons.push(outline('Event website', websiteHref));
	return b('core/group', {
		tagName: 'article',
		backgroundColor: 'white',
		borderColor: 'lightgrey',
		style: {
			border: { width: '1px', radius: '12px' },
			spacing: { padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' }, blockGap: '12px' },
		},
		layout: { type: 'constrained' },
	}, [
		tag(`${type} · ${where}`),
		b('core/heading', { level: 3, content: name, style: { spacing: { margin: { top: '0' } } } }),
		b('core/paragraph', { content: `<strong>${when}</strong><br>${venue}` }),
		b('core/paragraph', { content: description }),
		b('core/buttons', { style: { spacing: { margin: { top: '20px' } } } }, buttons),
	]);
}

const listGroup = (inner) => b('core/group', { style: { spacing: { blockGap: '24px' } }, layout: { type: 'constrained' } }, inner);
const sectionHeading = (text) => b('core/heading', { level: 2, content: text, textColor: 'secondary', style: { spacing: { margin: { top: '56px' } } } });

const events = [...data.events].sort((x, y) => x.start.localeCompare(y.start));

const eventCards = events.map((e) => card({
	type: e.type,
	where: 'In person',
	name: e.name,
	when: fullDate(e.start, e.end),
	venue: e.venue,
	description: e.description,
	bookingText: `Book a meeting at ${e.name}`,
	bookingHref: `${data.bookingBaseUrl}?${UTM}${e.slug}`,
	icsHref: `${data.icsBaseUrl}labskin-${e.slug}.ics`,
	websiteHref: e.website,
}));

// "15:00" -> "3pm", "09:30" -> "9.30am" (UK style).
function clock(hhmm) {
	const [h, m] = hhmm.split(':').map(Number);
	return `${h % 12 || 12}${m ? `.${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
}

const webinars = [...data.webinars].sort((x, y) => x.start.localeCompare(y.start));
const webinarCards = webinars.map((w) => card({
	type: 'Webinar',
	where: 'Online',
	name: w.name,
	when: `${fullDate(w.start, w.start)}, ${clock(w.startTime)} UK time`,
	venue: 'Online',
	description: w.description,
	bookingText: 'Register',
	bookingHref: `${w.registerUrl}${w.registerUrl.includes('?') ? '&' : '?'}${UTM}${w.slug}`,
	icsHref: `${data.icsBaseUrl}labskin-${w.slug}.ics`,
	websiteHref: w.website,
}));

const emptyState = (what) => b('core/paragraph', {
	content: `We don't have any ${what} scheduled right now. <a href="${data.contactUrl}">Get in touch</a> and we'll arrange a call, or check back soon.`,
});

const page = [
	b('core/paragraph', {
		fontSize: 'medium',
		content: 'Talk to us about your next study in person at an exhibition, or join one of our webinars. Book a meeting in advance and we\'ll make sure the right person is there to see you.',
	}),
	sectionHeading('In person'),
	eventCards.length ? listGroup(eventCards) : emptyState('events'),
	sectionHeading('Online'),
	webinarCards.length ? listGroup(webinarCards) : emptyState('webinars'),
];

const pattern = card({
	type: 'Exhibition',
	where: 'In person',
	name: 'Event name',
	when: 'Tuesday 10 November 2026',
	venue: 'Venue, City',
	description: 'One sentence about the event.',
	bookingText: 'Book a meeting at Event name',
	bookingHref: `${data.bookingBaseUrl}?${UTM}event-slug-2026`,
	icsHref: `${data.icsBaseUrl}labskin-event-slug-2026.ics`,
});

// ---- Validate and write ----------------------------------------------------

function checked(blocks, label) {
	const html = serialize(blocks);
	const bad = [];
	(function walk(list) {
		for (const blk of list) {
			if (blk.name && !blk.isValid) bad.push(blk.name);
			walk(blk.innerBlocks || []);
		}
	})(parse(html));
	if (bad.length) throw new Error(`${label}: invalid blocks after re-parse: ${bad.join(', ')}`);
	console.log(`${label}: ${html.length} bytes, all blocks valid`);
	return html + '\n';
}

fs.mkdirSync(path.join(ROOT, 'pages', 'ics'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'pages', 'events.html'), checked(page, 'events.html'));
fs.writeFileSync(path.join(ROOT, 'pages', 'event-card.html'), checked([pattern], 'event-card.html'));

// ---- .ics ------------------------------------------------------------------
// Exhibitions are all-day (no time zone needed). Webinars are written in UTC,
// converted from UK time, so every calendar shows the right local time.

const icsDate = (iso) => iso.replaceAll('-', '');
const nextDay = (iso) => { const d = day(iso); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
function fold(line) {
	const out = [];
	let buf = Buffer.from(line, 'utf8');
	while (buf.length > 75) {
		let cut = out.length ? 74 : 75;
		while ((buf[cut] & 0xc0) === 0x80) cut--; // don't split a UTF-8 character
		out.push(buf.subarray(0, cut).toString('utf8'));
		buf = buf.subarray(cut);
	}
	out.push(buf.toString('utf8'));
	return out.join('\r\n ');
}
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

// UK wall-clock time -> UTC Date, using the time-zone database for GMT/BST.
function londonToUtc(isoDate, hhmm) {
	const guess = new Date(`${isoDate}T${hhmm}:00Z`);
	const offset = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' })
		.formatToParts(guess).find((p) => p.type === 'timeZoneName').value; // "GMT" or "GMT+01:00"
	const m = offset.match(/([+-])(\d\d):(\d\d)/);
	const minutes = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
	return new Date(guess.getTime() - minutes * 60000);
}
const icsUtc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

function writeIcs(slug, when, summary, location, description) {
	const lines = [
		'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Labskin//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${slug}@labskin.co.uk`,
		`DTSTAMP:${stamp}`,
		...when,
		`SUMMARY:${esc(summary)}`,
		`LOCATION:${esc(location)}`,
		`DESCRIPTION:${esc(description)}`,
		'END:VEVENT', 'END:VCALENDAR',
	];
	fs.writeFileSync(path.join(ROOT, 'pages', 'ics', `labskin-${slug}.ics`), lines.map(fold).join('\r\n') + '\r\n');
}

for (const e of events) {
	writeIcs(e.slug,
		[`DTSTART;VALUE=DATE:${icsDate(e.start)}`, `DTEND;VALUE=DATE:${icsDate(nextDay(e.end))}`, 'TRANSP:TRANSPARENT'],
		`${e.name} - meet Labskin`, e.venue,
		`${e.description}\n\nBook a meeting with Labskin: https://labskin.co.uk/events/`);
}
for (const w of webinars) {
	const start = londonToUtc(w.start, w.startTime);
	const end = new Date(start.getTime() + w.durationMinutes * 60000);
	writeIcs(w.slug, [`DTSTART:${icsUtc(start)}`, `DTEND:${icsUtc(end)}`],
		w.name, 'Online', `${w.description}\n\nRegister: ${w.registerUrl}`);
}
console.log(`ics: ${events.length + webinars.length} files`);
