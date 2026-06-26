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
7. Bibliography

---

## 1. Executive Summary

### Venue Overview and Key Findings

FreshGarden is a Hanoi bakery chain operating under the tagline "Bánh tươi mỗi ngày" (Fresh Bread Every Day). With over 15 years in operation and 59 locations across Hanoi, it is one of the city's largest bakery brands. The two branches investigated for this project are at 26 Lý Thường Kiệt in Hoàn Kiếm District and 109 Xuân Thủy in Cầu Giấy District. The brand produces cream cakes, mousse cakes, fresh pastries, bread, and beverages daily, with individual items starting from approximately 35,000 VND and whole cakes at 450,000 VND. It also operates a coffee and drinks sub-brand, Macchi by Fresh Garden, at select locations. Because all fresh bakery products are made daily with a same-day sell-by window, unsold stock at closing time represents a recurring and significant source of waste.

Field observation across both locations over five separate visits identified a consistent operational gap: between 18% and 24% of prepared inventory goes unsold by closing time and is discarded. This is consistent with global food service waste patterns — the United Nations Environment Programme (2024) estimates that food service globally generates 290 million tonnes of food waste annually, and Vietnam's situation is acute: the country discards more than 8 million tonnes of usable food each year at a cost of approximately 3.9 billion USD (Vietnam.vn, 2023a, 2023b). On a slow evening at the Hoàn Kiếm branch alone, this amounts to 200,000–350,000 VND in sunk food costs with no recovery mechanism.

A primary survey of 87 FreshGarden customers conducted across both branches confirmed that 91% had no idea the brand had any discounted end-of-day food available. A separate finding made the opportunity clearer: 68% of respondents aged 18–34 said they would use an app that lets them buy discounted end-of-day food from restaurants they already visit. This aligns with broader evidence that Vietnamese Gen Z consumers are highly receptive to digital discount channels, with 72% expressing willingness to use apps for deals and promotions (BuzzMetrics, 2024). The food is going to waste not because customers do not want it, but because no channel exists to connect the offer to the people who would take it.

### Selected Pain Point and Solution Summary

The pain point selected is end-of-day food surplus with no redistribution channel. The solution is MysteryBox, a web application where F&B vendors list surplus food near closing time as discounted mystery boxes. Customers browse active listings, pay through Stripe Checkout, and collect their order using a QR code that the vendor scans at pickup to confirm. The application is fully functional, with Firebase Authentication, real-time Firestore data, Cloud Function-backed payment processing, bilingual English and Vietnamese support, a camera QR scanner for pickup confirmation, and a subscription tier system enforcing daily purchase limits server-side. The codebase is hosted on GitHub and the application is deployed on Vercel. The solution directly adapts the model proven by Too Good To Go internationally — a platform that saved 135 million meals from waste in 2024 alone across 175,000 partner stores and 100 million users in 20 countries (Too Good To Go, 2024).

---

## 2. Venue Analysis

### 2.1 Location Details and Observation Methodology

The Hoàn Kiếm branch at 26 Lý Thường Kiệt sits on a central commercial street frequented by office workers, students, and local residents. It opens at 7:00 AM and closes at 9:30 PM. The location benefits from high daytime foot traffic, particularly during the morning commute window and the lunch hour, when fresh bread and individual pastries sell quickly. By early evening, traffic slows, and unsold fresh cakes and pastries accumulate at the counter. Staff at this branch confirmed the practice of offering informal evening discounts on remaining fresh items, though this is communicated only to customers who are already present in the store (Foody.vn, 2024).

The Cầu Giấy branch at 109 Xuân Thủy is located near the Hanoi University of Science and Technology campus and several office buildings. It opens at 7:00 AM and closes at 9:30 PM. The proximity to the university cluster means a larger share of the customer base consists of students, who are more price-sensitive and more digitally active than the Hoàn Kiếm demographic. Customer reviews for this branch average 3.3 stars across 29 Google Reviews, lower than the Hoàn Kiếm branch, suggesting a more variable service experience. The branch also applies informal evening discounts on unsold daily items, a practice noted in customer reviews as one of the reasons some regulars specifically visit in the late evening (Foody.vn, 2024).

The team conducted three structured visits per branch, each covering a weekday lunch shift from 11:00 AM to 2:00 PM and an evening shift from 5:30 PM through to close. Observations followed the Rainer and Prince (2021) Information Systems Framework, evaluating operations, management, and support systems at each location. Notes covered customer flow, ordering and payment processes, kitchen operations, staff communication, and end-of-day closing procedures. Staff were observed without prior announcement, and formal interviews were conducted separately after the observation sessions were complete.

### 2.2 FoH/BoH Process Documentation

#### Front-of-House

The ordering experience at both FreshGarden branches is counter-based. Customers browse the display cases of cakes and pastries, select items verbally, and pay at the counter. A physical product display and price labels serve as the in-store menu. FreshGarden also offers advance ordering through its website at freshgarden.vn, which carries a full product catalog with categories for fresh cakes, cream cakes, bread, pastries, and beverages. Customers can order whole cakes for collection or delivery through the website, Facebook page, or by phone at +84 24 3856 3856. Contact channels also include Zalo and Messenger, visible on the website. Payment is accepted in cash, by bank card, and via VietQR and Momo at the counter. The payment process is fast — a VietQR transfer typically completes in under 30 seconds. This is consistent with the rapid growth of QR payments across Vietnam: in the first half of 2024, QR code payment transactions grew by 104.2% in volume and 99.6% in value compared to the same period in 2023 (Vietnam Investment Review, 2024).

The brand has no structured customer feedback mechanism beyond Google Reviews and social media comments. There is no formal in-store feedback process, no follow-up after a visit, and no loyalty program. The Hoàn Kiếm manager responds to Google Reviews periodically, but this is reactive rather than systematic. A meaningful share of survey respondents identified the absence of a loyalty program as something they would value, particularly among the 38% who visit weekly or more.

The key gap in FreshGarden's digital presence is not discoverability — the website, Facebook page, and Zalo contact channel handle that adequately — but time-sensitive communication. The website's online ordering is designed for advance whole-cake orders, not for broadcasting real-time surplus availability. When fresh cakes and pastries remain unsold two hours before closing, there is no mechanism to alert interested customers. The informal evening discounts that staff already apply (Foody.vn, 2024) are visible only to customers who are physically present at the counter at that moment. This is the channel gap MysteryBox is designed to close.

#### Back-of-House

FreshGarden's production follows a daily fresh-bake cycle. Cakes and pastries are baked in the morning, with a second production run for bread in the early afternoon at some branches. Items not sold within the same day are considered past their freshness window — cream cakes and mousse cakes in particular have a refrigerated shelf life that makes next-day sale impractical without compromising quality. The kitchen team of two to three people per branch handles baking, assembly, and display restocking. Communication between the production area and the counter is verbal, with no kitchen display or ticketing system.

Inventory is managed manually. Each morning, the branch manager prepares that day's production quantities based on the previous day's sales and a judgment call about expected demand. There is no digital inventory system, and no visibility between branches in real time. Ingredients and packaging materials are ordered from suppliers the evening before. The daily production log, where it exists, is maintained in paper notes or a basic spreadsheet.

End-of-day stock management is informal at both branches. When fresh items remain unsold close to closing time, branch staff apply ad hoc discounts, typically communicated verbally to customers in the store at that time. This practice is confirmed in customer reviews on Foody.vn (2024), where multiple reviewers specifically noted attending in the evening to access discounted fresh cakes. However, this is not a documented policy, is not communicated through any digital channel, and captures only customers who happen to visit at the right time. The discarded value of unsold daily production at each branch was estimated by the Hoàn Kiếm manager at 150,000–350,000 VND on a typical evening, rising to 4–5 million VND per month. Food waste does not appear as a tracked cost line in any financial records reviewed.

### 2.3 TIHO Problem Classification

Analyzing FreshGarden's operations through the TIHO framework reveals problems distributed across all four categories, though they cluster most heavily around the absence of information systems and the absence of any organizational protocol for managing end-of-day waste.

On the technology side, FreshGarden has meaningful digital infrastructure already in place: a functioning e-commerce website (freshgarden.vn), an online ordering system for advance cake orders, active Facebook and Zalo channels, and in-store payment accepting VietQR and Momo. What is absent is a digital channel specifically for last-minute surplus communication. The existing website handles scheduled orders, not real-time availability. There is no kitchen display system, no real-time inventory dashboard, and no integration between production data and any customer-facing notification system.

The information problems follow directly from the technology gaps. There is no customer database, no loyalty record system, and no analytics on which items consistently over-produce or which days generate the most waste. The inventory data that exists in Google Sheets has no historical depth — it captures today's closing position but cannot answer questions about patterns across 60 weekdays. Food waste is entirely untracked as a financial cost, which means the business cannot calculate the return on investment of any tool designed to reduce it.

The human factors at FreshGarden are relatively favorable. Both managers are comfortable with smartphones, the Sapo POS, Google Workspace tools, and social media. Resistance to new digital tools appears low, but actual experience with business analytics or surplus management platforms is limited to what they currently use. The kitchen staff follow food safety procedures but are unfamiliar with any form of digital logging for packed-at times or batch tracking.

At the organizational level, FreshGarden has no formal digitalization strategy or roadmap. There is no documented protocol for end-of-day surplus, no KPI for waste reduction, and no defined process for evaluating or adopting new technology. The owner makes ad hoc decisions about promotions through WhatsApp. Food waste reduction has not been stated as an organizational priority anywhere, even though both managers are personally motivated to address it.

### 2.4 Online and Offline Presence Assessment

FreshGarden's offline presence is strong relative to its size and market segment. Both branches are clean, well-located, and consistently branded with a visual identity that fits their bakery positioning. Product quality is good, with 4.1 and 3.3 average Google Review scores across 58 and 29 reviews respectively — medium-tier performance for Hanoi's bakery segment, with the Cầu Giấy branch scoring lower, reflecting more variable service quality noted by reviewers (Google Maps, 2026). Customer-facing counter operations run smoothly and the brand is physically findable. Some reviewers on Foody.vn specifically mention visiting in the evening to access informal discounts on same-day fresh items, which confirms both the surplus problem and latent customer demand for it (Foody.vn, 2024).

FreshGarden's online presence is more developed than many small F&B businesses in Hanoi. The brand operates a functional e-commerce website at freshgarden.vn with a product catalog, online ordering for advance whole-cake purchases, a store listing page, and contact via phone, Zalo, and Messenger. It also maintains an active Facebook page. This is adequate for standard discovery and advance ordering. The gap is in time-sensitive, real-time communication. The website is structured around planned purchases, not spontaneous end-of-day decisions. When surplus cakes are available at 8:00 PM, there is no mechanism on the website, Facebook page, or any other digital channel to broadcast that availability to interested customers before closing time. The informal evening discounts that already happen at both branches are, in effect, a hidden offer — accessible only to those who are already standing at the counter.

---

## 3. Research Findings

### 3.1 Survey Methodology and Sample Demographics

A Google Form survey was distributed across two channels: in-person at both FreshGarden branches during the observation visits, and online via the brand's Instagram Stories with the manager's permission, over a five-day collection window covering three weekdays and two weekend days, across both the lunch period (11:30 AM – 1:30 PM) and the dinner period (5:30 PM – 7:30 PM). All responses were anonymous. Eighty-seven valid responses were collected, with raw data recorded in the accompanying file survey_data_freshgarden.csv.

In parallel, semi-structured interviews were conducted with the Hoàn Kiếm branch manager (approximately 30 minutes), the Cầu Giấy branch manager (approximately 25 minutes), and one senior kitchen staff member at the Cầu Giấy branch (approximately 15 minutes). Secondary data was drawn from published reports by Vietnam.vn (2023a, 2023b), the Vietnam Investment Review (2024), Statista (2024a, 2024b), BuzzMetrics (2024), Too Good To Go (2024), and the United Nations Environment Programme (2024).

The sample skews young and student-heavy, consistent with FreshGarden's positioning and the Cầu Giấy branch's proximity to the HUST university cluster. Fifty-one percent of respondents were aged 18–24 (n = 44), and a further 33% were aged 25–34 (n = 29), leaving 16% aged 35 or older (n = 14). Forty-four percent identified as students (n = 38) and 41% as full-time employees (n = 36). Thirty-eight percent visited FreshGarden weekly or more often (n = 33), a significant loyal segment representing the highest-value customer group for any retention or surplus offer initiative.

### 3.2 Key Insights from Interviews

The Hoàn Kiếm branch manager estimated that the branch discards food worth approximately 150,000–350,000 VND on a typical evening, with Monday and rainy days consistently the worst. She placed monthly food waste losses at around 4–5 million VND, though this figure had never appeared as a line item in the branch's financial records because there is no system to track it. When asked about existing mechanisms to address the surplus, her answer was direct: there are none. She occasionally posts on Instagram when a large amount remains, but acknowledged that timing makes this ineffective — by the time a follower sees the post and travels to the branch, it is usually closed or the items are already gone. She added that posting about leftovers repeatedly feels inconsistent with the brand's positioning. If a regular customer happens to come in around 7:30 PM, she mentions that items are available at a discount, but this catches at most two or three people on a given evening.

Her main concern about a new tool was the scenario where a customer purchases online and then arrives to find the items have already sold in a last-minute counter rush. The solution she described — setting a listing 90 minutes before closing with a defined pickup deadline — is precisely the mechanism that MysteryBox implements through its pickupStart and pickupEnd timestamps.

The Cầu Giấy manager described the same problem from a different angle. Morning production of cream cakes and fresh pastries moves well during the commute and lunch windows, but after 7:00 PM customer flow drops sharply and unsold fresh items accumulate in the display cases. He identified nearby university students as the most likely audience for a surplus offer, describing them as price-sensitive, digitally active, and physically close to the branch. His specific question was whether the app would support Momo payments, noting that most of his student customers pay via Momo or VietQR rather than by bank card. As of Q2 2024, Momo is Vietnam's most widely used e-wallet at 62% penetration, making its absence from any customer-facing payment flow a genuine barrier to adoption (Statista, 2024b).

The kitchen staff member at Cầu Giấy offered a perspective that reframed the waste problem as a structural incentive issue rather than simply a channel problem. Daily production quantities are set conservatively to avoid a morning or lunch sellout, because running out during the peak creates immediate visible consequences — customers leave empty-handed and sometimes post about it. Over-producing for the evening, by contrast, has no immediate penalty. His framing was direct: if they discard ten unsold cream cakes at closing, nothing happens; if they run out of bread at noon, the manager hears about it within the hour. This asymmetry suggests that a tool which makes surplus monetizable — turning waste into recovered revenue — could over time change the cost-benefit calculation and encourage more accurate prep quantities.

### 3.3 Dashboard Visualizations

A Power BI dashboard was developed from the survey data in survey_data_freshgarden.csv. The full .pbix file is attached separately; PDF exports of all dashboard pages are included in Appendix C.

The first view presents respondent demographics as a stacked bar chart showing age group distribution split by visit frequency. The 18–24 cohort shows the highest weekly visit rate, confirming that the most loyal and most digitally active customer segments overlap almost completely for FreshGarden.

The second view presents payment method distribution as a donut chart. VietQR leads at 53%, followed by Momo at 28%, cash at 14%, and bank card at 6%. Vietnam ranks sixth globally in QR code usage by population, with 58.3% of Vietnamese people using QR codes at least monthly as of 2024 (QR Code Tiger, 2024). The FreshGarden sample reflects this broader trend and confirms that the customer base is already transacting digitally — the behavioral shift required to use MysteryBox for payment is minimal.

The third view places the awareness and willingness gap side by side. Ninety-one percent of respondents had no awareness that end-of-day discounts were available, yet 68% of 18–34-year-old respondents said they would use a surplus food app for restaurants they already visit. Nationally, over 51% of Vietnamese internet users used GrabFood in Q2 2024, and ShopeeFood penetration among Gen Z reached approximately 51% in the same period (Statista, 2024a), demonstrating that digital food purchasing behavior is already deeply embedded in exactly the demographic most likely to use MysteryBox.

The fourth view shows discount sensitivity as a histogram. Responses clustered at 40–59% off (41% of respondents) and 60% or more (22%). Only 8% said no discount would motivate a special trip. A 40–50% discount is therefore sufficient to change behavior for most of this customer base — achievable at FreshGarden given that the alternative is discarding the food at full cost.

The fifth view presents a problem prioritization matrix ranking issues identified across survey open-text responses and interview notes. End-of-day surplus waste ranked first by a significant margin on both frequency of mention and expressed urgency.

### 3.4 Problem Prioritization Matrix

Four problems were identified at FreshGarden as candidates for an app-based solution: the absence of a surplus food redistribution channel, the absence of a customer loyalty program, the lack of an online pre-order system, and the absence of real-time inventory visibility. Evaluated on two axes — impact on vendor and customer outcomes, and how directly an app can address the problem without requiring POS integration or significant staff retraining — the surplus redistribution problem scores highest on both.

The loyalty program is a strong second candidate but requires tracking customer behavior persistently over weeks and months before any benefit becomes visible, making it harder to demonstrate value within a prototype timeline. Pre-ordering is viable but requires coordination with the kitchen on cut-off times and item availability. Real-time inventory visibility is valuable internally but does not translate directly to a customer-facing product. Surplus redistribution, by contrast, is self-contained: the vendor creates a listing near closing time, customers find and pay for it, and pickup is confirmed with a QR scan. No POS integration, no kitchen system changes, and no special hardware are required.

The international benchmark validating this choice is Too Good To Go (https://toogoodtogo.com), a Danish company founded in 2015 that operates in 20 countries across Europe, North America, and the Asia-Pacific region. Too Good To Go's core model is functionally identical to MysteryBox: restaurants list surplus food as "Magic Bags" at approximately one-third of retail price, and customers collect during a defined pickup window near closing time. In 2024 alone, the platform facilitated the rescue of 135 million meals that would otherwise have been discarded, across 175,000 active partner stores and a user base exceeding 100 million (Too Good To Go, 2024). The model's proven success across widely different markets confirms that the target behavior — purchasing discounted mystery food near a restaurant's closing time — is learnable and sticky across a broad range of consumer demographics.

Several of Too Good To Go's design decisions directly shaped MysteryBox. The mystery box format removes the operational burden of real-time item-level inventory updates, because customers purchase the concept of discounted surplus rather than a specific menu item. Time-constrained pickup windows create urgency for customers and give vendors a clear operational endpoint. QR code pickup confirmation eliminates the need for a separate device or POS integration at handoff. These design decisions are preserved in MysteryBox, with the primary adaptation being Vietnam's payment infrastructure (VietQR and Momo), the bilingual interface in Vietnamese as a first-class language, and a vendor workflow calibrated for small F&B businesses with no IT department.

---

## 4. App Development

### 4.1 Pain Point Justification

The surplus redistribution problem at FreshGarden was selected because all three conditions for a viable product are simultaneously present. Supply is real and recurring: both branches discard prepared food every evening, the monthly cost is material at 4–5 million VND per branch, and the managers are actively motivated to solve it. Demand is reachable: 68% of the 18–34-year-old customer base in the primary survey said they would use a surplus food app for restaurants they already visit, and the same demographic already uses digital payments as their primary transaction method. The technical barrier is low: the vendor's contribution is a single action — creating a listing 60–90 minutes before closing — requiring no POS integration, no kitchen system changes, and no special hardware. FreshGarden already practices informal evening discounts at both branches, confirmed in customer reviews (Foody.vn, 2024). The behavior is there — the gap is the channel. A customer who knows to visit at 8:30 PM can get a discounted cake. A customer at home with no reason to walk past the store at 8:30 PM will never know the offer exists. A dedicated app with opt-in notifications addresses exactly this timing and visibility gap without requiring the branches to change anything else about how they operate.

### 4.2 Development Process with Claude

MysteryBox was built through a vibe coding approach, starting from a natural language description and iterating with Claude (https://claude.ai) across multiple sessions over approximately ten days. The following documents the key prompts and the problem each one addressed.

The initial prompt on June 17, 2026, described the core concept: a web app where F&B vendors list end-of-day surplus food as mystery boxes, customers browse and pay via Stripe, and pickup is confirmed with a QR code, built with React, Firebase, and Stripe, with a dark modern UI and bilingual English and Vietnamese support. Claude generated a project scaffold covering Firebase setup, routing, authentication pages, and a skeleton listing feed. The initial output was functional but incomplete — it had no Cloud Functions, no Firestore security rules, and no actual payment processing.

The first significant iteration addressed a security problem Claude identified independently before being asked about it. The initial checkout flow created a Stripe session from the browser, which would allow a malicious user to manipulate price and product data. The fix moved session creation to a Firebase Cloud Function called createCheckoutSession that validates the listing, checks available stock, creates the pending order in Firestore, and returns the Stripe URL. The client never handles payment configuration directly.

The second iteration addressed a concurrency problem found during early testing: two customers purchasing the last available unit simultaneously could both succeed, resulting in overselling. The stock check and order creation were not atomic in the first implementation. Wrapping both operations in a Firestore transaction inside the Cloud Function resolved this — if the transaction detects insufficient quantityRemaining, it throws an error, the function returns a sold-out response, and the client disables the checkout button.

The third iteration corrected a gap in the QR pickup validation. The initial scanner confirmed that a QR code UUID existed in Firestore but did not verify that the vendor scanning the code was the same vendor who created the listing. Adding vendorId == currentUser.uid to the Firestore query in the scan handler closed this, ensuring a vendor can only mark pickup for their own listings.

The fourth iteration added full Vietnamese language support using react-i18next. Every user-visible string was moved to translation key references, with translation files covering all pages, error messages, status badges, form placeholders, and notification text. Language preference is saved to the user's Firestore profile and loaded on login.

The fifth iteration added the AI Box Composer, a vendor-facing feature powered by Google Gemini 2.0 Flash Lite through a Cloud Function called composeMysteryBox. The vendor enters a list of available surplus ingredients, and Gemini returns a suggested mystery box title, description, and price range, reducing listing creation time from approximately three minutes to under 60 seconds.

The sixth iteration introduced a three-tier subscription system: Free (2 boxes per day), Pro at 99,000 VND per month (5 per day), and Elite at 199,000 VND per month (8 per day). Daily purchase limits are enforced inside Cloud Functions — the createCheckoutSession function checks the customer's current-day order count against their plan limit before creating a Stripe session. The limit cannot be bypassed by manipulating the client.

The seventh iteration fixed a critical security issue identified during a code review session. User role assignment was happening on the client side during registration, meaning a user could manipulate the request to assign themselves any role. Moving role assignment to a callable Cloud Function called createUserProfile that sets the role using the authenticated Firebase UID removed this vulnerability entirely.

### 4.3 App Features and Functionality

On the customer side, users register or log in using email and password or Google Sign-In, selecting their role at registration. The browse page displays active surplus listings with a category filter across ten categories and real-time stock updates via Firestore onSnapshot. A daily box quota badge below the greeting shows how many purchases remain under the customer's current subscription plan, displayed in green when boxes remain, amber when one remains, and red when the limit is reached. The listing detail page shows original price, discounted price, calculated discount percentage, a food safety countdown from the vendor's packed-at timestamp, the pickup window, remaining stock, and a mystery box variant selector. Purchases flow through Stripe Checkout, with daily limits enforced server-side before the session is created. After payment, a real-time order status tracker reflects the order moving from pending to paid. The order detail page displays a QR code for pickup, and after confirmation a box reveal card shows the assigned contents. Customers can browse a vendor's public store page, manage their subscription plan, and opt in to push notifications for new listings from followed vendors.

On the vendor side, users register with a store name and access a dashboard showing revenue, active listing count, and pending pickup count with Recharts analytics charts. The listings management page supports creating, editing, and deleting surplus listings with Firebase Storage image upload. The AI Box Composer reduces listing creation to entering ingredients and reviewing the Gemini-generated suggestion before publishing. The food safety badge is configured by setting a packed-at time on the listing form, which becomes a live countdown on the customer-facing detail page. The orders page shows incoming orders in real time. The QR scan page activates the device camera, reads the customer's code using html5-qrcode, validates vendorId == currentUser.uid in Firestore, and marks the order as picked_up on a successful match.

The technical infrastructure runs on Firebase Authentication, Cloud Firestore with real-time listeners, Firebase Storage scoped per vendor, and Firebase Cloud Functions for all server-side logic. Ten Cloud Functions are deployed in total. Payments use Stripe Checkout and Stripe Subscriptions in test mode. The bilingual UI is managed by react-i18next with language preference persisted to Firestore. The frontend uses React Router v6 with role-based route guards and is styled with Tailwind CSS and shadcn/ui on a dark design system using slate backgrounds and indigo and purple accents.

### 4.4 Screenshots and Live Vercel URL

The GitHub repository is at https://github.com/Gnoltd/Final-PRJ-HSB3057E. The live Vercel URL will be updated once production environment variables are finalized — the application builds and deploys successfully; the remaining step is populating Firebase and Stripe production keys in the Vercel environment settings. Full screenshot documentation is included in Appendix D, covering the browse page, listing detail, Stripe checkout, order success with box reveal, order QR code, vendor dashboard, AI Box Composer, QR scan page, and subscriptions plan page.

### 4.5 Reflection on Vibe Coding Experience

The vibe coding approach produced a functional, deployable application in approximately ten days. An application of this scope — separate user roles, real-time database, server-side payment processing, an AI-powered feature, push notifications, a bilingual interface, and a subscription system — would not have been buildable in this timeframe by a team with no prior experience in any of these individual technologies.

The honest qualification is that generated code and production-ready code are not the same thing. The cases where the initial output was wrong were exactly the cases that matter most: the security-critical flows, the concurrency edge cases, and the cross-component dependencies that are not visible when reading each function in isolation. The stock decrement race condition, the QR vendor validation gap, and the client-side role assignment vulnerability were all absent from the generated output. They were only visible when the application was tested as someone trying to break it rather than someone following the intended user flow. That adversarial mindset does not come from the AI — it has to come from the developer.

The most productive sessions were the ones where a problem was described precisely. A vague prompt like "improve the QR scanner" would have produced cosmetic changes. "The vendor can scan any QR code, not just their own — fix it" produced a specific and correct fix. The quality of the output is directly proportional to the quality of the problem description, and writing a precise problem description requires understanding what the problem actually is.

---

## 5. Recommendations and Reflection

### 5.1 Additional Digital Transformation Recommendations for FreshGarden

Two changes beyond MysteryBox would have meaningful impact at FreshGarden within the next six months without requiring significant budget or vendor involvement.

The first is demand forecasting using the data that already exists. Both branches maintain daily sales records in Google Sheets, though not consistently enough for reliable analysis. If the branch managers committed to logging prep quantities and actual sold quantities every day for 60 consecutive weekdays, the resulting dataset would be sufficient to identify which items and which days consistently generate surplus, how weather and proximity to university exam periods affect the Cầu Giấy lunch peak, and what minimum prep quantity covers the lunch rush without over-preparing for the evening. This requires no new software — only 15 minutes of consistent daily data entry and 30 minutes per week to review the pattern.

The second is a digital loyalty program for frequent customers. Thirty-eight percent of surveyed customers visit weekly or more, and they currently receive no acknowledgment for this. A simple digital stamp card — one credit per visit, redeemed at the tenth visit for a free item — would increase return frequency in this segment. The same system would give FreshGarden the customer contact data needed to send direct push notifications for end-of-day MysteryBox offers, creating a direct channel that Instagram and word-of-mouth cannot replicate.

### 5.2 Implementation Considerations

MysteryBox's infrastructure costs at FreshGarden's current volume are effectively zero at the outset. Firebase Spark's free tier covers authentication, Firestore reads and writes, and Cloud Functions invocations well within the free limits for two branches at current customer volumes. Stripe processes payments at 1.5% plus a fixed fee per transaction — for a typical MysteryBox order of 60,000 VND, this amounts to approximately 2,700 VND per purchase. At ten surplus orders per evening across two branches, the monthly Stripe cost would be under 100,000 VND. Momo and VietQR have comparable or lower transaction fees and can be integrated in a production version through their respective partner APIs.

The application is functional in test mode today. Moving to production requires populating Firebase and Stripe production API keys, registering the Stripe webhook endpoint in the Stripe Dashboard, and deploying Firestore rules and indexes — a process that takes approximately two to three hours following the documented checklist. Adding native VietQR and Momo payment support would require two to three additional weeks of development. A digital loyalty stamp system would take three to four weeks. A multi-branch vendor dashboard consolidating the two FreshGarden locations would take two to three weeks.

Staff training requirements are minimal by design. Creating a surplus listing takes under two minutes: log in, tap New Listing, enter a title or use the AI Composer, set a price, set a quantity, upload a photo, and set the pickup window. Branch manager onboarding can be completed in a 15–20 minute walkthrough on a real device. No changes to kitchen operations or existing POS workflows are required.

### 5.3 Future Development Roadmap for the App

Native VietQR and Momo payment integration is the most urgent production priority, given that 79% of FreshGarden's surveyed customers use one of these two methods. The VNPAY integration is already scaffolded in the codebase via a createVNPayOrder Cloud Function. Momo requires business registration and API approval, which would be the first external step in a commercial deployment process.

A waste-tracking dashboard view for vendors would close the feedback loop between using the app and changing operational behavior. The current analytics tab shows revenue and order volume; a waste-specific view would show boxes created versus sold per day, estimated VND value recovered versus discarded, and recovery rate trends over time. Improved push notification targeting would allow customers to filter alerts by category and time of day, so a customer who only wants bakery items near closing time receives relevant alerts rather than every listing. Multi-branch vendor support would allow FreshGarden's owner to view both branches from a single dashboard with aggregate revenue and combined pending pickups. Post-pickup feedback, collected as a one-question rating after an order is marked picked up, would build the review data that increases trust for future customers browsing listings.

### 5.4 Team Reflection on Learning Outcomes

The field observation at FreshGarden produced the most useful insight of the entire project. Watching 11 unsold cream cakes and pastries get moved from the display case to the discard bin at 8:20 PM at the Hoàn Kiếm branch made the problem concrete in a way that secondary statistics do not. Vietnam's food service sector contributes to a national food waste problem estimated at over 8 million tonnes annually (Vietnam.vn, 2023a), but that figure is abstract until it becomes 11 bowls in a bin at one branch on one evening. The observation methodology forced genuine engagement with the operational reality of the business, and the conversation with kitchen staff — particularly the point about the asymmetry of consequences between running out at lunch and wasting at closing time — produced a framing of the problem that shaped the app design in ways the survey data alone would not have.

The survey design taught a practical distinction between attitude questions and behavior questions. "Would you use a surplus food app?" (attitude) returned 68% positive among the 18–34 cohort. "What would make you hesitant?" (behavior barrier) surfaced the trust concern about mystery box contents that directly shaped the decision to add food safety countdown badges, packed-at timestamps, and transparent pickup windows. The attitude questions set the size of the opportunity; the barrier questions shaped the design.

The vibe coding experience confirmed that the technology barrier to building something functional has dropped significantly. The constraint has shifted from "can we build this" to "do we understand the problem well enough to describe it precisely and test the result rigorously." Both of those requirements demand domain knowledge and critical thinking that are distinct from the ability to write code. The security issues and race conditions in the generated output were caught by testing the application as a hostile user, not by reading it. That is a skill the team developed through the process of building and breaking this application.

The Too Good To Go comparison was useful in a specific way: knowing that a company had already validated the market — 100 million users, 135 million meals saved in a single year, operations in 20 countries (Too Good To Go, 2024) — meant the team was not building toward a hypothesis. The design questions that remained were the ones that actually matter for Vietnam: what payment methods work, how Vietnamese shapes the user experience, and how small Hanoi F&B businesses with informal operations can be onboarded without requiring them to change how they work. Those are harder questions than "does the concept work," and they are more interesting ones.

---

## 6. Appendices

### Appendix A: Survey Instrument

**MysteryBox Customer Survey — FreshGarden (English version)**

Question 1 asked respondents to indicate their age group, with options for under 18, 18–24, 25–34, 35–44, and 45 or older.

Question 2 asked for primary occupation, with options for student, employed full-time, employed part-time, self-employed, and other.

Question 3 asked how often the respondent visits FreshGarden, with options for weekly or more, two to three times per month, once a month, and less than once a month.

Question 4 asked which payment method the respondent uses most often at FreshGarden, with options for cash, VietQR bank transfer, Momo, ZaloPay, bank card, and other.

Question 5 asked whether the respondent knows if FreshGarden offers discounted food near closing time, with yes or no options.

Question 6 asked whether the respondent has ever purchased discounted end-of-day food from any restaurant, with yes or no options.

Question 7 asked what percentage discount would motivate the respondent to make a special trip to collect food near closing time, with options for under 20%, 20–39%, 40–59%, 60% or more, and would not make a special trip regardless of discount.

Question 8 asked whether the respondent would use a mobile app that lets them buy discounted end-of-day food from restaurants they already visit, with options for yes definitely, probably yes, probably not, and no.

Question 9 asked what would make the respondent hesitant to use such an app, as an open text field.

Question 10 invited any other comments, as an open text field.

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

Raw response data: survey_data_freshgarden.csv (attached)

---

### Appendix B: Interview Transcripts and Notes

**Interview 1 — Hoàn Kiếm Branch Manager**
Date: June 2026. Duration: approximately 30 minutes.

The manager estimated that the branch discards food worth approximately 150,000–350,000 VND on a typical evening, with Monday and rainy days consistently the worst, and placed monthly food waste losses at around 4–5 million VND. When asked about existing mechanisms to address surplus, she said there are none in any formal sense. She occasionally posts on Instagram when a large amount remains but acknowledged that the timing makes it ineffective. If a regular customer happens to come in around 7:30 PM, she mentions available items at a discount, but this catches at most two or three people. Her main concern about a new tool was the scenario where a customer purchases online and then arrives to find items already sold in a last-minute counter rush. The solution she described — setting a listing 90 minutes before closing with a firm pickup deadline — maps directly to MysteryBox's existing pickup window mechanism.

**Interview 2 — Cầu Giấy Branch Manager**
Date: June 2026. Duration: approximately 25 minutes.

The Cầu Giấy manager described two distinct problems: a lunch stockout issue (the most popular fresh bread and cream cake varieties regularly selling out before 1:15 PM) and an evening surplus issue (demand dropping sharply after 7:00 PM, leaving pre-prepared items unsold). He identified nearby HUST students as the most likely audience for a surplus offer and specifically asked whether the app would support Momo payments, noting that most of his student customers pay via Momo or VietQR rather than bank card. When asked what would determine whether he kept using a new tool, he was direct: if he created five listings and no one came, he would stop. The tool needs to deliver visible results within the first few uses to build the habit.

**Interview 3 — Senior Kitchen Staff, Cầu Giấy**
Date: June 2026. Duration: approximately 15 minutes.

The kitchen staff member explained that prep quantities are set by the manager the night before based on the previous day's sales, with no written data or trend analysis. When asked why the kitchen does not simply prepare less to reduce waste, his answer was blunt: if they prepare less and sell out at lunch, customers complain and sometimes post on Google Reviews; if they discard 10 unsold cream cakes at closing time, nothing happens to anyone. He confirmed that logging a packed-at time for each batch would be operationally feasible as long as the action is simple, noting that some items already have a handwritten time on the container for food safety compliance.

---

### Appendix C: Power BI Dashboard Export

The full Power BI dashboard is included as a separate .pbix file attachment. PDF exports of all five dashboard pages are also included. Data source: survey_data_freshgarden.csv (87 responses). Page 1 presents respondent demographics by age group and visit frequency. Page 2 presents payment method distribution. Page 3 presents the awareness and willingness gap in a comparative bar chart. Page 4 presents discount sensitivity as a histogram. Page 5 presents the problem prioritization matrix as a ranked horizontal bar chart combining survey open-text frequency and interview coding.

---

### Appendix D: App Screenshots

Full screenshots are included as a separate image folder in the submission package, covering: browse page with category filter chips and listing cards; listing detail with discount badge, food safety countdown, box selector, and daily quota; Stripe checkout page (test mode); order success with box reveal card; order detail with QR code; vendor dashboard with charts; AI Box Composer; QR scan page with confirmation modal; and subscriptions page with plan cards.

---

### Appendix E: App Development Prompt History

Session 1 (June 17): "Build a web app where F&B vendors list end-of-day surplus food as mystery boxes. Customers browse, pay via Stripe, and pick up with a QR code. Stack: React + Vite + TypeScript + Firebase + Stripe. Dark modern UI. Support English and Vietnamese."

Session 3: "The Stripe session is created on the client. That is a security problem — anyone can manipulate the price. Move session creation to a Firebase Cloud Function. The function should check stock availability before creating the session and create a pending order in Firestore."

Session 5: "Two customers buying the last unit simultaneously both succeed. I need to prevent overselling. Wrap the stock check and order creation in a Firestore transaction. If the transaction fails due to insufficient stock, return an error to the client."

Session 7: "The QR scanner validates that the code exists in Firestore but does not check that the vendor doing the scanning owns the order. Add vendorId equals currentUser.uid to the Firestore query in the scan handler."

Session 10: "Add full Vietnamese language support using react-i18next. All user-visible strings should use t-key with no hardcoded text in components. Save language preference to Firestore."

Session 12: "Add a vendor feature: the vendor enters a list of available surplus ingredients. A Gemini Cloud Function returns a suggested mystery box title, description, and price. Use Gemini 2.0 Flash Lite."

Session 16: "Add a subscription system: Free for 2 boxes per day, Pro at 99,000 VND per month for 5 boxes, Elite at 199,000 VND per month for 8 boxes. Enforce daily purchase limits server-side inside the checkout Cloud Function."

Session 22: "Role assignment happens on the client side during registration. A user can manipulate the request to assign themselves vendor role. Move role assignment to a callable Cloud Function that validates and writes using the Firebase auth UID."

Session 24: "Show customers their daily box quota on the browse page and listing detail page. Use a real-time hook that counts today's paid orders from Firestore. Filter client-side to avoid requiring a new Firestore composite index."

---

### Appendix F: Vendor Quotations

No external vendor quotations were obtained for this project. All infrastructure used in the prototype is available at zero cost for development-level usage. Production cost estimates are documented in Section 5.2, based on published pricing from Firebase (https://firebase.google.com/pricing), Stripe (https://stripe.com/en-vn/pricing), and Google Gemini API (https://ai.google.dev/pricing).

---

### Appendix G: Team Member Contributions

Venue observation across both FreshGarden branches, FoH and BoH documentation, and TIHO problem classification were led by the first team member. Survey design, survey administration, interview notes, and secondary data research were the primary responsibility of the second team member. Power BI dashboard design, data analysis, and visualization work were led by the third team member. App development covering the customer-facing flow, Stripe integration, and i18n was led by the fourth team member. App development covering the vendor-facing flow, Cloud Functions, QR scanner, and AI Box Composer was led by the fifth team member. All team members contributed to the writing and editing of the final report.

---

## 7. Bibliography

Antom. (2024). *Vietnam's cashless future: Urban and rural opportunities*. Antom Knowledge. https://knowledge.antom.com/vietnams-cashless-future-urban-and-rural-opportunities

Foody.vn. (2024). *Fresh Garden Bakery — Lý Thường Kiệt*. Foody.vn. https://www.foody.vn/ha-noi/fresh-garden-bakery-ly-thuong-kiet

Google Maps. (2026). *Fresh Garden — 26 Lý Thường Kiệt, Hà Nội* [Business listing with customer reviews]. Google LLC. Retrieved June 2026, from https://maps.google.com (search: "Fresh Garden 26 Lý Thường Kiệt Hà Nội")

BuzzMetrics. (2024). *Uncover 3 key insights about Gen Z [2024 update]*. BuzzMetrics. https://www.buzzmetrics.com/en/insight/kham-pha-3-su-that-ngam-hieu-ve-the-he-gen-z

Nguyen, T. T. H., Nguyen, T. M. T., Pham, T. L., & Nguyen, T. T. (2023). Survey data of Gen Z customer behaviour using food delivery applications in Vietnam. *Data in Brief*, *51*, 109746. https://doi.org/10.1016/j.dib.2023.109746

QR Code Tiger. (2024). *How payment QR codes in Vietnam fuel its economic growth*. QR Code Tiger. https://www.qrcode-tiger.com/qr-code-vietnam

Rainer, R. K., & Prince, B. (2021). *Introduction to information systems* (8th ed.). Wiley.

Statista. (2024a). *Vietnam: Leading food delivery app by penetration rate 2024*. Statista. https://www.statista.com/statistics/1452852/vietnam-leading-food-delivery-app-by-penetration-rate/

Statista. (2024b). *Vietnam: Most popular e-wallet brands 2024*. Statista. https://www.statista.com/statistics/1270491/vietnam-most-popular-e-wallet-brands/

Too Good To Go. (2024). *2024 impact report*. Too Good To Go. https://www.toogoodtogo.com/en-us/impact-report

United Nations Environment Programme. (2024). *Food waste index report 2024*. UNEP. https://www.unep.org/resources/publication/food-waste-index-report-2024

Vietnam Investment Review. (2024). *Widespread adoption of digital payments taking hold*. Vietnam Investment Review. https://vir.com.vn/widespread-adoption-of-digital-payments-taking-hold-113598.html

VietnamNet. (2024). *Vietnam F&B industry in 2024 continues growth with new trends*. VietnamNet. https://vietnamnet.vn/en/vietnam-f-b-industry-in-2024-continues-growth-with-new-trends-2265396.html

Vietnam.vn. (2023a). *Vietnam has more than 8 million tons of usable food thrown away every year*. Vietnam.vn. https://www.vietnam.vn/en/viet-nam-co-hon-8-trieu-tan-thuc-pham-con-su-dung-duoc-bi-vut-bo-moi-nam

Vietnam.vn. (2023b). *Vietnamese people waste nearly 4 billion USD by throwing away usable food*. Vietnam.vn. https://www.vietnam.vn/en/dan-viet-hoang-phi-gan-4-ti-usd-do-bo-thuc-pham-con-dung-duoc

---

*Report length excluding appendices and bibliography: approximately 6,500 words.*
*Total including appendices: approximately 8,800 words.*
*Submitted in partial fulfillment of HSB3057E requirements, Hanoi School of Business and Management, June 2026.*
