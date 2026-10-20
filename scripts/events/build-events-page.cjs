// WO-008: builds the paste-in block markup for the Events page, the "Event card"
// pattern, and one all-day .ics per event, from events.json.
//
// Markup is created with WordPress's own block serializer, then re-parsed and
// checked, so the editor will not report "unexpected or invalid content".
//
//   cd scripts/events && npm install && npm run build
//
// Builds one site per run: `node build-events-page.cjs production` writes pages/
// (the paste-in deliverable), `... staging` writes pages/staging/.

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
const SITE = process.argv[2] || 'production';
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'events.json'), 'utf8'));
if (!data.sites[SITE]) throw new Error(`Unknown site "${SITE}"; expected one of: ${Object.keys(data.sites).join(', ')}`);
Object.assign(data, data.sites[SITE]);
const OUT = SITE === 'production' ? path.join(ROOT, 'pages') : path.join(ROOT, 'pages', SITE);
const UTM = 'utm_source=website&utm_medium=events&utm_campaign=';
const LOGOS = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages', 'logos', 'logos.json'), 'utf8'));
// A changed .ics gets a new file name ("icsRev": "v2"), because re-uploading the
// same name makes WordPress save it as "-1" and the page link would miss it.
const icsName = (e) => `labskin-${e.slug}${e.icsRev ? `-${e.icsRev}` : ''}.ics`;

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

// Colours come from the theme palette, chosen for contrast: dark text on the
// brand teal (7.3:1), grey tag text on white (5.2:1). White on the brand teal
// is only 2.6:1, so it is not used.
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3).toUpperCase());

// Date badge: "4–5" over "NOV"; "30–1" over "NOV–DEC" across months.
// Word joiners (U+2060) around the dash stop "10–11" breaking onto two lines;
// 84px leaves room for it (69px wide in Inter on production, 68px fitted at 76px).
const NOBREAK_DASH = '⁠–⁠';
const BADGE_WIDTH = '84px';
function badge(start, end) {
	const s = day(start), e = day(end);
	const days = start === end ? `${s.getUTCDate()}` : `${s.getUTCDate()}${NOBREAK_DASH}${e.getUTCDate()}`;
	const months = s.getUTCMonth() === e.getUTCMonth() ? SHORT_MONTHS[s.getUTCMonth()] : `${SHORT_MONTHS[s.getUTCMonth()]}${NOBREAK_DASH}${SHORT_MONTHS[e.getUTCMonth()]}`;
	const line = (content, typography) => b('core/paragraph', {
		content, textColor: 'primary',
		style: { typography: { textAlign: 'center', lineHeight: '1.1', ...typography }, spacing: { margin: { top: '0', bottom: '0' } } },
	});
	return b('core/group', {
		backgroundColor: 'secondary',
		style: {
			border: { radius: '10px' },
			spacing: { padding: { top: '12px', right: '4px', bottom: '12px', left: '4px' }, blockGap: '4px' },
			layout: { selfStretch: 'fixedNoShrink', flexSize: BADGE_WIDTH },
		},
		layout: { type: 'default' },
	}, [
		line(days, { fontSize: '26px', fontWeight: '700' }),
		line(months, { fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }),
	]);
}

// Type tag. Webinars get a teal pill (same colours as the date badge) so they
// stand out in the list; it sits in a flex group so the pill fits its text.
function tag(text, highlight) {
	const typography = { fontSize: '13px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1.5px' };
	if (!highlight) {
		return b('core/paragraph', { content: text, textColor: 'tertiary', style: { typography, spacing: { margin: { bottom: '0' } } } });
	}
	return b('core/group', { layout: { type: 'flex', flexWrap: 'nowrap' } }, [
		b('core/paragraph', {
			content: text, backgroundColor: 'secondary', textColor: 'primary',
			style: {
				typography: { ...typography, lineHeight: '1.2' },
				border: { radius: '999px' },
				spacing: { padding: { top: '4px', right: '10px', bottom: '4px', left: '10px' }, margin: { top: '0', bottom: '0' } },
			},
		}),
	]);
}

// Stand sticker: dark pill (white on #101010) beside the type tag, so a visitor
// at the venue can find the stand. Only shown when a stand number is known.
const sticker = (text) => b('core/paragraph', {
	content: text, backgroundColor: 'primary', textColor: 'white',
	style: {
		typography: { fontSize: '13px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1.5px', lineHeight: '1.2' },
		border: { radius: '6px' },
		spacing: { padding: { top: '4px', right: '10px', bottom: '4px', left: '10px' }, margin: { top: '0', bottom: '0' } },
	},
});

// Venue line: a Google Maps link (opens the Maps app on phones), with a pin.
// Deliberately not styled as a link (Ben: a "surprise and delight" detail), so
// no underline and the text colour is inherited. Padding makes a 44px-tall tap
// area; the equal negative margin keeps the layout exactly as it was. Inline
// style on the link, in the page content: no theme CSS needed.
const MAP_LINK_STYLE = 'text-decoration:none;color:inherit;display:inline-block;padding:12px 0;margin:-12px 0';
// Brand-teal pin (scripts/events/prepare-logos.cjs), 1em tall to match the text.
// Decorative (alt=""): the venue name is the link text. The 2px left nudge lines
// the round pin up optically with the square date badge above it.
const MAP_PIN = () => `<img src="${data.mediaBaseUrl}map-pin-brand.webp" alt="" width="34" height="48" style="height:1em;width:auto;vertical-align:-0.15em;margin:0 0.4em 0 2px">`;
function venueHtml(venue, mapQuery) {
	if (!mapQuery) return venue;
	const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
	return `<a href="${href}" target="_blank" rel="noreferrer noopener" style="${MAP_LINK_STYLE}">${MAP_PIN()}${venue}</a>`;
}

const button = (text, url, primary, newTab) => b('core/button', {
	text, url,
	...(newTab ? { linkTarget: '_blank', rel: 'noopener' } : {}),
	...(primary
		? { backgroundColor: 'secondary', textColor: 'primary', style: { border: { radius: '8px' }, typography: { fontWeight: '600' } } }
		// No text colour on outline buttons: the theme's hover fills them with #101010
		// and turns the text white, which an explicit colour would block (black on black).
		: { className: 'is-style-outline', style: { border: { radius: '8px' } } }),
});

// Organiser logo, top right of the card (wraps under the title on a phone).
// Decorative: the event name is the heading beside it, so alt is empty.
// Fixed width and height so the page doesn't shift while it loads.
function logoBlock(logo) {
	return b('core/image', {
		url: `${data.mediaBaseUrl}${logo.file}`,
		alt: '',
		width: `${logo.width}px`,
		height: `${logo.height}px`,
		scale: 'contain',
		style: { spacing: { margin: { top: '0', bottom: '0' } } },
	});
}

// Card: badge beside the tag and title; details and buttons use the full width
// underneath, so the text is not squeezed on a phone.
function card({ type, name, start, end, when, venue, mapQuery, stand, description, topics, bookingHref, bookingText, registerHref, icsHref, logo }) {
	// Registration (events and webinars) always uses the outline button and opens in a new tab.
	const buttons = bookingHref ? [button(bookingText, bookingHref, true)] : [];
	if (registerHref) buttons.push(button(type === 'Webinar' ? 'Register for this webinar' : 'Register for this event', registerHref, false, true));
	const title = b('core/group', {
		// Fill: take the row's spare width so the title doesn't wrap beside the logo.
		style: { spacing: { blockGap: '16px' }, layout: { selfStretch: 'fill', flexSize: null } },
		layout: { type: 'flex', flexWrap: 'nowrap', verticalAlignment: 'center' },
	}, [
		badge(start, end),
		b('core/group', { style: { spacing: { blockGap: '6px' } }, layout: { type: 'default' } }, [
			stand
				? b('core/group', { style: { spacing: { blockGap: '10px' } }, layout: { type: 'flex', flexWrap: 'wrap', verticalAlignment: 'center' } }, [
					tag(type, type === 'Webinar'),
					sticker(`Stand ${stand}`),
				])
				: tag(type, type === 'Webinar'),
			b('core/heading', { level: 3, content: name, style: { spacing: { margin: { top: '0', bottom: '0' } } } }),
		]),
	]);
	const body = [
		logo
			? b('core/group', {
				style: { spacing: { blockGap: '16px' } },
				layout: { type: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', verticalAlignment: 'center' },
			}, [title, logoBlock(logo)])
			: title,
		b('core/paragraph', {
			content: `<strong>${when}</strong><br>${venueHtml(venue, mapQuery)}`,
			style: { elements: { link: { color: { text: 'var:preset|color|primary' } } }, spacing: { margin: { top: '18px' } } },
		}),
		...(description ? [b('core/paragraph', { content: description })] : []),
		...(topics && topics.length ? [b('core/list', {}, topics.map((t) => b('core/list-item', { content: t })))] : []),
		b('core/buttons', { style: { spacing: { margin: { top: '18px' }, blockGap: '10px' } } }, buttons),
	];
	if (icsHref) {
		body.push(b('core/paragraph', { fontSize: 'small', content: `<a href="${icsHref}">Add to calendar</a>`, style: { elements: { link: { color: { text: 'var:preset|color|primary' } } }, spacing: { margin: { top: '14px' } } } }));
	}
	return b('core/group', {
		tagName: 'article',
		// Pale teal tint so cards stand out from the white page; grey tag text
		// on it is still 4.7:1.
		style: { color: { background: '#eaf6f5' }, border: { color: '#cde8e5', width: '1px', radius: '14px' }, spacing: { padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' } } },
		layout: { type: 'default' },
	}, body);
}

// "15:00" -> "3pm", "09:30" -> "9.30am" (UK style).
function clock(hhmm) {
	const [h, m] = hhmm.split(':').map(Number);
	return `${h % 12 || 12}${m ? `.${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
}

// The contact form (HubSpot) pre-fills fields from matching query parameters:
// "message" is the Message box, "marketing_lead_source" the "How did you hear" list.
const LEAD_SOURCES = ['Exhibition', 'Conference'];
function bookingUrl(e, when) {
	const q = new URLSearchParams({ message: `I'd like to book a meeting with Labskin at ${e.name} (${when}).` });
	if (LEAD_SOURCES.includes(e.type)) q.set('marketing_lead_source', e.type);
	return `${data.bookingBaseUrl}?${q.toString().replace(/\+/g, '%20')}&${UTM}${e.slug}`;
}

// Events with "hidden": true stay in events.json but are left off the page (and get no .ics).
const events = data.events.filter((e) => !e.hidden).sort((x, y) => x.start.localeCompare(y.start));
const webinars = [...data.webinars].sort((x, y) => x.start.localeCompare(y.start));

const listings = [
	...events.map((e) => {
		const when = fullDate(e.start, e.end);
		return {
			start: e.start, type: e.type, name: e.name, end: e.end, when, venue: e.venue, mapQuery: e.mapQuery, stand: e.stand, description: e.description,
			bookingText: `Book a meeting at ${e.name}`, bookingHref: bookingUrl(e, when),
			registerHref: e.registrationUrl, icsHref: `${data.icsBaseUrl}${icsName(e)}`, logo: LOGOS[e.slug],
		};
	}),
	...webinars.map((w) => ({
		start: w.start, type: 'Webinar', name: w.name, end: w.start,
		when: `${fullDate(w.start, w.start)}, ${clock(w.startTime)} UK time`, venue: 'Online', description: w.description, topics: w.topics,
		registerHref: `${w.registerUrl}${w.registerUrl.includes('?') ? '&' : '?'}${UTM}${w.slug}`,
		icsHref: `${data.icsBaseUrl}${icsName(w)}`,
	})),
].sort((x, y) => x.start.localeCompare(y.start));

const page = [
	b('core/paragraph', {
		fontSize: 'medium',
		content: 'Talk to us about your next study in person at an exhibition, or join one of our webinars. Book a meeting in advance and we\'ll make sure the right person is there to see you.',
	}),
	b('core/heading', { level: 2, content: 'Upcoming events', textColor: 'primary', style: { spacing: { margin: { top: '48px', bottom: '24px' } } } }),
	listings.length
		// Padding 0: the theme otherwise pads plain groups by 30px each side.
		? b('core/group', { style: { spacing: { blockGap: '20px', padding: { top: '0', right: '0', bottom: '0', left: '0' }, margin: { bottom: '64px' } } }, layout: { type: 'default' } }, listings.map(card))
		: b('core/paragraph', { content: `We don't have any events scheduled right now. <a href="${data.contactUrl}">Get in touch</a> and we'll arrange a call, or check back soon.` }),
];

const pattern = card({
	type: 'Exhibition',
	name: 'Event name',
	start: '2026-11-10', end: '2026-11-10',
	when: 'Tuesday 10 November 2026',
	venue: 'Venue, City',
	description: 'One sentence about the event.',
	bookingText: 'Book a meeting at Event name',
	bookingHref: bookingUrl({ name: 'Event name', type: 'Exhibition', slug: 'event-slug-2026' }, 'Tuesday 10 November 2026'),
	registerHref: 'https://example.com/register',
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

console.log(`site: ${SITE}`);
fs.mkdirSync(path.join(OUT, 'ics'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'events.html'), checked(page, 'events.html'));
fs.writeFileSync(path.join(OUT, 'event-card.html'), checked([pattern], 'event-card.html'));

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

// The UID stays the same and SEQUENCE goes up with "icsRev", so calendars update the event.
function writeIcs(e, when, summary, location, description) {
	const sequence = e.icsRev ? Number(String(e.icsRev).replace(/\D/g, '')) - 1 || 1 : 0;
	const lines = [
		'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Labskin//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${e.slug}@labskin.co.uk`,
		`DTSTAMP:${stamp}`,
		...(sequence ? [`SEQUENCE:${sequence}`] : []),
		...when,
		`SUMMARY:${esc(summary)}`,
		`LOCATION:${esc(location)}`,
		`DESCRIPTION:${esc(description)}`,
		'END:VEVENT', 'END:VCALENDAR',
	];
	fs.writeFileSync(path.join(OUT, 'ics', icsName(e)), lines.map(fold).join('\r\n') + '\r\n');
}

for (const e of events) {
	writeIcs(e,
		[`DTSTART;VALUE=DATE:${icsDate(e.start)}`, `DTEND;VALUE=DATE:${icsDate(nextDay(e.end))}`, 'TRANSP:TRANSPARENT'],
		`${e.name} - meet Labskin`, e.venue,
		`${e.description ? `${e.description}\n\n` : ''}Book a meeting with Labskin: ${data.eventsPageUrl}`);
}
for (const w of webinars) {
	const start = londonToUtc(w.start, w.startTime);
	const end = new Date(start.getTime() + w.durationMinutes * 60000);
	writeIcs(w, [`DTSTART:${icsUtc(start)}`, `DTEND:${icsUtc(end)}`],
		w.name, 'Online', `${w.description}${(w.topics || []).map((t) => `\n- ${t}`).join('')}\n\nRegister: ${w.registerUrl}`);
}
console.log(`ics: ${events.length + webinars.length} files`);
