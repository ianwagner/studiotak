import { GhostLegalPage } from "@/components/GhostLegalPage";
import { createStaticPageMetadata } from "@/components/StaticPage";
import styles from "@/components/StaticPage.module.css";

export const revalidate = 120;
export const dynamic = "force-static";

const lastUpdated = "October 23, 2026";
const description =
  "The terms that govern your use of Studio Tak (Campfire) creative production services and our websites.";

export const metadata = createStaticPageMetadata({
  title: "Terms of Service | Studio Tak / Campfire",
  description,
  path: "/terms-of-service"
});

export default function TermsOfServicePage() {
  return (
    <GhostLegalPage slug="terms-of-service" title="Terms of Service" lastUpdated={lastUpdated}>
            <h2 id="acceptance">1. Acceptance of Terms</h2>
            <p>
              <strong>1.1</strong> These Terms of Service (this &quot;Agreement&quot;) between Studio Tak LLC, doing business as Campfire (&quot;we&quot;, &quot;us&quot;, or &quot;Campfire&quot;), and you govern your access and use of our websites at www.studiotak.co and www.campfireads.io, and any related pages we operate (together, the &quot;Site&quot;) and the creative production services we provide (the &quot;Services&quot;). By engaging our Services in any manner, you acknowledge that you have read, understood, and agree to be bound by this Agreement.
            </p>
            <p>
              <strong>1.2</strong> This Site is controlled and operated by us from our offices within the United States. We make no representation that materials on the Site are appropriate or available for use in other locations. Those who choose to access this Site from locations outside the United States are responsible for compliance with all applicable laws.
            </p>
            <p>
              <strong>1.3</strong> We may update this Agreement from time to time. By continuing to use the Services after any update, you accept the updated terms in their entirety. All updates are effective upon posting. We encourage you to review this page periodically.
            </p>

            <h2 id="privacy">2. Privacy</h2>
            <p>
              <strong>2.1</strong> Our privacy policy, which can be found at <a href="/privacy-policy">studiotak.co/privacy-policy</a> (the &quot;Privacy Policy&quot;), describes how we may use your personal information. By engaging our Services, you accept the Privacy Policy, which is incorporated herein by reference.
            </p>
            <p>
              <strong>2.2</strong> By providing your email address or phone number, you consent to receive communications from Campfire related to your projects, invoices, and service updates. You may opt out of non-essential communications at any time by notifying us in writing.
            </p>

            <h2 id="services">3. The Services</h2>
            <p>
              <strong>3.1</strong> Campfire provides ad creative production services for direct-to-consumer (DTC) brands, including but not limited to: branded ad design (static and motion), user-generated content (UGC) production and editing, creative strategy and performance analysis, and delivery of finished ad assets (collectively, the &quot;Services&quot;). Subject to your compliance with this Agreement and timely payment of applicable fees, we will perform the Services as agreed upon between the parties.
            </p>
            <p>
              <strong>3.2</strong> &quot;Deliverables&quot; means the ad creative assets, designs, videos, images, and other content that we develop and deliver specifically for you based on your project scope. Deliverables do not include Licensed Content or AI-Generated Content, which are subject to the license restrictions described in Sections 5 and 6 below.
            </p>
            <p>
              <strong>3.3</strong> We will use commercially reasonable efforts to deliver work in a timely manner. Any delivery timelines we provide are estimates only and are not guarantees.
            </p>
            <p>
              <strong>3.4</strong> You are responsible for providing accurate and complete brand assets, guidelines, product information, performance data, and any other materials necessary for us to perform the Services (&quot;Customer Content&quot;). By submitting Customer Content to us, you represent that you own or have the necessary rights, licenses, and authorization to share it. You grant us a worldwide, royalty-free, non-exclusive license to use Customer Content to provide the Services and to create and use de-identified, aggregated data as described in Section 9.5.
            </p>
            <p>
              <strong>3.5</strong> We may terminate your engagement without prior notice or liability if we determine, in our sole discretion, that you: (i) have violated this Agreement; (ii) have failed to make timely payments; (iii) are using our Services for illegal purposes; or (iv) are abusing our team or processes in any way.
            </p>

            <p>
              <strong>3.6</strong> If you grant us access to an advertising account, you authorize only the access reasonably needed for the agreed Services. Use platform permissions where available rather than sharing passwords. You may revoke access at any time through the platform or by notifying us; doing so may affect our ability to perform the Services. You remain responsible for your accounts, advertising budgets, billing, permissions, and compliance with platform policies. We do not guarantee platform approval or account availability and, to the extent permitted by law, are not liable for a platform&apos;s independent decision to reject an ad or restrict, suspend, or close an account. This does not excuse our breach of this Agreement.
            </p>

            <h2 id="ip">4. Intellectual Property and Ownership</h2>
            <p>
              <strong>4.1</strong> Subject to full payment of all applicable fees and compliance with this Agreement, you will be the sole and exclusive owner of all right, title, and interest in and to the Deliverables, including all intellectual property rights therein. We agree that any Deliverables that qualify as &quot;work made for hire&quot; under 17 U.S.C. §101 are deemed a &quot;work made for hire&quot; for you. To the extent that any Deliverables do not constitute a &quot;work made for hire,&quot; we irrevocably assign to you all right, title, and interest in and to the Deliverables, including all intellectual property rights therein.
            </p>
            <p>
              <strong>4.2</strong> Notwithstanding Section 4.1, ownership of Deliverables is subject to the following: (a) Licensed Content incorporated in Deliverables remains subject to the license terms in Section 5; (b) AI-Generated Content incorporated in Deliverables is subject to Section 6; (c) ownership transfers only upon full payment of all applicable fees; and (d) creator names, images, voices, likenesses, and performances remain subject to Section 5.6.
            </p>
            <p>
              <strong>4.3</strong> You grant us a limited, non-exclusive, royalty-free license to use the Deliverables internally to provide and improve our Services, subject to Section 9. Once you publish a Deliverable, we may display that published creative for portfolio and marketing purposes under Section 10, subject to any applicable third-party or creator rights. Publication does not make your non-public spend, return on ad spend (ROAS), or other performance metrics public. You may opt out of marketing and portfolio use by notifying us in writing at any time.
            </p>
            <p>
              <strong>4.4</strong> All proprietary tools, frameworks, methodologies, and processes used by Campfire in the course of providing Services (including but not limited to our creative demand models, performance analysis frameworks, and production workflows) remain the exclusive property of Studio Tak LLC. Nothing in this Agreement grants you any right, title, or interest in our proprietary tools or methodologies.
            </p>
            <p>
              <strong>4.5</strong> You grant us a perpetual, irrevocable, worldwide, non-exclusive, transferable, sublicensable right and license to commercially exploit in any manner any feedback, suggestions, or recommendations that you provide to us regarding the Services.
            </p>
            <p>
              <strong>4.6</strong> Deliverables consist of final exported assets only. Working source files (such as layered design files and video project files) used to produce your Deliverables remain the exclusive property of Studio Tak LLC and are not included in Deliverables or subject to the ownership provisions of this Section 4.
            </p>

            <h2 id="licensed-content">5. Licensed Content</h2>
            <p>
              <strong>5.1</strong> &quot;Licensed Content&quot; means stock or pre-existing content elements that we own or license from third parties, including stock photographs, audio, typefaces, video clips, design elements, and other pre-existing materials. While you own the Deliverables as described in Section 4, any Licensed Content incorporated in the Deliverables is subject to the license described in this Section.
            </p>
            <p>
              <strong>5.2</strong> Subject to compliance with this Agreement and full payment of applicable fees, we grant you a non-exclusive, non-transferable, royalty-free, worldwide right and license to use the Licensed Content as incorporated in a Deliverable. You may not use Licensed Content on a standalone basis, separate from the Deliverable into which it is incorporated.
            </p>
            <p>
              <strong>5.3</strong> To the extent that we license content from third parties (such as Adobe Stock, Envato, or similar services), you agree to comply with the relevant third-party license terms. We will inform you if specific third-party license restrictions apply to your Deliverables.
            </p>
            <p>
              <strong>5.4</strong> You may not, directly or indirectly, sell, sublicense, redistribute, reverse engineer, or modify any Licensed Content on a standalone basis. Licensed Content may only be used as part of the Deliverable into which it is incorporated.
            </p>
            <p>
              <strong>5.5</strong> We and our licensors retain ownership over all Licensed Content. We reserve the right to terminate all licenses to Licensed Content upon your failure to comply with any provision of this Agreement.
            </p>

            <p>
              <strong>5.6</strong> Creator Rights. Ownership of a Deliverable does not transfer ownership of a creator&apos;s name, image, voice, likeness, or performance. For creator content, the written project scope or creator license must specify the permitted channels, territory, usage period, and any renewal fees before publication. Whitelisted ads, partnership ads, Spark Ads, or advertising through a creator&apos;s account require express written permission from the creator and any required platform authorization; they are not included automatically. You must stop the applicable use when the agreed rights expire unless renewed in writing.
            </p>

            <p>
              <strong>5.7</strong> Creator Engagements and Samples. To the extent permitted by law, during a creator&apos;s work on your project and for twelve (12) months after their last work on that project, you may not knowingly bypass Campfire to solicit or directly engage that creator for services introduced through Campfire without our written consent. This restriction does not cover a documented pre-existing relationship or a response to a general public recruitment advertisement not directed at the creator. Unless otherwise agreed in writing, you are responsible for arranging and paying for safe, timely delivery of product samples to creators, including shipping, customs, and any agreed returns.
            </p>

            <h2 id="ai-content">6. AI-Generated Content</h2>
            <p>
              <strong>6.1</strong> &quot;AI-Generated Content&quot; means any content created, in whole or in part, using artificial intelligence tools in the course of producing your Deliverables. This may include AI-assisted image generation, text generation, or other AI-enhanced creative elements.
            </p>
            <p>
              <strong>6.2</strong> We will inform you when AI tools are used in the production of your Deliverables. If you prefer that AI tools not be used in your creative production, you may notify us in writing and we will make commercially reasonable efforts to accommodate that preference. This may affect pricing, timelines, or scope of deliverables.
            </p>
            <p>
              <strong>6.3</strong> AI-Generated Content may be subject to the terms of the underlying AI platform provider (such as OpenAI, Adobe Firefly, or similar services). To the extent applicable, you agree to comply with such third-party terms as they relate to AI-Generated Content incorporated in your Deliverables.
            </p>
            <p>
              <strong>6.4</strong> We make no warranty or representation regarding the ownership, originality, accuracy, or non-infringement of any AI-Generated Content. By accepting Deliverables that incorporate AI-Generated Content, you acknowledge and agree that the use of such content is at your own risk.
            </p>
            <p>
              <strong>6.5</strong> Intellectual property rights in AI-Generated Content may be limited or uncertain under current law. We cannot guarantee exclusive ownership rights over AI-Generated Content in the same manner as human-created original work.
            </p>

            <h2 id="fees">7. Fees and Payment</h2>
            <p>
              <strong>7.1</strong> Campfire operates on a per-ad pricing model. Fees for each project or ad will be communicated and agreed upon before work begins. You agree to pay all fees as invoiced. No work will commence until pricing has been mutually agreed upon.
            </p>
            <p>
              <strong>7.2</strong> Invoices are due upon receipt unless otherwise agreed in writing. Overdue payments will accrue interest at the rate of 1.5% per month, or the maximum rate permitted by law, whichever is lower. We reserve the right to suspend work on any active projects if you have outstanding unpaid invoices.
            </p>
            <p>
              <strong>7.3</strong> We reserve the right to change our pricing at any time. Any price changes will apply only to new projects or ads agreed upon after the change, not retroactively to work already in progress or previously invoiced.
            </p>
            <p>
              <strong>7.4</strong> All fees are non-refundable once work has commenced on a project. If you cancel a project after work has begun, you will be invoiced for all work completed up to the point of cancellation. If you cancel before work has begun, no fees will be charged.
            </p>
            <p>
              <strong>7.5</strong> You are responsible for all applicable taxes related to the Services. Unless otherwise stated, fees do not include taxes, levies, or duties imposed by taxing authorities.
            </p>

            <p>
              <strong>7.6</strong> Invoice Disputes. Notify us in writing of a good-faith invoice dispute, including the amount and reasons, within thirty (30) days after receipt. To the extent permitted by law, disputes not raised within that period are waived. Pay undisputed amounts when due; the parties will work in good faith to resolve disputed amounts.
            </p>

            <p>
              <strong>7.7</strong> Unpaid Deliverables. Before ownership transfers under Section 4.2, any permission to publish or use a Deliverable is conditional on timely payment. If an undisputed invoice for that Deliverable remains unpaid for thirty (30) days after written notice of nonpayment, we may terminate that permission by written notice. You must stop using the affected Deliverable and remove live ads using it within five (5) business days after termination. This does not revoke ownership of, or paid-up rights in, Deliverables for which all applicable fees have been paid, or eliminate amounts owed.
            </p>

            <p>
              <strong>7.8</strong> Free Offers and Beta Features. If we expressly offer free trial or spec ads, the written offer controls eligibility, scope, timing, and any usage restrictions. No fee is due for work expressly included in that free offer, notwithstanding Sections 7.1 and 8.3, and publication alone does not convert it to a paid engagement. For that work, the payment condition in Section 4 is satisfied without a charge, subject to the offer and third-party and creator rights. Additional paid work requires agreed pricing. Features expressly labeled beta or experimental may change or be discontinued and are provided under the disclaimers in Section 12; our confidentiality and privacy obligations still apply.
            </p>

            <h2 id="approval">8. Approval, Edits, and Replacements</h2>
            <p>
              <strong>8.1</strong> We will deliver Deliverables to you for review and approval before finalizing. You agree to review all delivered files for errors or omissions and notify us of any required changes within seven (7) business days of receipt. If we do not receive feedback within this period, Deliverables will be deemed approved. Publishing, distributing, or running a Deliverable as an advertisement also constitutes approval and acceptance of that Deliverable and confirms your obligation to pay the agreed fees. This does not authorize use beyond the rights granted under this Agreement.
            </p>
            <p>
              <strong>8.2</strong> Each project includes two (2) edit requests at no additional charge. &quot;Edits&quot; means changes to existing work, not new concepts or significant scope changes. Additional edit requests may be subject to additional fees, which will be communicated before work begins.
            </p>
            <p>
              <strong>8.3</strong> All delivered ads are billable, including ads you elect to reject. If you reject an ad, you are responsible for requesting a replacement and providing direction on what you want instead. Each project includes two (2) replacement ads at no additional charge. Additional replacements may be subject to additional fees, which will be communicated before work begins.
            </p>
            <p>
              <strong>8.4</strong> Upon your approval, we will deliver final ad assets and any accompanying platform copy. You are responsible for uploading and publishing assets to your ad accounts or platforms.
            </p>

            <h2 id="confidential">9. Confidential Information</h2>
            <p>
              <strong>9.1</strong> &quot;Confidential Information&quot; means non-public or proprietary information exchanged between the parties, including but not limited to: performance data, ad account metrics, business strategies, customer information, pricing, creative strategies, and proprietary methodologies.
            </p>
            <p>
              <strong>9.2</strong> Each party agrees to hold the other party&apos;s Confidential Information in confidence and not disclose it to any third party, except as required to perform the Services or as required by law. Access to Confidential Information will be limited to employees, contractors, and agents who need to know such information to perform the Services.
            </p>
            <p>
              <strong>9.3</strong> Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was already known to the receiving party prior to disclosure; (c) is independently developed without use of the disclosing party&apos;s Confidential Information; or (d) is received from a third party without restriction.
            </p>
            <p>
              <strong>9.4</strong> Confidentiality obligations under this Agreement will survive for three (3) years after termination of the engagement.
            </p>

            <p>
              <strong>9.5</strong> De-identified, Aggregated Data. You authorize us to de-identify and aggregate usage and advertising performance data across clients to improve our models and Services, conduct research, and develop benchmarks. We retain rights in the resulting datasets and benchmarks, but not ownership of your underlying data. We will remove identifiers and combine data so that it cannot reasonably identify you, a creator, an individual, or a particular account, or reveal your confidential metrics. We will not attempt to re-identify this data. Subject to applicable law and platform terms, we may retain and use these datasets after an engagement ends; this is a limited exception to Sections 9.2 and 11.2(d), not permission to disclose raw client data or personal information.
            </p>

            <p>
              <strong>9.6</strong> Safeguards and Incidents. We will maintain reasonable administrative, technical, and organizational safeguards for client Confidential Information. We will not sell your Confidential Information or disclose it to another client or a competitor, except for information that meets Section 9.3 or de-identified, aggregated data under Section 9.5. If we become aware of unauthorized access to or disclosure of your Confidential Information in our custody, we will notify you without undue delay, provide available information reasonably needed to respond, and take reasonable steps to contain and address the incident, subject to applicable law.
            </p>

            <p>
              <strong>9.7</strong> Non-Exclusivity. We may work with other clients, including your competitors, provided we comply with our confidentiality obligations and do not use your Confidential Information to provide services to them. Any exclusivity commitment must be expressly agreed in writing.
            </p>

            <h2 id="portfolio">10. Portfolio and Publicity</h2>
            <p>
              <strong>10.1</strong> Unless you provide us with written notice to the contrary, you agree that we may: (a) identify you as a client in our marketing materials, website, and presentations; (b) use your brand name and logo for portfolio and marketing purposes; and (c) display published Deliverables as permitted by Section 4.3; and (d) display de-identified, aggregated benchmarks that meet Section 9.5. Client-specific results require your prior written consent under Section 10.2.
            </p>
            <p>
              <strong>10.2</strong> We will not disclose specific performance data, revenue figures, or other confidential metrics without your prior written consent.
            </p>
            <p>
              <strong>10.3</strong> If you wish to restrict or revoke our use of your brand name, logo, or any Deliverables for marketing purposes, you may do so at any time by providing written notice.
            </p>

            <h2 id="termination">11. Term and Termination</h2>
            <p>
              <strong>11.1</strong> This Agreement is effective as of the date you first engage our Services and remains in effect for the duration of our working relationship. Because our Services are engaged on a per-project basis, either party may terminate this Agreement at any time with written notice.
            </p>
            <p>
              <strong>11.2</strong> Upon termination: (a) you will pay all outstanding fees for work completed prior to termination; (b) we will deliver any completed or in-progress Deliverables for which you have paid; (c) all licenses to Licensed Content will remain in effect for Deliverables that have been fully paid for; and (d) each party will return or destroy the other party&apos;s Confidential Information upon request.
            </p>
            <p>
              <strong>11.3</strong> We may terminate this Agreement immediately upon notice if you breach any material term, including but not limited to failure to pay invoiced amounts within 30 days of the due date.
            </p>
            <p>
              <strong>11.4</strong> Sections of this Agreement that by their nature should survive termination will survive, including but not limited to intellectual property rights, confidentiality obligations, warranty disclaimers, limitations of liability, and indemnification.
            </p>

            <h2 id="warranties">12. Disclaimer of Warranties</h2>
            <p>
              <strong>12.1</strong> THE SERVICES AND DELIVERABLES (INCLUDING LICENSED CONTENT AND AI-GENERATED CONTENT) ARE PROVIDED &quot;AS IS.&quot; EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.
            </p>
            <p>
              <strong>12.2</strong> WE DO NOT WARRANT THAT THE DELIVERABLES WILL ACHIEVE ANY SPECIFIC ADVERTISING PERFORMANCE, RETURN ON AD SPEND, CONVERSION RATE, OR OTHER BUSINESS RESULT. CREATIVE PERFORMANCE DEPENDS ON NUMEROUS FACTORS BEYOND OUR CONTROL, INCLUDING TARGETING, BUDGET, MARKET CONDITIONS, AND PRODUCT-MARKET FIT.
            </p>

            <h2 id="liability">13. Limitation of Liability</h2>
            <p>
              <strong>13.1</strong> IN NO EVENT WILL CAMPFIRE OR STUDIO TAK LLC BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOST PROFITS, LOST REVENUE, LOST DATA, OR LOSS OF BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SERVICES, REGARDLESS OF THE CAUSE OF ACTION, WHETHER IN CONTRACT, TORT, OR OTHERWISE.
            </p>
            <p>
              <strong>13.2</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SERVICES WILL NOT EXCEED THE TOTAL FEES PAID BY YOU TO US IN THE SIX (6) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>

            <h2 id="indemnification">14. Indemnification</h2>
            <p>
              <strong>14.1</strong> You agree to defend, indemnify, and hold harmless Studio Tak LLC, its officers, directors, employees, contractors, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorney&apos;s fees) arising out of or in connection with: (a) your Customer Content, including any claim that your Customer Content infringes any third party&apos;s intellectual property rights; (b) your use of the Deliverables in a manner not authorized by this Agreement; (c) your breach of this Agreement; or (d) false, misleading, or unsubstantiated product claims or missing endorsement disclosures for which you are responsible under Section 15.3, including related third-party false-advertising claims and government investigations, to the extent indemnification is permitted by law. This obligation does not apply to the extent a claim results from our gross negligence or willful misconduct.
            </p>
            <p>
              <strong>14.2</strong> We agree to defend, indemnify, and hold harmless you from and against any claims arising out of our gross negligence or willful misconduct in the performance of the Services.
            </p>

            <p>
              <strong>14.3</strong> Claims Procedure. The party seeking indemnification must give prompt written notice of a covered claim; delay relieves the indemnifying party only to the extent materially prejudiced. The indemnifying party may control the defense with reasonably acceptable counsel, and the other party will reasonably cooperate at the indemnifying party&apos;s expense and may participate with its own counsel at its own expense. Neither party may settle a claim in a way that binds the other party, admits its fault, or imposes obligations on it without that party&apos;s prior written consent, not to be unreasonably withheld. These procedures remain subject to any authority a government agency retains over an investigation.
            </p>

            <h2 id="acceptable-use">15. Acceptable Use</h2>
            <p>
              <strong>15.1</strong> You may not use the Services or Deliverables in any manner that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable. You are responsible for ensuring that your use of the Deliverables complies with all applicable laws and regulations, including advertising standards and platform policies.
            </p>
            <p>
              <strong>15.2</strong> Campfire does not support and will not tolerate its Services being used to promote discrimination based on race, religion, sex, sexual orientation, gender identity, age, disability, ancestry, or national origin. We reserve the right to refuse or terminate any engagement that involves content we deem discriminatory, harmful, or inconsistent with our values.
            </p>

            <p>
              <strong>15.3</strong> Product Claims and Endorsements. You are responsible for the accuracy and substantiation of product claims you supply or approve, including health, performance, and comparative claims, and must provide supporting evidence and required qualifications before publication. You must review final creative and copy and ensure endorsements reflect honest experiences and include clear, conspicuous disclosures of material connections where required by applicable law, including the FTC Endorsement Guides (16 CFR Part 255). Do not remove or obscure required disclosures. Our creative assistance does not replace your review or relieve either party of its own legal obligations.
            </p>

            <h2 id="dmca">16. Copyright and DMCA</h2>
            <p>
              <strong>16.1</strong> We take claims of copyright infringement seriously and will respond to notices of alleged infringement that comply with the Digital Millennium Copyright Act (17 U.S.C. § 512). If you believe any content on our Site infringes your copyright, you may submit a written DMCA notice to:
            </p>
            <div className={styles.contactBlock}>
              <p>Studio Tak LLC</p>
              <p>Email: info@studiotak.co</p>
            </div>
            <p>
              <strong>16.2</strong> Your DMCA notice must include: (1) your physical or electronic signature; (2) identification of the copyrighted work; (3) identification of the allegedly infringing material; (4) your contact information; (5) a good faith statement that the use is unauthorized; (6) a statement that the information is accurate; and (7) a statement under penalty of perjury that you are authorized to act on behalf of the copyright owner.
            </p>

            <h2 id="governing-law">17. Governing Law and Disputes</h2>
            <p>
              <strong>17.1</strong> This Agreement is governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law principles.
            </p>
            <p>
              <strong>17.2</strong> Any dispute arising out of or relating to this Agreement will first be attempted to be resolved through good-faith negotiation between the parties for a period of thirty (30) days. If the dispute cannot be resolved through negotiation, it will be submitted to binding arbitration administered by the American Arbitration Association in accordance with its Commercial Arbitration Rules. The arbitration will take place in Florida.
            </p>
            <p>
              <strong>17.3</strong> EACH PARTY AGREES THAT ANY DISPUTE WILL BE RESOLVED ON AN INDIVIDUAL BASIS AND NOT AS PART OF ANY CLASS OR REPRESENTATIVE ACTION.
            </p>
            <p>
              <strong>17.4</strong> ANY CAUSE OF ACTION ARISING OUT OF OR RELATING TO THIS AGREEMENT MUST BE COMMENCED WITHIN ONE (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES, OR IT IS PERMANENTLY BARRED.
            </p>

            <p>
              <strong>17.5</strong> Notwithstanding Section 17.2, either party may seek temporary or preliminary injunctive relief in a court of competent jurisdiction to prevent actual or threatened misuse of intellectual property or breach of confidentiality, without first completing negotiation or arbitration. The merits of the dispute remain subject to arbitration to the extent required by this Agreement.
            </p>

            <h2 id="general">18. General Provisions</h2>
            <p>
              <strong>18.1 Assignment.</strong> This Agreement is personal to you and may not be assigned or transferred without our prior written consent. We may freely assign this Agreement in connection with a merger, acquisition, or sale of assets.
            </p>
            <p>
              <strong>18.2 Severability.</strong> If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>
            <p>
              <strong>18.3 Non-Waiver.</strong> The failure of either party to enforce any right or provision of this Agreement will not constitute a waiver of that right or provision.
            </p>
            <p>
              <strong>18.4 Force Majeure.</strong> We will not be liable for any failure to perform due to circumstances beyond our reasonable control, including but not limited to natural disasters, pandemics, government actions, labor disputes, or disruptions to third-party services.
            </p>
            <p>
              <strong>18.5 Entire Agreement.</strong> This Agreement, together with any project scope or pricing agreed upon between the parties, constitutes the entire agreement between the parties and supersedes all prior communications and proposals, whether oral or written. Additional or conflicting terms in a purchase order, vendor portal, or other customer document do not amend this Agreement unless expressly accepted by both parties in writing.
            </p>
            <p>
              <strong>18.6 Notices.</strong> Any notices required under this Agreement should be sent to: Studio Tak LLC, at the email address info@studiotak.co, or to the email address you have provided to us.
            </p>

            <p>
              <em>If you have any questions about these Terms of Service, please contact us at info@studiotak.co.</em>
            </p>
    </GhostLegalPage>
  );
}
