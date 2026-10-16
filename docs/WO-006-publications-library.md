# WO-006 - Publications Library (studies, white papers and PDFs)

**Status:** Draft, needs Ben's input before it is ready to execute
**Raised:** Friday 16 October 2026, by Ben

## The problem

The sitemap lists 16 pages and 6 posts. None of Labskin's studies, papers or PDFs are in it, so search engines and AI answer engines barely see the science, which is Labskin's strongest selling point.

## The idea

Give every study its own HTML page rather than relying on a bare PDF link. Each page has:

- the title, authors, year, journal or venue, DOI, and a plain-English summary;
- a "Download PDF" button;
- Google Scholar citation meta tags (`citation_title`, `citation_author`, `citation_publication_date`, `citation_pdf_url`) and schema.org `ScholarlyArticle` markup;
- a link to the relevant service (for example Histology Services or Contract Research).

These would be a "Publication" post type with a Publications index page that filters by topic, and they would appear in the sitemap automatically.

## Questions for Ben before this is scoped

1. Where do the studies live now (the Media Library, the Resources page, SharePoint, or elsewhere)? How many are there?
2. Which are public? Anything with a client name or confidential data stays out.
3. Who writes the plain-English summaries? (Claude can draft them from the PDFs for the scientists to check.)
4. Should the PDFs be gated (email for download, through HubSpot) or open? Open is better for search. Gated gives leads.
