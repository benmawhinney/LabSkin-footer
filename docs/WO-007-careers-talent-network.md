# WO-007 - Careers Page and Talent Network

**Status:** Ready to execute (staging only)
**Raised:** Monday 19 October 2026, by Ben
**Branch:** `feature/careers-talent-network`, created from `feature/meeples-footer` (the state deployed on staging)
**Target:** M&C dev/staging only (https://mischiefandcraft.com). Do not touch Labskin production (https://labskin.co.uk).

## Objective

Give people a way to register interest in working at Labskin when no roles are open, without implying there are vacancies, without creating work for the team, and handling CVs as personal data from the start.

The page builds a talent pool ahead of planned growth, and also tells clients and investors that Labskin is a lab people want to join.

## Ben does first (in HubSpot)

The HubSpot WordPress plugin is deactivated on staging, so the form is embedded with HubSpot's own embed code, not through the plugin. **Every submission on staging still lands in the live HubSpot account.** Use test addresses only (for example `ben+talent1@…`) and delete the test contacts afterwards, using Procedure 5 of the playbook.

1. Create a HubSpot form named **"Talent network (website)"** with the fields below.
2. Create a contact property **Talent network joined** (date) and set it from the form.
3. Create a private static list or segment **"Talent network"** for everyone who submits.
4. Set the form's **follow-up email** (copy below). It is sent automatically, so nobody has to reply.
5. Create a workflow: **11 months** after *Talent network joined*, send the renewal email (copy below). At **12 months**, if they have not renewed, remove the talent-network data, or delete the contact if they have no other relationship with Labskin.
6. Check that **files uploaded through the form are private** in HubSpot's file manager, not public links. Confirm before going live.
7. Give VS Code the form's **portal ID and form ID** (embed code).

### Form fields

| Field | Type | Required |
|---|---|---|
| First name | Text | Yes |
| Last name | Text | Yes |
| Email | Email | Yes |
| Phone | Phone | No |
| Where are you based? | Text (town and country) | Yes |
| Areas that interest you | Checkboxes: Microbiology; Tissue culture and production; Histology; Assays and claims; Project management; Business development and sales; Placement or KTP; Other | Yes |
| Career stage | Dropdown: Student looking for a placement; Graduate; Experienced scientist; Commercial or management | Yes |
| Do you have the right to work in the UK? | Dropdown: Yes; No, I would need sponsorship; Not sure | Yes |
| LinkedIn profile | URL | No |
| CV | File upload (PDF or Word, up to 10 MB) | Yes |
| Anything you'd like us to know? | Multi-line text, about 500 characters | No |
| Consent | Checkbox (wording below) | Yes |
| Labskin news | Checkbox, unticked: "Send me occasional Labskin news." | No |

Keep the news opt-in separate from the consent, and unticked. Talent-network data must not go into marketing lists unless the person ticks the news box.

## Page

- Title: **Careers at Labskin**. Slug: `careers` (clean URL once WO-004 lands).
- Use the theme's standard page template and existing block styles. No new design system.
- Add **Careers** to the footer's company links. Production footer and menu changes come later, with sign-off.

### Page copy

Draft for Labskin to check. Confirm the description of the business with Nicola before the page goes to production.

> # Careers at Labskin
>
> **We're not hiring right now, but we're growing.**
>
> Labskin is a laboratory in Wetherby, testing products on our full-thickness human skin model, Labskin-S. We work with skincare, healthcare and ingredients companies on microbiome, barrier and efficacy studies, and we plan to grow the team over the coming years.
>
> If you'd like to be part of that, join our talent network. Leave your details and CV, and when a role opens that suits you, we'll get in touch.
>
> ## The kind of people we work with
>
> - **Scientists** in microbiology, tissue culture, histology and assay development
> - **Production** specialists who grow and look after our skin models
> - **Project managers** who keep client studies on time
> - **Commercial** people who understand science and the cosmetics, healthcare and ingredients markets
>
> ## Students, placements and KTP
>
> We host industrial placement students and work with universities on Knowledge Transfer Partnerships. If you're a student looking for a placement year, tell us which university you're at and when you're available.
>
> ## What happens next
>
> - You'll get an email confirming we've received your details.
> - We won't reply individually unless a suitable role opens.
> - We keep your details for 12 months. Before then, we'll ask whether you'd like to stay in the network.
> - You can ask us to delete your details at any time. [Request deletion](link to the deletion request form)
>
> [Form]
>
> *We use your details only to consider you for roles at Labskin. See our [privacy policy](link).*

### Consent checkbox wording

> I agree to Labskin keeping my details and CV for up to 12 months to contact me about suitable roles. I can ask for them to be deleted at any time.

### Follow-up email (sent automatically)

> **Subject:** Thanks for joining the Labskin talent network
>
> Hi {first name},
>
> Thanks for your interest in Labskin. We've received your details and CV.
>
> We aren't hiring at the moment, so we won't reply individually. When a role opens that matches your interests, we'll be in touch.
>
> We'll keep your details for 12 months and check with you before then. If you'd like us to delete them sooner, use the deletion request form: {link}.
>
> Best wishes,
> The Labskin team

### Renewal email (11 months)

> **Subject:** Would you like to stay in the Labskin talent network?
>
> Hi {first name},
>
> You joined our talent network almost a year ago. If you'd like us to keep your details for another 12 months, click below. If we don't hear from you, we'll delete them next month.
>
> [Keep my details]
>
> The Labskin team

## Constraints

- Staging only. Never print or commit keys, passwords or tokens.
- No vacancies, salaries, headcounts or growth figures on the page. It must not read as a job advert.
- No names or photos of staff beyond what Meet the Team already shows.
- Accessibility: form labels, keyboard use, visible focus, error messages read by screen readers. The file upload must work on mobile.
- Do not add analytics or tracking scripts beyond the HubSpot form embed.

## Verification

1. The page renders at desktop and 390 px, with no horizontal scroll. The form submits with a PDF and with a Word CV.
2. A test submission arrives in HubSpot: the contact is in the Talent network list, *Talent network joined* is set, and the CV is attached and **private**.
3. The follow-up email arrives. The news opt-in left unticked does **not** add the contact to marketing lists.
4. Required fields and consent are enforced, and errors are announced.
5. The footer link works, and the other footer treatments are unaffected.
6. Test contacts are deleted afterwards (playbook Procedure 5) and noted in the EOD report.

## Delivery

Deploy to M&C staging following the Staging Deployment Rules. Commit on `feature/careers-talent-network` and push. Comment on the GitHub issue with the staging link, add an EOD entry, and stop for sign-off.

## Open questions for Ben

- Retention: 12 months, or 6?
- Who in Labskin looks at the talent network when hiring starts, and should they get a monthly digest rather than an email per submission?
- Should the Meet the Team page link to Careers as well as the footer?
