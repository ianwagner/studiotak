import { StaticPage, createStaticPageMetadata } from "@/components/StaticPage";
import styles from "@/components/StaticPage.module.css";

export const revalidate = 120;
export const dynamic = "force-static";

const lastUpdated = "May 28, 2026";
const description =
  "How Studio Tak (Campfire) collects, uses, shares, and protects your information when you use our website or engage our services.";

export const metadata = createStaticPageMetadata({
  title: "Privacy Policy | Studio Tak / Campfire",
  description,
  path: "/privacy-policy"
});

export default function PrivacyPolicyPage() {
  return (
    <StaticPage title="Privacy Policy" lastUpdated={lastUpdated}>
            <p className={styles.intro}>
              Studio Tak LLC, doing business as Campfire (&quot;we,&quot; &quot;us,&quot; and &quot;our&quot;), is committed to protecting your privacy and the personal information you provide to us when accessing or using our services, products, or website at www.studiotak.co (the &quot;Site&quot;). This privacy policy (this &quot;Policy&quot;) explains how we collect, use, disclose, and protect information when you visit our Site or engage our services.
            </p>
            <p>
              This Policy may be updated from time to time. Changes will be posted at this URL and are effective when posted. Your continued use of our Site or services following any updates constitutes your acceptance of those changes. If you do not agree with this Policy, please do not use our Site and do not provide any information to us.
            </p>
            <p>
              Unless otherwise defined in this Policy, terms used here have the same meaning given to them in our <a href="/terms-of-service">Terms of Service</a>.
            </p>

            <h2 id="scope">1. Scope and Restrictions</h2>
            <p>
              <strong>1.1</strong> This Policy covers your interactions with our Site and our creative production services (the &quot;Services&quot;). It applies to information we collect online through our Site, via email, and through our business relationship with you.
            </p>
            <p>
              <strong>1.2</strong> Our Services are intended for business users acting on behalf of an organization. Our Site and Services are not directed to children. We do not knowingly collect personal information from children under the age of 13. If we become aware that we have collected information from a child under 13, we will take steps to delete that information. See Section 13 for more.
            </p>

            <h2 id="information-we-collect">2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>
              Personal information is data that identifies you or can be used to identify or contact you (&quot;Personal Information&quot;). We may collect the following types of Personal Information:
            </p>
            <ul>
              <li>Contact information: name, email address, phone number, company name, and job title</li>
              <li>Account and registration information when you create an account on our Site or engage our Services</li>
              <li>Project-related information you provide to us, including brand assets, performance data, ad account access credentials, and creative briefs</li>
              <li>Communication records, including emails, messages, and any correspondence between us</li>
              <li>Billing information, including your name, billing address, and payment method details (processed through our payment processor, currently Stripe, see Section 4)</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>
              When you visit our Site, we and our service providers may automatically collect certain information, including:
            </p>
            <ul>
              <li>Log data: IP address, browser type and version, operating system, referring URLs, pages visited, and timestamps</li>
              <li>Device information: device type, screen resolution, language settings, and unique device identifiers</li>
              <li>Usage data: how you interact with our Site, including pages viewed, links clicked, time spent on pages, and navigation patterns</li>
              <li>Location data: approximate geographic location derived from your IP address</li>
            </ul>

            <h3>2.3 Information From Third Parties</h3>
            <p>
              We may receive information about you from third parties, including business partners, marketing partners, social media platforms, and publicly available sources. This may include contact information, company details, and professional profile data.
            </p>
            <p>
              We ask that you do not send us any sensitive personal information (such as social security numbers, health information, financial account numbers, or government-issued identification numbers) unless specifically requested and necessary for the Services.
            </p>

            <h2 id="how-we-use">3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>

            <h3>3.1 Providing Services</h3>
            <ul>
              <li>To deliver our creative production services, including producing ad creative, analyzing performance data, and managing your projects</li>
              <li>To communicate with you about your projects, deliverables, timelines, and account</li>
              <li>To process payments and send invoices</li>
              <li>To provide customer support and respond to your inquiries</li>
            </ul>

            <h3>3.2 Improving Our Services</h3>
            <ul>
              <li>To analyze usage patterns and improve our Site and Services</li>
              <li>To conduct internal research and development</li>
              <li>To develop new features, products, and services</li>
            </ul>

            <h3>3.3 Marketing and Communications</h3>
            <ul>
              <li>To send you marketing emails about our services, industry insights, and creative strategy content (you may opt out at any time, see Section 8)</li>
              <li>To display relevant advertising to you on other platforms</li>
              <li>To understand the effectiveness of our marketing efforts</li>
            </ul>

            <h3>3.4 Legal and Security</h3>
            <ul>
              <li>To comply with legal obligations and respond to lawful requests from public authorities</li>
              <li>To protect our rights, privacy, safety, or property, and that of our clients and others</li>
              <li>To detect, prevent, and address fraud, security issues, or technical problems</li>
              <li>To enforce our Terms of Service</li>
            </ul>

            <h3>3.5 Artificial Intelligence and Automated Processing</h3>
            <p>
              We use third-party artificial intelligence services to support our creative production and analytics work, including generating and refining creative concepts, analyzing performance data, and improving the quality and speed of our deliverables. Our current AI service providers include Anthropic (Claude) and other providers we may engage from time to time. When we use these tools, we limit the information shared to what is necessary for the task. Our AI service providers are contractually restricted from using your information to train their models or for any purpose other than providing services to us. We do not use AI services to make decisions that produce legal or similarly significant effects about you without human review.
            </p>

            <h2 id="payment">4. Payment Processing</h2>
            <p>
              <strong>4.1</strong> We use third-party payment processors to collect payments made through our Site and Services. Our current payment processor is Stripe. When you make a payment, your payment information (such as credit card number, expiration date, and billing address) is collected and processed directly by our payment processor. We do not store your full payment card details on our servers.
            </p>
            <p>
              <strong>4.2</strong> Your payment processor&apos;s collection and use of your payment information is governed by that processor&apos;s own privacy policy. Our current processor is Stripe, whose privacy policy is available at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>. We encourage you to review the applicable processor&apos;s privacy policy before making a payment.
            </p>
            <p>
              <strong>4.3</strong> We may receive limited payment information from our payment processor, such as the last four digits of your card number, card type, and billing address, for our records and to facilitate customer support.
            </p>

            <h2 id="cookies">5. Cookies and Tracking Technologies</h2>
            <p>
              <strong>5.1</strong> We use cookies, pixel tags, web beacons, and similar technologies (collectively, &quot;Tracking Technologies&quot;) to collect information about your interactions with our Site, improve your experience, and deliver targeted advertising.
            </p>

            <h3>5.2 Types of Cookies We Use</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the Site to function properly. These enable core features like security, account access, and form submissions. You cannot opt out of essential cookies.</li>
              <li><strong>Analytics Cookies:</strong> We use Google Analytics (GA4) and similar tools to understand how visitors interact with our Site, including which pages are visited most, how long visitors stay, and how they navigate between pages. This data helps us improve our Site and Services.</li>
              <li><strong>Advertising Cookies:</strong> We use Meta (Facebook) Pixel and similar tracking technologies to measure the effectiveness of our advertising, deliver targeted ads to relevant audiences, and build custom audiences for remarketing. These cookies may track your activity across other websites and platforms.</li>
              <li><strong>Functionality Cookies:</strong> These cookies remember choices you make and preferences you set, such as your language and display settings, to provide a more personalized experience. Disabling them may affect how certain features of our Site behave.</li>
              <li><strong>Security Cookies:</strong> We use these cookies to help identify and prevent potential security risks, support authentication, and protect against fraudulent activity.</li>
              <li><strong>Third-Party Cookies:</strong> Our Site may include content and tools from third-party services (such as embedded forms, chat widgets, or social media integrations) that may set their own cookies. We do not control these third-party cookies.</li>
            </ul>

            <h3>5.3 Managing Cookies</h3>
            <p>
              Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies, delete existing cookies, or alert you when a cookie is being placed. However, disabling cookies may affect the functionality of our Site.
            </p>
            <p>
              You can opt out of Google Analytics tracking by installing the Google Analytics Opt-Out Browser Add-on. You can manage your Meta ad preferences through your Facebook account settings.
            </p>

            <h3>5.4 Do Not Track</h3>
            <p>
              Our Site does not currently respond to &quot;Do Not Track&quot; (DNT) signals sent by web browsers. Some third-party services integrated with our Site may track your browsing activity across other websites.
            </p>

            <h2 id="sharing">6. How We Share Your Information</h2>
            <p>We do not sell your Personal Information. We may share your information in the following circumstances:</p>
            <p>
              <strong>6.1 Service Providers.</strong> We may share information with third-party service providers who perform services on our behalf, including payment processing (Stripe), email marketing, analytics, hosting, artificial intelligence services, and customer support. These providers are contractually obligated to use your information only as necessary to provide services to us and in accordance with this Policy.
            </p>
            <p>
              <strong>6.2 Analytics and Advertising Partners.</strong> We share data collected through Tracking Technologies with analytics providers (such as Google) and advertising platforms (such as Meta/Facebook) to measure advertising effectiveness and deliver targeted ads. This data may include device identifiers, browsing behavior, and interaction data, but typically does not include your name or email address.
            </p>
            <p>
              <strong>6.3 UGC Creators and Production Partners.</strong> In the course of providing Services, we may share limited information about your brand (such as brand name, product details, and creative direction) with UGC creators and production partners we engage on your behalf. We will not share your confidential business data, performance metrics, or financial information with these parties.
            </p>
            <p>
              <strong>6.4 Legal Requirements.</strong> We may disclose information if required to do so by law, regulation, legal process, or government request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government request.
            </p>
            <p>
              <strong>6.5 Business Transfers.</strong> If Studio Tak LLC is involved in a merger, acquisition, reorganization, sale of assets, or bankruptcy, your information may be transferred as part of that transaction. We will notify you of any such change by posting an updated Policy on our Site.
            </p>
            <p>
              <strong>6.6 With Your Consent.</strong> We may share your information for any other purpose with your explicit consent.
            </p>

            <h2 id="security">7. Data Security</h2>
            <p>
              <strong>7.1</strong> We take reasonable precautions to protect your information from unauthorized access, alteration, disclosure, or destruction. These measures include encryption of data in transit, secure access controls, and regular security assessments.
            </p>
            <p>
              <strong>7.2</strong> However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security. We are not responsible for any breach of security caused by third parties or circumstances beyond our reasonable control.
            </p>
            <p>
              <strong>7.3</strong> You are responsible for maintaining the confidentiality of any account credentials, passwords, or access tokens you use with our Services. If you believe your account has been compromised, please contact us immediately at info@studiotak.co.
            </p>

            <h2 id="rights">8. Your Rights and Choices</h2>
            <h3>8.1 Marketing Communications</h3>
            <p>
              You may opt out of receiving marketing emails from us at any time by clicking the &quot;unsubscribe&quot; link in any marketing email, or by contacting us at info@studiotak.co. Please note that even if you opt out of marketing emails, we may still send you transactional communications related to your projects, invoices, and account.
            </p>
            <h3>8.2 Access, Correction, and Deletion</h3>
            <p>
              You have the right to request access to the Personal Information we hold about you, to request corrections to inaccurate information, and to request deletion of your information, subject to legal and contractual obligations. To make such a request, please contact us at info@studiotak.co. We will respond to your request within a reasonable timeframe and in accordance with applicable law.
            </p>
            <h3>8.3 Data Portability</h3>
            <p>
              Where applicable law provides you with the right to data portability, you may request a copy of your Personal Information in a structured, commonly used, and machine-readable format. Contact us at info@studiotak.co to make such a request.
            </p>
            <h3>8.4 Cookie Preferences</h3>
            <p>
              You can manage your cookie preferences through your browser settings. See Section 5.3 for details on managing specific types of cookies.
            </p>

            <h2 id="retention">9. Data Retention</h2>
            <p>
              <strong>9.1</strong> We retain your Personal Information only for as long as necessary to fulfill the purposes described in this Policy, unless a longer retention period is required or permitted by law. The criteria we use to determine retention periods include: (a) the length of our business relationship with you; (b) whether we have a legal obligation to retain the data; and (c) whether retention is advisable for legal, compliance, or dispute resolution purposes.
            </p>
            <p>
              <strong>9.2</strong> Project-related information (including creative briefs, performance data, and deliverables) is retained for the duration of our business relationship and for up to seven (7) years after the conclusion of the engagement, to support potential follow-on work, dispute resolution, and tax and accounting requirements. If you wish to have project data deleted sooner, please contact us in writing and we will accommodate the request to the extent legally permissible.
            </p>
            <p>
              <strong>9.3</strong> Marketing data (such as contact information collected for marketing communications) is retained until you opt out, after which we will retain only the minimum necessary to honor your opt-out preference.
            </p>
            <p>
              <strong>9.4</strong> Aggregated or anonymized data that does not identify you personally may be retained and used indefinitely for analytics, research, and service improvement purposes.
            </p>

            <h2 id="california">10. California Privacy Rights</h2>
            <p>
              <strong>10.1</strong> If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA). These rights include the right to know what Personal Information we collect, disclose, and sell; the right to request deletion of your Personal Information; the right to opt out of the sale or sharing of your Personal Information; and the right to non-discrimination for exercising your privacy rights.
            </p>
            <p>
              <strong>10.2</strong> We do not sell your Personal Information as defined under the CCPA/CPRA. We may share information with advertising partners (such as Meta and Google) for targeted advertising purposes, which may constitute &quot;sharing&quot; under the CPRA. You may opt out of this sharing by managing your cookie preferences or contacting us at info@studiotak.co.
            </p>
            <p>
              <strong>10.3</strong> To exercise any of your California privacy rights, please contact us at info@studiotak.co. We may need to verify your identity before processing your request.
            </p>

            <h2 id="other-rights">11. Other State and International Privacy Rights</h2>
            <p>
              <strong>11.1</strong> Residents of other U.S. states with comprehensive privacy laws (including Virginia, Colorado, Connecticut, and others) may have similar rights to those described in Section 10. To exercise your rights under applicable state law, please contact us at info@studiotak.co.
            </p>
            <p>
              <strong>11.2</strong> If you are located outside of the United States, please be aware that information you provide to us may be transferred to, stored, and processed in the United States. By using our Site or engaging our Services, you consent to the transfer of your information to the United States, which may have different data protection laws than your country of residence.
            </p>
            <p>
              <strong>11.3</strong> If you are a resident of the European Economic Area (EEA) or United Kingdom, we process your Personal Information on the following legal bases: (a) your consent; (b) performance of a contract with you; (c) our legitimate business interests; or (d) compliance with legal obligations. You have the right to withdraw consent at any time, lodge a complaint with your local data protection authority, and exercise your rights under the General Data Protection Regulation (GDPR).
            </p>

            <h2 id="third-party">12. Third-Party Links and Services</h2>
            <p>
              <strong>12.1</strong> Our Site may contain links to third-party websites, applications, or services that are not operated by us. We are not responsible for the privacy practices or content of these third-party services. We encourage you to review the privacy policies of any third-party services before providing them with your information.
            </p>
            <p>
              <strong>12.2</strong> Our Services may require integration with third-party platforms (such as Meta Ads Manager or other advertising platforms). Your use of these platforms is governed by their respective terms and privacy policies. We are not responsible for how these platforms handle your data.
            </p>

            <h2 id="children">13. Children&apos;s Privacy</h2>
            <p>
              Our Site and Services are not directed to children. We do not knowingly collect Personal Information from children under the age of 13 in accordance with the Children&apos;s Online Privacy Protection Act (COPPA). If you are a parent or guardian and believe that your child has provided us with Personal Information, please contact us at info@studiotak.co and we will take steps to delete such information. Our Services are intended for business users, and we expect all users of our Services to be at least 18 years of age and authorized to act on behalf of their organization.
            </p>

            <h2 id="governing-law">14. Governing Law</h2>
            <p>
              This Policy is governed by the laws of the State of Florida, without regard to its conflict of law principles. Any disputes arising under this Policy will be resolved in accordance with the dispute resolution procedures described in our <a href="/terms-of-service">Terms of Service</a>.
            </p>

            <h2 id="changes">15. Changes to This Policy</h2>
            <p>
              We may update this Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make material changes, we will update the &quot;Last Updated&quot; date at the top of this Policy. We encourage you to review this Policy periodically. Your continued use of our Site or Services after any changes constitutes your acceptance of the updated Policy.
            </p>

            <h2 id="contact">16. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className={styles.contactBlock}>
              <p>Studio Tak LLC</p>
              <p>Email: info@studiotak.co</p>
            </div>
            <p>
              For privacy-specific inquiries, data access requests, or to exercise any of your rights described in this Policy, please email info@studiotak.co with the subject line &quot;Privacy Request.&quot;
            </p>
    </StaticPage>
  );
}
