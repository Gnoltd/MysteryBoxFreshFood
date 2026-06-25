# F&B Digital Transformation Project Report
## MysteryBox — Reducing End-of-Day Food Surplus in Hanoi's F&B Sector

**Institution:** Hanoi School of Business and Management
**Course:** HSB3057E — Digital Transformation in Business
**Date:** June 2026
**Venue Investigated:** FreshGarden (Vườn Tươi), Hanoi
**Abroad Benchmark:** Too Good To Go (Denmark / Global)

---

## Table of Contents

1. Executive Summary
2. Venue Analysis
3. Research Findings
4. App Development
5. Recommendations and Reflection
6. Appendices

---

## 1. Executive Summary

### Venue Overview and Key Findings

FreshGarden (Vườn Tươi) is a fast-casual healthy food chain with two Hanoi branches at 26 Lý Thường Kiệt in Hoàn Kiếm District and 109 Xuân Thủy in Cầu Giấy District. The brand serves salads, grain bowls, and cold-pressed juices to customers aged 18–35, with prices ranging from 45,000 to 135,000 VND. Both branches operate on a fresh-prep model, meaning most menu items are assembled or cooked the same day they are sold.

Field observation across both locations over five separate visits identified a consistent gap in daily operations: between 18% and 24% of prepared inventory goes unsold by closing time and is discarded. On a slow evening at the Hoàn Kiếm branch, this amounts to approximately 200,000–350,000 VND in food that was purchased, prepared, and then thrown away. Across both branches, each manager estimated monthly food waste losses of 4–5 million VND with no mechanism to recover any of that value.

A customer survey of 87 respondents confirmed that 91% had no idea the brand had discounted end-of-day food available. A separate finding made the opportunity clearer: 68% of respondents aged 18–34 said they would use an app that lets them buy discounted end-of-day food from restaurants they already visit. The food is going to waste not because customers do not want it, but because no channel exists to connect the offer to the people who would take it.

### Selected Pain Point and Solution Summary

The pain point selected is end-of-day food surplus with no redistribution channel. The solution is MysteryBox, a web application where F&B vendors list surplus food near closing time as discounted mystery boxes. Customers browse active listings, pay through Stripe Checkout, and collect their order using a QR code that the vendor scans at pickup to confirm. The application is fully functional with separate vendor and customer flows, Firebase Authentication, real-time Firestore data, Cloud Function-backed payment processing, bilingual English and Vietnamese support, a camera QR scanner for pickup confirmation, and a subscription tier system that enforces daily purchase limits server-side. The codebase is hosted on GitHub and the application is deployed on Vercel. The model is directly adapted from Too Good To Go, the Danish food waste reduction platform that has facilitated over 350 million surplus meal purchases across 17 countries since 2015, rebuilt here for Vietnam's payment infrastructure and operational context.

---

## 2. Venue Analysis

### 2.1 Location Details and Observation Methodology

The Hoàn Kiếm branch at 26 Lý Thường Kiệt sits on a commercial street in central Hanoi and serves a mix of office workers, tourists, and local residents. It opens at 7:30 AM and closes at 8:30 PM, with seating for approximately 22 covers. During the observation period, average lunch covers ran between 35 and 45 per day, while evening covers dropped sharply to 12–18. This branch consistently under-sold in the evenings, particularly on Mondays and during rainy weather.

The Cầu Giấy branch at 109 Xuân Thủy sits near the Hanoi University of Science and Technology campus and several commercial office buildings. It opens at 8:00 AM and closes at 9:00 PM, and handles noticeably higher foot traffic than the Hoàn Kiếm location, particularly at lunch where it regularly serves 50–75 customers on weekdays. The student-heavy customer base at this branch is more price-sensitive and more digitally active. Despite stronger overall demand, the branch still generates consistent end-of-day surplus after 7:00 PM when customer flow drops sharply.

The team conducted three structured visits per branch, each covering a weekday lunch shift from 11:00 AM to 2:00 PM and an evening shift from 5:30 PM through to close. Observations followed the Rainer (2021) Information Systems Framework, evaluating operations, management, and support systems at each location. Notes covered customer flow, ordering and payment processes, kitchen operations, staff communication, and end-of-day closing procedures. Staff were observed without prior announcement, and formal interviews were conducted separately after the observation sessions were complete.

### 2.2 FoH/BoH Process Documentation

#### Front-of-House

The ordering experience at both FreshGarden branches relies entirely on physical menus. A large menu board above the counter and printed table menus provide product information, but there is no QR code menu, no digital ordering kiosk, and no pre-order capability. Customers join a counter queue and order verbally. During the Cầu Giấy lunch peak, the queue extended to 8–10 customers on two of the three observation visits, with wait times of 5–8 minutes from joining the queue to receiving the order. Payment is handled at a Sapo POS tablet that accepts cash, bank cards, and VietQR bank transfers. Momo is also accepted via a printed QR code near the register. The payment process itself is fast — a VietQR transfer typically completes in under 30 seconds.

The brand has no mechanism for customer feedback collection beyond informal channels. Google Reviews and Instagram DMs are monitored, but there is no structured in-store process, no feedback card, and no follow-up with customers after a visit. The Hoàn Kiếm manager responds to Google Reviews within one to two days, which is the closest thing to a formal feedback loop that exists. There is no loyalty program of any kind — frequent customers receive no acknowledgment or benefit for returning, a gap that 38% of survey respondents identified as something they would value.

The brand's digital touchpoints are limited to an Instagram account with roughly 4,200 followers and Google Business Profiles for each location. There is no website. The Instagram account posts new menu items and promotional content three to four times per week but does not use Stories or push features for time-sensitive communication. When surplus is available at 7:30 PM and closing is at 8:30 PM, there is no digital mechanism to surface that information to anyone who is not already physically inside or walking past the store.

#### Back-of-House

Neither branch has a kitchen display system. Orders are printed on a thermal ticket at the counter and walked to the kitchen by counter staff. The kitchen team of two to three people per branch fills orders in the sequence the tickets arrive. During the Cầu Giấy lunch peak, six to seven tickets were backed up simultaneously on one observed visit, creating a visible bottleneck at the assembly station. Communication between counter and kitchen is entirely verbal, with no escalation procedure for delays or ingredient shortages.

Inventory is managed through a shared Google Sheets file updated manually by the branch manager at the start and end of each day. The sheet tracks beginning stock, estimated prep quantities, and estimated closing stock. There is no real-time visibility — each branch updates independently, and the owner reviews the combined sheet at the end of the day. No automated alert exists if a branch runs low on a key ingredient during service. Ingredients arrive from two local suppliers who deliver at around 6:30–7:00 AM each morning, ordered the previous evening through WhatsApp based on the manager's judgment of the next day's demand.

Shift scheduling and all internal staff communication run through a WhatsApp group shared between the two branch managers and the owner. There is no HR software, no scheduling tool, and no defined escalation structure. Monthly financial reporting is done manually by the owner from the Sapo POS data export and a separate Google Sheets file, a process described as taking a full weekend each month. Food waste is not tracked as a line item anywhere in the accounts — there is no recorded cost figure for what gets discarded, which means the problem is not visible in any financial document the business currently reviews.

### 2.3 TIHO Problem Classification

Analyzing FreshGarden's operations through the TIHO framework reveals problems distributed across all four categories, though they cluster most heavily around the absence of information systems and the absence of any organizational response to the waste problem.

On the technology side, neither branch has a digital channel for last-minute surplus communication, no kitchen display system, no real-time inventory dashboard, and no integration between the Sapo POS and any demand forecasting or analytics tool. GrabFood orders are processed through a separate tablet and represent an underutilized delivery channel. The internet connection at both locations is stable, which removes the typical infrastructure barrier for small F&B businesses in Vietnam — the technology gap here is about missing software rather than missing hardware.

The information problems follow directly from the technology gaps. There is no customer database, no loyalty record system, and no analytics on which items consistently over-produce or which days generate the most waste. The inventory data that does exist in Google Sheets has no historical depth — it captures today's closing position but cannot answer the question of what the pattern looks like across 60 weekdays. Food waste is entirely untracked as a financial cost, which means the business cannot calculate the return on investment of any tool designed to reduce it.

The human factors at FreshGarden are relatively favorable compared to many small F&B businesses. Both managers are comfortable with smartphones, the Sapo POS, Google Workspace tools, and social media. Resistance to new digital tools appears low — both expressed genuine interest in solutions to the waste problem. The limitation is practical rather than attitudinal: neither manager has experience with any inventory analytics platform or surplus management tool beyond the basic tools they already use. Kitchen staff follow food safety procedures but are unfamiliar with any form of digital logging for packed-at times or batch tracking.

At the organizational level, FreshGarden has no formal digitalization strategy or roadmap. There is no documented protocol for end-of-day surplus, no KPI for waste reduction, and no defined process for evaluating or adopting new technology. The owner makes ad hoc decisions about promotions through WhatsApp. Food waste reduction has not been named as an organizational priority in any conversation with staff or management, even though both managers are personally bothered by the amount of food discarded each evening.

### 2.4 Online and Offline Presence Assessment

FreshGarden's offline presence is strong relative to its size and market segment. Both branches are clean, well-located, and consistently branded with a visual identity that fits the healthy fast-casual category. The product quality is good — 4.2 and 4.4 average Google Review scores across 112 and 78 reviews respectively, which is above average for casual dining in Hanoi. Customer-facing counter operations run smoothly. The brand is physically findable and, once found, delivers a satisfying experience.

The online presence, by contrast, is almost entirely passive. The Instagram account and Google Business Profiles handle discoverability reasonably well — someone searching for healthy food near HUST or near Lý Thường Kiệt can find FreshGarden without difficulty. But the online presence does no active work beyond this. It does not enable pre-orders, does not capture customer contact information, does not support time-sensitive communication, and does not give the brand any way to push information to interested customers. The gap between what the offline presence achieves and what the online presence enables is the single clearest opportunity for digital transformation at FreshGarden.

---

## 3. Research Findings

### 3.1 Survey Methodology and Sample Demographics

A Google Form survey was distributed across two channels: in-person at both FreshGarden branches during the observation visits, and online via the brand's Instagram Stories with the manager's permission, over a five-day collection window. Surveys were conducted on three weekdays and two weekend days across both the lunch period from 11:30 AM to 1:30 PM and the dinner period from 5:30 PM to 7:30 PM. All responses were anonymous. Eighty-seven valid responses were collected in total.

In parallel, semi-structured interviews were conducted with the Hoàn Kiếm branch manager for approximately 30 minutes, the Cầu Giấy branch manager for approximately 25 minutes, and one senior kitchen staff member at the Cầu Giấy branch for approximately 15 minutes. Secondary data was drawn from the FAO 2022 Vietnam Food Loss and Waste Assessment (https://www.fao.org/vietnam), the Vietnam Food and Beverage Association 2023 Industry Report (https://vfba.vn), Nielsen Vietnam's 2024 Consumer Confidence survey (https://www.nielseniq.com), and Statista's 2024 Vietnam food delivery market data (https://www.statista.com).

The sample skews young and student-heavy, consistent with FreshGarden's positioning and the Cầu Giấy branch's proximity to the HUST university cluster. Fifty-one percent of respondents were aged 18–24, and a further 33% were aged 25–34, leaving only 16% aged 35 or older. Forty-four percent identified as students and 41% as full-time employees. Thirty-eight percent visited FreshGarden weekly or more often, a significant loyal segment. Thirty-four percent visited two to three times per month, and the remaining 28% less than once a month.

### 3.2 Key Insights from Interviews

The Hoàn Kiếm branch manager estimated that the branch discards food worth approximately 150,000–350,000 VND on a typical evening, with Monday and rainy days consistently the worst. She placed monthly food waste losses at around 4–5 million VND, though this figure had never appeared as a line item in the branch's financial records because there is no system to track it. When asked about existing mechanisms to address the surplus, her answer was direct: there are none. "Sometimes I post a photo on Instagram if we have a lot left, but by the time people see it they can't get here in time. And I can't do it every evening — it looks bad for the brand." She occasionally tells regular customers who arrive around 7:30 PM that leftover items are available, but this is entirely ad hoc and catches perhaps two or three people on a good evening. Her main concern about a new tool was not the technology but the workflow — specifically, how to handle the situation where a customer purchases a box and then arrives to find the items have already been sold in a last-minute counter rush. The solution she described, setting a listing 90 minutes before closing with a firm pickup window, was essentially the mechanism MysteryBox already implements.

The Cầu Giấy manager described a slightly different version of the same problem. His branch has a strong lunch demand that regularly exhausts the two most popular bowls before 1:15 PM, but after 7:00 PM demand drops sharply and pre-prepared items accumulate. He identified nearby university students as the most likely audience for a surplus offer, describing them as price-sensitive, digitally active, and already physically close to the branch. His specific question was whether the app would support Momo payments, noting that most of his student customers pay via Momo or VietQR rather than bank card. He made the case for a surplus app in terms that were more commercial than environmental: "If I could tell them there are 8 bowls left at half price, they would come. I just have no way to tell them right now."

The kitchen staff member at the Cầu Giấy branch offered a perspective that reframed the waste problem as a structural incentive issue rather than simply a channel problem. Prep quantities are set conservatively to avoid a lunch stockout, because running out during the peak creates immediate visible consequences — customers leave and sometimes post about it on Google. Over-preparing for the evening, by contrast, has no immediate consequence. As he put it: "If we waste 10 bowls at the end of the night, nothing happens. If we run out at noon, the manager hears about it." This asymmetry suggests that a tool which makes surplus monetizable — turning waste into recovered revenue rather than simply discarded cost — could over time change the calculation and nudge prep quantities toward greater accuracy.

### 3.3 Dashboard Visualizations

A Power BI dashboard was developed from the survey data to visualize the key findings. The full .pbix file is attached separately, and PDF exports of all dashboard pages are included in Appendix C.

The first view presents respondent demographics as a stacked bar chart showing age group distribution split by visit frequency. The 18–24 cohort shows the highest weekly visit rate at 42%, while the 35-plus group visits primarily once a month or less, confirming that the most loyal and most digitally active customer segments overlap almost completely.

The second view shows payment method distribution as a donut chart. VietQR bank transfer leads at 52%, followed by Momo at 27%, cash at 14%, and bank card at 7%. This is important context for the app design: the customer base is already transacting digitally, meaning the behavioral shift required to use MysteryBox is minimal. The barrier is not payment infrastructure — it is awareness and access to the offer.

The third view places the awareness and willingness gap side by side. Ninety-one percent of respondents had no awareness that end-of-day discounts were available, yet 68% of 18–34-year-old respondents said they would use a surplus food app for restaurants they already visit. The gap between "nobody knows" and "most would participate if they knew" is the addressable market.

The fourth view shows discount sensitivity as a histogram. Responses clustered at 40–59% off, selected by 41% of respondents, and 60% or more, selected by 22%. Only 8% said no discount would motivate a special trip. This means a 40–50% discount is sufficient to change the behavior of the majority of this customer base, which is achievable at FreshGarden's current cost structure given that the alternative is discarding the food entirely.

The fifth view is a problem frequency matrix ranking the issues identified across survey open-text responses and interview notes. End-of-day surplus waste ranked first by a significant margin on both frequency of mention and expressed frustration, followed at a distance by the absence of a loyalty program, the lack of a pre-order option, and poor real-time stock information.

### 3.4 Problem Prioritization Matrix

Four problems were identified at FreshGarden as candidates for an app-based solution: the absence of a surplus food redistribution channel, the absence of a customer loyalty program, the lack of an online pre-order system, and the absence of real-time inventory visibility. Evaluated on two axes — impact on vendor and customer outcomes, and how directly an app can address the problem without requiring POS integration or significant staff retraining — the surplus redistribution problem scores highest on both.

The loyalty program is a strong second candidate but requires tracking customer behavior persistently over weeks and months before the benefit becomes visible, making it harder to demonstrate value in a prototype timeframe. Pre-ordering is viable but requires coordination with the kitchen on order cut-off times and item availability, adding operational complexity. Real-time inventory visibility is valuable internally but does not directly translate to a customer-facing product. Surplus redistribution, by contrast, is self-contained: the vendor creates a listing near closing time, customers find it and pay, and pickup is confirmed with a QR scan. No POS integration, no kitchen system changes, no special hardware required.

The international benchmark that validates this choice is Too Good To Go (https://toogoodtogo.com), a Danish company founded in 2015 that now operates in 17 countries with over 80 million registered users and 350,000 partner businesses. Too Good To Go's core model is functionally identical to MysteryBox: restaurants list surplus food as "Magic Bags" at approximately one-third of the retail price, and customers collect during a defined pickup window near closing. As of 2024, the platform claims to have facilitated over 350 million surplus meal purchases that would otherwise have been discarded. The model's success across markets as different as Denmark, France, and the United States confirms that the behavior — buying discounted mystery food near a restaurant's closing time — is learnable and sticky across a wide range of customer demographics.

Several of Too Good To Go's design decisions directly shaped MysteryBox. The mystery box format removes the operational burden of real-time item-level inventory updates, because customers are buying the concept of discounted surplus rather than a specific menu item. Time-constrained pickup windows create urgency for customers and give vendors a clear operational endpoint. QR code pickup confirmation eliminates the need for a separate device or POS integration at the point of handoff. The price point of roughly one-third retail aligns with the 40–60% discount that FreshGarden customers said would motivate a special trip.

The main design difference between Too Good To Go and MysteryBox is geographic context. Too Good To Go operates in markets with mature card payment infrastructure. Vietnam requires VietQR and Momo as primary payment methods. The interface needs to work in Vietnamese as a first-class language, not a translation. And small F&B businesses in Hanoi — with 6–8 staff, no IT department, and a manager who sets prep quantities via WhatsApp the evening before — need a vendor workflow that takes under two minutes and does not require learning new operational categories. MysteryBox is designed around those constraints.

---

## 4. App Development

### 4.1 Pain Point Justification

The surplus redistribution problem at FreshGarden was selected because all three conditions for a viable product are simultaneously present. The supply is real and recurring: both branches discard prepared food every evening, the cost is material at 4–5 million VND per branch per month, and the managers are motivated to solve it. The demand is reachable: 68% of the 18–34-year-old customer base said they would use a surplus food app, and the same demographic already uses digital payments as their primary transaction method. The technical barrier is low: the vendor's contribution is a single action — creating a listing 60–90 minutes before closing — and requires no POS integration, no kitchen system changes, and no special hardware.

The alternative mechanisms that already exist at FreshGarden — occasional Instagram posts, telling regulars in person — do not work because they fail on timing. An Instagram post reaches people who may see it hours later. A verbal mention to a regular customer catches at most two or three people on a given evening. A dedicated app with opt-in notifications reaches people who have already expressed interest in the offer and can act on it within the required window. That is the gap the product fills.

### 4.2 Development Process with Claude

MysteryBox was built through a vibe coding approach, starting from a natural language description and iterating with Claude (https://claude.ai) across multiple sessions over approximately ten days. The following documents the key prompts and the problem each one addressed.

The initial prompt on June 17, 2026, described the core concept: a web app where F&B vendors list end-of-day surplus food as mystery boxes, customers browse and pay via Stripe, and pickup is confirmed with a QR code, built with React, Firebase, and Stripe, with a dark modern UI and bilingual English and Vietnamese support. Claude generated a project scaffold covering Firebase setup, routing, authentication pages, and a skeleton listing feed. The initial output was functional but incomplete — it had no Cloud Functions, no Firestore security rules, and no actual payment processing.

The first significant iteration addressed a security problem Claude identified independently before being asked about it. The initial checkout flow created a Stripe session from the browser, which would allow a malicious user to manipulate price and product data. The fix moved session creation to a Firebase Cloud Function called `createCheckoutSession` that validates the listing, checks available stock, creates the pending order in Firestore, and returns the Stripe URL. The client never handles payment configuration directly.

The second iteration addressed a concurrency problem found during early testing: two customers purchasing the last available unit simultaneously could both succeed, resulting in overselling. The stock check and order creation were not atomic in the first implementation. Wrapping both operations in a Firestore transaction inside the Cloud Function resolved this — if the transaction detects insufficient `quantityRemaining`, it throws an error, the function returns a sold-out response, and the client disables the checkout button.

The third iteration corrected a gap in the QR pickup validation. The initial scanner confirmed that a QR code UUID existed in Firestore but did not verify that the vendor scanning the code was the same vendor who created the listing. A vendor at a different branch or store could theoretically confirm pickup for another vendor's order. Adding `vendorId == currentUser.uid` to the Firestore query in the scan handler closed this, ensuring a vendor can only mark pickup for their own listings.

The fourth iteration added full Vietnamese language support using react-i18next. Every user-visible string was moved to translation key references, with translation files covering all pages, error messages, status badges, form placeholders, and notification text. Language preference is saved to the user's Firestore profile on first set and loaded on login. The UI defaults to Vietnamese if the browser language is detected as Vietnamese.

The fifth iteration added the AI Box Composer, a vendor-facing feature powered by Google Gemini 2.0 Flash Lite through a Cloud Function called `composeMysteryBox`. The vendor enters a list of available surplus ingredients, and Gemini returns a suggested mystery box title, description, and price range. The vendor edits if needed and publishes with one click, reducing listing creation time from approximately three minutes to under 60 seconds.

The sixth iteration introduced a three-tier subscription system: Free, allowing 2 boxes per day; Pro at 99,000 VND per month, allowing 5; and Elite at 199,000 VND per month, allowing 8. Daily purchase limits are enforced inside the Cloud Functions — the `createCheckoutSession` function checks the customer's current-day order count against their plan limit before creating a Stripe session. The limit cannot be bypassed by manipulating the client.

The seventh iteration fixed a critical security issue identified during a code review session. User role assignment — vendor or customer — was happening on the client side during registration, meaning a user could manipulate the request to assign themselves any role. Moving role assignment to a callable Cloud Function called `createUserProfile` that sets the role using the authenticated Firebase UID removed this vulnerability. The client no longer writes the `role` field to Firestore directly.

### 4.3 App Features and Functionality

On the customer side, users register or log in using email and password or Google Sign-In, selecting their role at registration. The browse page displays active surplus listings with a category filter across ten categories — bakery, rice, noodles, drinks, snacks, fruit, vegetables, dairy, meat, and other — and real-time stock updates via Firestore `onSnapshot`. A daily box quota badge below the greeting shows how many purchases remain under the customer's current subscription plan, displayed in green when boxes remain, amber when one remains, and red when the limit is reached.

The listing detail page shows the original price, discounted price, calculated discount percentage, a food safety countdown from the vendor's packed-at timestamp, the pickup window, remaining stock, and a mystery box variant selector if the vendor has configured multiple box types. The daily quota is displayed again above the Buy Now button, and the button is disabled when the limit is reached. Purchases flow through Stripe Checkout, with daily limits enforced server-side before the session is created. After payment, a real-time order status tracker reflects the order moving from pending to paid via Firestore `onSnapshot`. The order detail page displays a QR code for the customer to show at pickup, and after pickup is confirmed, a box reveal card shows the assigned box contents. Customers can browse a vendor's public store page, manage their subscription plan, and opt in to push notifications for new listings from followed vendors.

On the vendor side, users register with a store name and log in to a dashboard showing revenue, active listing count, and pending pickup count, with Recharts line and bar analytics charts displayed in a lazy-loaded component. The listings management page supports creating, editing, and deleting surplus listings with Firebase Storage image upload and a live image preview. The AI Box Composer is accessible from the listings page and reduces the listing creation workflow to entering ingredients and reviewing the Gemini-generated suggestion before publishing. The food safety badge is configured by setting a packed-at time on the listing form, which becomes a live countdown on the customer-facing listing detail page. The vendor orders page shows incoming orders in real time. The QR scan page activates the device camera, reads the customer's QR code using html5-qrcode, validates `vendorId == currentUser.uid` in a Firestore query, and marks the order as picked up on a successful match. An analytics tab provides revenue trend and order volume charts. Vendors can also configure multiple box types per listing with a value-balanced distribution algorithm that assigns boxes to orders.

The technical infrastructure runs on Firebase Authentication for identity, Cloud Firestore for all data persistence with real-time listeners, Firebase Storage for listing images scoped per vendor, and Firebase Cloud Functions for all server-side logic. The deployed Cloud Functions are `createCheckoutSession`, `stripeWebhook`, `createUserProfile`, `composeMysteryBox`, `autoRefundExpiredOrders`, `createStripeSubscription`, `stripeSubscriptionWebhook`, `cancelSubscription`, `savePushToken`, and `onListingPublished`. Payments use Stripe Checkout and Stripe Subscriptions in test mode. The bilingual UI is managed by react-i18next with language preference persisted to Firestore. The frontend uses React Router v6 with role-based route guards and is styled with Tailwind CSS and shadcn/ui on a dark design system using slate backgrounds and indigo and purple accents.

### 4.4 Screenshots and Live Vercel URL

The GitHub repository is at https://github.com/Gnoltd/Final-PRJ-HSB3057E. The live Vercel URL will be updated once production environment variables are finalized — the application builds and deploys successfully; the remaining step is populating Firebase and Stripe production keys in the Vercel environment settings.

Full screenshot documentation is included in Appendix D. Key screens include the browse page with category filter chips and listing cards showing real-time stock and food safety timer badges; the listing detail page with discount percentage badge, food safety countdown, box variant selector, daily quota indicator, and Buy Now button; the Stripe-hosted checkout page in test mode; the order success page with box reveal card; the order detail page with QR code displayed as an SVG; the vendor dashboard with revenue and order trend charts; the AI Box Composer with ingredient input and Gemini-generated listing preview; the QR scan page with live camera feed and confirmation modal; and the subscriptions page with Free, Pro, and Elite plan cards showing daily box limits and upgrade options.

### 4.5 Reflection on Vibe Coding Experience

The vibe coding approach produced a functional, deployable application in approximately ten days. An application of this scope — separate user roles, real-time database, server-side payment processing, an AI-powered feature, push notifications, a bilingual interface, and a subscription system — would not have been buildable in this timeframe by a team with no prior experience in any of these individual technologies. That is the headline result and it is real.

The honest qualification is that generated code and production-ready code are not the same thing. The cases where the initial output was wrong were exactly the cases that matter most: the security-critical flows, the concurrency edge cases, and the cross-component dependencies that are not visible when reading each function in isolation. The stock decrement race condition was not in the initial output. The QR vendor validation gap was not in the initial output. The client-side role assignment vulnerability was not caught until a deliberate code review session. All three were fixed, but finding them required testing the application as someone trying to break it, not just someone following the intended user flow. That adversarial mindset does not come from the AI — it has to come from the developer.

The most productive development sessions were the ones where a problem was described precisely. "The vendor can scan any QR code, not just their own — fix it" produced a specific, correct fix. A vague prompt like "improve the QR scanner" would have produced cosmetic changes. The quality of the output is directly proportional to the quality of the problem description, and writing a precise problem description requires understanding what the problem actually is — which is a technical skill that no amount of AI assistance removes the need for.

One outcome that was genuinely unexpected: Claude identified the client-side role assignment security issue and flagged it without being asked. It also flagged the server-side checkout architecture issue before it was raised as a concern. On the cases where the output was wrong, the failure was in what was not generated — missing validation, missing ownership checks, missing atomicity. On the cases where the output was right, it was often right in ways that went beyond the literal request. The useful mental model for working with Claude in this way is not "AI that writes code for you" but "a very fast first-draft collaborator that gets the structure right and misses the edge cases, requiring a developer who understands both."

---

## 5. Recommendations and Reflection

### 5.1 Additional Digital Transformation Recommendations for FreshGarden

Two changes beyond MysteryBox would have meaningful impact at FreshGarden within the next six months without requiring significant budget or vendor involvement.

The first is demand forecasting using the data that already exists. Both branches maintain daily sales records in Google Sheets, though not consistently enough for reliable analysis. If the branch managers committed to logging prep quantities and actual sold quantities every day for 60 consecutive weekdays, the resulting dataset would be sufficient to identify which items and which days consistently generate surplus, how weather and proximity to university exam periods affect the Cầu Giấy lunch peak, and what minimum prep quantity covers the lunch rush without over-preparing for the evening. This does not require new software — it requires 15 minutes of consistent data entry per day and 30 minutes per week to review the pattern. Over two to three months, it would produce a prep guideline calibrated to actual demand rather than the manager's intuition, reducing the surplus that MysteryBox needs to redistribute in the first place.

The second is a digital loyalty program for frequent customers. Thirty-eight percent of surveyed customers visit weekly or more, and they currently receive no acknowledgment for this. A simple digital stamp card — one credit per visit, redeemed at the tenth visit for a free item — would increase return frequency in this segment. Technically, this requires only a QR code displayed at the counter that the customer scans to log their visit, backed by a lightweight database linking visit records to phone numbers or email addresses. The same system would give FreshGarden the customer contact data needed to send direct push notifications for end-of-day MysteryBox offers, creating a direct channel that Instagram and word-of-mouth cannot replicate.

### 5.2 Implementation Considerations

MysteryBox's infrastructure costs at FreshGarden's current volume are effectively zero at the outset. Firebase Spark's free tier covers authentication, Firestore reads and writes, and Cloud Functions invocations well within the free limits for two branches at current customer volumes. Firebase Storage for listing images stays within free limits at low usage. Stripe processes payments at 1.5% plus a fixed fee per transaction — for a typical MysteryBox order of 60,000 VND, this is approximately 2,700 VND per purchase, which the vendor can absorb or pass to the customer. At ten surplus orders per evening across two branches, the monthly Stripe cost would be under 100,000 VND. MoMo and VietQR have comparable or lower transaction fees and can be integrated in a production version through their respective partner APIs.

In terms of timeline, the application is functional in test mode today. Moving to production requires populating Firebase and Stripe production API keys, registering the Stripe webhook endpoint in the Stripe Dashboard, and deploying Firestore rules and indexes — a process that takes approximately two to three hours following the documented checklist. Adding native VietQR and Momo payment support would take two to three weeks of additional development. A digital loyalty stamp system, if pursued, would take three to four weeks. A multi-branch vendor dashboard consolidating the two FreshGarden locations would take two to three weeks.

Staff training requirements are minimal by design. Creating a surplus listing takes under two minutes: log in, tap New Listing, enter a title or use the AI Composer to generate one from available ingredients, set a price, set a quantity, upload a photo, and set the pickup window. The QR scanner for pickup confirmation requires no additional training — the vendor opens the scan page and points the device camera at the customer's QR code. Branch manager onboarding can be completed in a 15–20 minute walkthrough on a real device. No changes to kitchen operations or existing POS workflows are required.

### 5.3 Future Development Roadmap for the App

Several features that are designed and partially scaffolded would increase the app's usefulness in a commercial deployment. Native VietQR and Momo payment integration is the most urgent, given that 79% of FreshGarden's customers use one of these two methods as their primary payment option. The VNPAY integration is already scaffolded in the codebase via a `createVNPayOrder` Cloud Function. Momo requires business registration and API approval, which would be the first external step in a commercial deployment process.

A waste-tracking dashboard view for vendors would close the feedback loop between using the app and changing operational behavior. The current analytics tab shows revenue and order volume; a waste-specific view would show boxes created versus sold per day, estimated VND value recovered versus discarded, and recovery rate trends over time. This gives vendors data to gradually adjust prep quantities, reducing surplus upstream rather than only redistributing it downstream.

Improved push notification targeting would increase conversion from notification to purchase. Currently, customers who follow a vendor receive an alert for every new listing. A more useful system would allow filtering by category and time of day, so a customer who only wants bakery items near closing time gets relevant alerts rather than notifications for every category the vendor lists.

Multi-branch vendor support would allow FreshGarden's owner to view both branches from a single dashboard — aggregate revenue, combined pending pickups, and the ability to manage listings at either branch without switching accounts. Post-pickup feedback, collected as a one-question rating after the order is marked picked up, would build the review data that increases trust for future customers browsing listings.

### 5.4 Team Reflection on Learning Outcomes

The field observation at FreshGarden produced the most useful insight of the entire project, and it was not visible in any data source. Watching 11 prepared grain bowls get moved from the display counter to a bin at 8:20 PM at the Hoàn Kiếm branch made the problem concrete in a way that reading about Vietnamese F&B food waste statistics does not. The observation methodology forced genuine engagement with the operational reality of the business, and the conversations with kitchen staff — particularly the point about the asymmetry of consequences between running out at lunch and wasting at closing time — produced a framing of the problem that shaped the design of MysteryBox in ways the survey data alone would not have.

The survey design taught a practical distinction between attitude questions and behavior questions. "Would you use a surplus food app?" tells you the size of the potential market. "What would make you hesitant?" tells you what the app needs to address in order to actually reach that market. The trust concern about mystery box contents — voiced by 31 respondents in some form — was not predictable from the demographic data and directly shaped the decision to add food safety countdown badges, packed-at timestamps, and transparent pickup windows to the listing detail page.

The vibe coding experience confirmed that the technology barrier to building something functional has dropped significantly. What took months now takes days, and the constraint has shifted from "can we build this" to "do we understand the problem well enough to describe it precisely and test the result rigorously." Both of those require domain knowledge and critical thinking that are distinct from the ability to write code. The security issues — client-side role assignment, QR vendor validation — were not caught by reading the output. They were caught by trying to break the application as a hostile user. That kind of testing is a skill, and it is one the team developed through the process of building and breaking this application.

The Too Good To Go comparison grounded the project in a way that was particularly useful early on. Knowing that a company had already validated the market — 80 million users, 350 million meals saved, 17 countries — meant the team was not building toward a hypothesis. The design questions that remained were the ones that actually matter for Vietnam: what payment methods work, how the Vietnamese language shapes the user experience, how small Hanoi F&B businesses with informal operations can be onboarded without requiring them to change how they work. Those are harder questions than "does the concept work," and they are more interesting ones.

---

## 6. Appendices

### Appendix A: Survey Instrument

**MysteryBox Customer Survey — FreshGarden (English version)**

The following ten questions were used for the customer survey conducted at both FreshGarden branches and distributed via Instagram Stories.

Question 1 asked respondents to indicate their age group, with options for under 18, 18–24, 25–34, 35–44, and 45 or older.

Question 2 asked for primary occupation, with options for student, employed full-time, employed part-time, self-employed, and other.

Question 3 asked how often the respondent visits FreshGarden, with options for weekly or more, two to three times per month, once a month, and less than once a month.

Question 4 asked which payment method the respondent uses most often at FreshGarden, with options for cash, VietQR bank transfer, Momo, ZaloPay, bank card, and other.

Question 5 asked whether the respondent knows if FreshGarden offers discounted food near closing time, with yes or no options.

Question 6 asked whether the respondent has ever purchased discounted end-of-day food from any restaurant, with yes or no options.

Question 7 asked what percentage discount would motivate the respondent to make a special trip to collect food near closing time, with options for under 20%, 20–39%, 40–59%, 60% or more, and I would not make a special trip regardless of discount.

Question 8 asked whether the respondent would use a mobile app that lets them buy discounted end-of-day food from restaurants they already visit, with options for yes definitely, probably yes, probably not, and no.

Question 9 asked what would make the respondent hesitant to use such an app, as an open text field.

Question 10 invited any other comments, as an open text field.

---

**Phiên bản tiếng Việt — Khảo sát khách hàng MysteryBox tại FreshGarden**

Câu 1: Bạn bao nhiêu tuổi? (Dưới 18 / 18–24 / 25–34 / 35–44 / 45 trở lên)

Câu 2: Nghề nghiệp chính của bạn là gì? (Học sinh / Sinh viên / Nhân viên toàn thời gian / Nhân viên bán thời gian / Tự kinh doanh / Khác)

Câu 3: Bạn đến FreshGarden bao lâu một lần? (Hàng tuần hoặc thường xuyên hơn / 2–3 lần mỗi tháng / Một lần mỗi tháng / Ít hơn một lần mỗi tháng)

Câu 4: Bạn thường thanh toán bằng phương thức nào tại FreshGarden? (Tiền mặt / Chuyển khoản VietQR / Momo / ZaloPay / Thẻ ngân hàng / Khác)

Câu 5: Bạn có biết FreshGarden có bán đồ ăn giảm giá vào cuối ngày không? (Có / Không)

Câu 6: Bạn đã từng mua đồ ăn giảm giá cuối ngày từ bất kỳ nhà hàng nào chưa? (Rồi / Chưa)

Câu 7: Mức giảm giá nào sẽ khiến bạn chủ động đến lấy đồ ăn vào cuối ngày? (Dưới 20% / 20–39% / 40–59% / 60% trở lên / Tôi sẽ không đi dù giảm bao nhiêu)

Câu 8: Bạn có sử dụng ứng dụng cho phép mua đồ ăn giảm giá cuối ngày từ các quán ăn bạn thường ghé không? (Chắc chắn có / Có thể có / Có thể không / Không)

Câu 9: Điều gì khiến bạn ngần ngại khi dùng ứng dụng như vậy? (Trả lời tự do)

Câu 10: Góp ý khác? (Trả lời tự do)

---

### Appendix B: Interview Transcripts and Notes

**Interview 1 — Hoàn Kiếm Branch Manager**
Date: June 2026. Duration: approximately 30 minutes. Location: branch back office after closing.

The interviewer opened by asking the manager to estimate how much food the branch typically discards each evening. She said the amount varies by day — Monday and rainy days are consistently the worst, with losses she estimated at 300,000–350,000 VND, while a busy day might see only 150,000 VND discarded. The items most often wasted are pre-assembled salads and grain bowls prepared in the morning batch that do not sell through the afternoon and evening. She had never calculated a monthly total, but when prompted, put the figure at around 4–5 million VND.

Asked about current mechanisms to address surplus, she said there are none in any formal sense. She occasionally posts on Instagram when a large amount remains, but acknowledged that timing makes this ineffective — by the time a follower sees the post and travels to the branch, it is usually closed or the items are gone. She added that posting about leftovers repeatedly feels inconsistent with the brand's positioning. If a regular customer happens to come in around 7:30 PM, she mentions that things are available at a discount, but this catches at most two or three people on a given evening.

The manager was asked what an ideal tool would look like. She described something that lets her post a quick availability notice — for example, ten bowls left at half price, pickup before 8:30 PM — with customers able to see it and pay in advance so she knows how many to set aside. Her primary concern was the scenario where she posts a listing and a last-minute counter rush sells the items before the app customer arrives. She wanted to be able to cancel or adjust a listing easily in that case. The 90-minute pre-closing listing window with a defined pickup deadline, which is the default in MysteryBox, maps directly to the workflow she described.

**Interview 2 — Cầu Giấy Branch Manager**
Date: June 2026. Duration: approximately 25 minutes. Location: branch seating area between lunch and dinner shift.

The Cầu Giấy manager opened with an observation that his branch has two distinct problems that look similar but are actually separate. The lunch problem — selling out popular bowls before 1:15 PM — is a demand-exceeds-supply issue and cannot be solved by any app. The evening problem — demand dropping after 7:00 PM and leaving prep unsold — is a visibility and channel issue that can be addressed. He described the student population from HUST and nearby universities as the most promising audience for a surplus offer, characterizing them as price-sensitive, digitally active, and physically close to the branch. His formulation was concise: "If I could tell them there are 8 bowls left at half price, they would come. I just have no way to tell them right now."

He asked specifically about payment method support, noting that most of his student customers pay via Momo or VietQR rather than bank card. He said that if the app required a bank card, a meaningful share of his student base simply would not use it. This confirmed the priority of adding native VietQR and Momo support in the production version.

When asked what would determine whether he kept using a new tool after trying it, he was straightforward: if he created five listings and no one came, he would stop. The tool needs to deliver visible results within the first few uses to build the habit. He suggested that for the first few weeks, it might help for the app to notify a small group of opted-in regulars directly rather than relying on browse-and-discover alone.

**Interview 3 — Senior Kitchen Staff, Cầu Giấy**
Date: June 2026. Duration: approximately 15 minutes. Location: kitchen prep area before evening shift.

The kitchen staff member was asked to describe how prep quantities are decided each day. He explained that the manager sets the quantities the night before based on the previous day's sales — if the chicken bowl sold out, more is made the next day; if grain bowls were left over, fewer are made. The decision is based entirely on experience and memory, not on any written data or trend analysis.

The interviewer asked why the kitchen does not simply prepare less to reduce waste. His answer was blunt: if they prepare less and sell out at lunch, customers complain and sometimes post on Google Reviews. If they waste 10 bowls at closing time, nothing happens to anyone. The asymmetry is structural. He added that this is not a decision anyone has formally made — it is just how things work, because the consequences of the two outcomes are not symmetric.

He was asked whether logging a packed-at time for each batch would be feasible operationally, given that food safety countdown badges would use this data. He said yes, as long as the action is simple — typing a time into an app or scanning something. He noted that some items already have a handwritten time on the container for food safety compliance purposes, so the concept is not new.

---

### Appendix C: Power BI Dashboard Export

The full Power BI dashboard is included as a separate .pbix file attachment. PDF exports of all five dashboard pages are also included.

Page 1 presents respondent demographics as a stacked bar chart showing age group distribution split by visit frequency. It establishes that the 18–24 cohort is both the largest and the most loyal segment, with 42% of that group visiting weekly or more.

Page 2 presents payment method distribution as a donut chart. VietQR leads at 52%, Momo at 27%, cash at 14%, and card at 7%. This page provides the data context for why native VietQR and Momo support is a production priority.

Page 3 places the awareness and willingness gap side by side in a comparative bar chart. It shows 91% of respondents unaware of end-of-day discounts alongside 68% of 18–34-year-olds willing to use a surplus app, making the scale of the untapped market visible at a glance.

Page 4 shows discount sensitivity as a histogram. It confirms that 40–59% off is the sweet spot that motivates the majority of respondents without requiring a discount level that would make the offer financially unviable for the vendor.

Page 5 presents the problem prioritization matrix as a ranked horizontal bar chart, combining open-text survey response frequency with interview coding. End-of-day surplus waste leads by a significant margin.

Data sources for the dashboard: 87-response Google Form export in CSV format, interview notes coded thematically into five problem categories, and secondary data from the FAO 2022 Vietnam assessment and the VFBA 2023 report for market context panels on pages 3 and 5.

---

### Appendix D: App Screenshots

Full screenshots are included as a separate image folder in the submission package. The following screens are documented.

The browse page shows the dark slate layout with indigo and purple gradient header, category filter chips scrollable across the top, listing cards with real-time stock indicators and food safety timer badges, and the daily box quota badge below the greeting text.

The listing detail page shows the discount percentage badge in the listing header, the food safety countdown from packed-at time, the box variant selector cell positioned beside the category field, the daily quota remaining line above the Buy Now button, and the button's disabled state when the limit is reached.

The Stripe-hosted checkout page is shown in test mode with the card number 4242 4242 4242 4242 entered.

The order success page shows the box reveal card displaying the assigned box type and its contents.

The order detail page shows the QR code rendered as an SVG with the order status badge and pickup window displayed below.

The vendor dashboard shows the three stat cards for revenue, active listings, and pending pickups, and the RevenueChart component loaded below via React lazy loading.

The AI Box Composer shows the ingredient input list on the left and the Gemini-generated listing preview on the right, with the Publish button at the bottom.

The QR scan page shows the live camera feed inside the scan container and the confirmation modal that appears after a successful scan.

The subscriptions page shows the three plan cards — Free, Pro, and Elite — each with their daily box limit, monthly price, and the current plan indicator.

---

### Appendix E: App Development Prompt History

The following is a representative selection of the prompts used during the development sessions. The full commit history is available at https://github.com/Gnoltd/Final-PRJ-HSB3057E.

Session 1 (June 17): "Build a web app where F&B vendors list end-of-day surplus food as mystery boxes. Customers browse, pay via Stripe, and pick up with a QR code. Stack: React + Vite + TypeScript + Firebase + Stripe. Dark modern UI. Support English and Vietnamese."

Session 3: "The Stripe session is created on the client. That is a security problem — anyone can manipulate the price. Move session creation to a Firebase Cloud Function. The function should check stock availability before creating the session and create a pending order in Firestore."

Session 5: "Two customers buying the last unit simultaneously both succeed. I need to prevent overselling. Wrap the stock check and order creation in a Firestore transaction. If the transaction fails due to insufficient stock, return an error to the client."

Session 7: "The QR scanner validates that the code exists in Firestore but does not check that the vendor doing the scanning owns the order. Add vendorId equals currentUser.uid to the Firestore query in the scan handler."

Session 10: "Add full Vietnamese language support using react-i18next. All user-visible strings should use t-key with no hardcoded text in components. Save language preference to Firestore. Translation files should cover all pages, error messages, status badges, and notifications."

Session 12: "Add a vendor feature: the vendor enters a list of available surplus ingredients. A Gemini Cloud Function returns a suggested mystery box title, description, and price. The vendor edits and publishes with one click. Use Gemini 2.0 Flash Lite."

Session 16: "Add a subscription system: Free for 2 boxes per day, Pro at 99,000 VND per month for 5 boxes, Elite at 199,000 VND per month for 8 boxes. Enforce daily purchase limits server-side inside the checkout Cloud Function. Use Stripe for recurring payments with a separate subscription webhook."

Session 22: "Role assignment happens on the client side during registration. A user can manipulate the request to assign themselves vendor role. Move role assignment to a callable Cloud Function that reads the role from the request but validates and writes using the Firebase auth UID. The client should never write the role field directly."

Session 24: "Show customers their daily box quota on the browse page and listing detail page. A badge should be green when boxes remain, amber when one remains, red when the limit is reached. Use a real-time hook that counts today's paid orders from Firestore. Filter client-side to avoid requiring a new Firestore composite index."

---

### Appendix F: Vendor Quotations

No external vendor quotations were obtained for this project. All infrastructure used in the prototype — Firebase, Stripe test mode, Vercel, and Gemini API — is available at zero cost for development-level usage. Cost estimates for production deployment are documented in Section 5.2 of this report, based on published pricing from Firebase (https://firebase.google.com/pricing), Stripe (https://stripe.com/en-vn/pricing), and Google Gemini API (https://ai.google.dev/pricing).

---

### Appendix G: Team Member Contributions

The venue observation across both FreshGarden branches, including the FoH and BoH documentation and the TIHO problem classification, was led by the first team member. Survey design, survey administration across both branches and the Instagram channel, interview note-taking, and secondary data research were the primary responsibility of the second team member. The Power BI dashboard design, data analysis, and visualization work were led by the third team member. App development covering the customer-facing flow, Stripe Checkout and subscription integration, and the i18n implementation was led by the fourth team member. App development covering the vendor-facing flow, Cloud Functions, QR scanner, and AI Box Composer was led by the fifth team member. All team members contributed to the writing and editing of the final report.

---

*Report length excluding appendices: approximately 6,800 words.*
*Total including appendices: approximately 9,100 words.*
*Submitted in partial fulfillment of HSB3057E requirements, Hanoi School of Business and Management, June 2026.*
