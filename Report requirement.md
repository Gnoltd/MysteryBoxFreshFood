 F&B Digital Transformation Project Guide

**Hanoi School of Business and Management**

---

## Project Overview

This project challenges you to investigate a real Food & Beverage (F&B) venue in Hanoi, identify digitalization pain points through primary research, and build a functional prototype app to address one key problem.

**Key Deliverables:**
1. Investigation of an F&B venue (phở bò, bún riêu, cơm tấm, coffee shop, etc.)
2. Survey & interview data collection (use secondary data - ready made like Kaggle)
3. Interactive dashboard presenting your findings (Optional)
4. A "vibe coded" app prototype solving one digitalization pain point


---

## Part 1: F&B Venue Investigation

### 1.1 Venue Selection & Field Research

Investigate a physical F&B venue in Hanoi. If the venue has multiple branches, at least 2 locations to compare operations.


### 1.2 Observation Framework

Analyze the venue using the **Rainer (2021) Information Systems Framework**:

| Component | What to Observe |
|-----------|-----------------|
| **Operations** | Order flow, kitchen processes, payment handling, delivery coordination |
| **Management** | Staff scheduling, inventory tracking, decision-making processes |
| **Support** | Customer service, complaint handling, loyalty programs |

### 1.3 Front-of-House (FoH) vs Back-of-House (BoH) Analysis

**Front-of-House (Customer-Facing):**
- Ordering experience (menu access, wait times, payment options)
- Customer feedback mechanisms
- Digital touchpoints (QR codes, apps, social media)
- Ambiance and customer flow

**Back-of-House (Internal Operations):**
- Kitchen display systems and order management
- Inventory and supply chain tracking
- Staff communication and scheduling
- Accounting and financial management

### 1.4 Problem Classification (TIHO Framework)

Categorize identified problems using the Technology/Information/Human/Organization framework:

| Category | Examples |
|----------|----------|
| **Technoware** | Outdated POS, no online ordering, unreliable internet |
| **Infoware** | No customer database, paper-based inventory, missing analytics |
| **Humanware** | Staff digital literacy gaps, resistance to new tools, training needs |
| **Orgaware** | No digitalization strategy, unclear workflows, change management issues |

---

## Part 2: Primary Research & Data Dashboard

### 2.1 Data collection


**Data collection for:**
- Demographic information (age, occupation, visit frequency)
- Digital preferences (ordering apps, payment methods, social media)
- Pain points experienced as a customer
- Willingness to adopt digital solutions
- Satisfaction ratings (service speed, quality, convenience)

**Staff/Owner Topics:**
- Current technology usage and challenges
- Perceived barriers to digitalization
- Priority areas for improvement
- Budget and resource constraints

**Findings:** Painpoint(s) that need to be addressed

### 2.2 Data Dashboard Requirements (Optional)

Present your findings through an **interactive Power BI dashboard**.

**Why Power BI?**
- Industry-standard business intelligence tool
- Free desktop version available
- Strong job market demand in Vietnam
- Integrates well with Excel data sources

**Dashboard Must Include:**
1. Demographic breakdown of respondents
2. Problem frequency analysis (which issues appear most often)
3. Digital readiness assessment
4. Correlation analysis (e.g., age vs. digital payment preference)
5. Priority matrix (impact vs. feasibility of solutions)

**Submission:** Include your .pbix file and PDF export of all dashboard pages.

---

## Part 3: Vibe Code App Development

### 3.1 What is Vibe Coding?

"Vibe coding" is the practice of using AI assistants to rapidly prototype applications through natural language conversation. You describe what you want, and iterate with the AI to build functional software.

### 3.2 Development Stack

For this project, you will use:

| Tool | Purpose |
|------|---------|
| **VS Code** | Code editor — write and edit your application |
| **Claude** | AI assistant — generate code, debug, iterate on features |
| **GitHub** | Version control — store and manage your code |
| **Vercel** | Deployment — host your live web application |

**Setup Requirements:**
1. Install VS Code: https://code.visualstudio.com
2. Create GitHub account: https://github.com
3. Create Vercel account: https://vercel.com (sign up with GitHub)
4. Access Claude: https://claude.ai

### 3.3 Pain Point Selection

From your research, select **ONE specific, well-defined pain point** to address with your app. Good candidates include:

| Pain Point | Potential App Solution |
|------------|------------------------|
| Long ordering queues | ..... |
| No customer loyalty program | ..... |
| Inventory frequently runs out | ...... |
| Customers can't find the store | ...... |
....

### 3.4 App Requirements

Your vibe-coded app must:

1. **Solve a real problem** identified in your research
2. **Be functional** — working prototype, not just mockups
3. **Include Vietnamese language** support appropriate to the context
4. **Be deployed on Vercel** with a live, shareable URL

**Recommended Tech Stack:**
- **Frontend:** React or Next.js (Claude excels at generating these)
- **Styling:** Tailwind CSS (easy to iterate with AI)
- **Data:** JSON files or simple API integration

### 3.5 Development Workflow

```
1. Describe your app idea to Claude
         ↓
2. Claude generates initial code
         ↓
3. Copy code to VS Code, test locally
         ↓
4. Iterate with Claude to fix issues/add features
         ↓
5. Push to GitHub repository
         ↓
6. Connect GitHub repo to Vercel
         ↓
7. Deploy and share live URL
```

### 3.6 Development Process Documentation

Document your vibe coding journey:

1. **Initial prompt** — What you first asked Claude to build
2. **Iteration history** — Key adjustments and refinements (3-5 examples)
3. **Challenges encountered** — What didn't work, how you solved it
4. **GitHub repository** — Link to your code
5. **Live Vercel URL** — Deployed application link

### 3.7 App Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Problem-Solution Fit | 25% | Does the app directly address the identified pain point? |
| Functionality | 25% | Does the app work as intended? |
| User Experience | 20% | Is it intuitive and easy to use? |
| Localization | 15% | Appropriate Vietnamese language/cultural context |
| Documentation | 15% | Clear explanation of development process |

---

## Part 4: Final Report Structure

### Report Format
- **Length:** 15-20 pages (excluding appendices)
- **Format:** PDF submission
- **Language:** English (Vietnamese acceptable for app content, survey samples)

### Required Sections

**1. Executive Summary** (1 page)
- Venue overview and key findings
- Selected pain point and solution summary

**2. Venue Analysis** (3-4 pages)
- Location details and observation methodology
- FoH/BoH process documentation
- TIHO problem classification
- Online and offline presence assessment

**3. Research Findings** (3-4 pages)
- Survey methodology and sample demographics
- Key insights from interviews
- Dashboard visualizations (embedded or linked)
- Problem prioritization matrix

**4. App Development** (4-5 pages)
- Pain point justification (why this problem?)
- Development process with Claude (key prompts and iterations)
- App features and functionality
- Screenshots and live Vercel URL
- GitHub repository link
- Reflection on vibe coding experience

**5. Recommendations & Reflection** (2-3 pages)
- Additional digital transformation recommendations
- Implementation considerations (budget, timeline, training)
- Future development roadmap for the app
- Team reflection on learning outcomes

**6. Appendices**
- Survey instrument
- Interview transcripts/notes
- Full dashboard export
- App development prompt history
- Vendor quotations (if relevant)
- Team member contributions

---

## Grading Rubric

| Component | Weight |
|-----------|--------|
| F&B Venue Investigation & Analysis | 20% |
| Survey/Interview Quality & Sample Size | 15% |
| Power BI Dashboard Design & Insights | 20% |
| Vibe Coded App (Functionality + Deployment) | 30% |
| Report Quality & Professionalism | 10% |
| Team Presentation | 5% |

---

## Important Dates

| Milestone | Deadline |
|-----------|----------|
| Team Formation & Venue Selection | Day 2 |
| Field Visit & Data Collection Complete | End of Week 1 |
| Power BI Dashboard Draft | Mid Week 2 |
| App Prototype Complete (Deployed on Vercel) | End of Week 2 |
| Final Report Submission | End of Week 3 |
| Team Presentations | Week 3 |

---

## Resources

**Development Tools:**
- VS Code: https://code.visualstudio.com
- Claude: https://claude.ai
- GitHub: https://github.com
- Vercel: https://vercel.com

**Power BI:**
- Power BI Desktop (Free): https://powerbi.microsoft.com
- Power BI Learning Path: https://learn.microsoft.com/en-us/training/powerplatform/power-bi

**Research Resources:**
- Rainer, R.K., & Prince, B. (2021). *Introduction to Information Systems* (8th ed.)
- Google Forms survey best practices in course materials