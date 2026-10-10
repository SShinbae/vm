import { CONTACT_EMAIL } from "@/components/landing/content";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocumentData {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

const SITE = "vm.wanahnaf.dev";

// Single source for the public web pages (/privacy, /terms) and the native
// in-app screen. Update lastUpdated whenever the text changes.
export const PRIVACY_POLICY: LegalDocumentData = {
  title: "Privacy Policy",
  lastUpdated: "11 October 2026",
  intro: `Vehicle Management ("the app", "we", "us") is a personal project run by Wan Ahnaf. This policy explains what information the app collects when you use it on the web at ${SITE} or on iOS and Android, how it is used, and the choices you have.`,
  sections: [
    {
      heading: "Information we collect",
      paragraphs: ["We collect only what the app needs to work:"],
      bullets: [
        "Account details: your email address, name and, if you add one, a profile photo.",
        "Google sign-in: if you sign in with Google, we receive your name, email address and profile picture from your Google account. We do not receive your Google password or access to any other Google data.",
        "Vehicle data you enter: vehicles, fuel, mileage and service logs, costs, notes, receipt photos and vehicle images.",
        "Family groups: the groups you create or join, who you invite by email, and which vehicles are shared with each group.",
        "Notification data: a push notification token for each device where you allow notifications, and your notification preferences.",
        "Usage analytics: which screens and features are used, and basic device and browser information, to understand how the app is used and improve it.",
        "Crash reports: technical details about errors and crashes, such as the device model, operating system version and the error that occurred.",
      ],
    },
    {
      heading: "How we use your information",
      bullets: [
        "To create and secure your account and sign you in.",
        "To store and display your vehicles, logs, receipts and reports.",
        "To share vehicles and logs with the family members you invite.",
        "To send notifications you have turned on, such as service reminders, cost alerts and updates when a family member adds a log.",
        "To send account emails, such as email confirmation, password reset and group invitations.",
        "To find and fix bugs and to improve the app.",
      ],
      paragraphs: [
        "We do not sell your information, use it for advertising, or use it to build advertising profiles.",
      ],
    },
    {
      heading: "Service providers",
      paragraphs: [
        "The app relies on these providers to run. Each one processes data only to provide its service to us:",
      ],
      bullets: [
        "Supabase: database, sign-in and file storage (your account, vehicle data and images).",
        "Netlify: website hosting and server functions.",
        "Expo Push Notifications, Firebase Cloud Messaging (Google) and Apple Push Notification service: delivering push notifications.",
        "Brevo: sending account and invitation emails.",
        "PostHog: usage analytics.",
        "Sentry: crash and error reporting.",
        "Google: sign-in with Google.",
      ],
    },
    {
      heading: "Google user data",
      paragraphs: [
        "When you sign in with Google, we use your Google name, email address and profile picture only to create and sign in to your account and to show your name and photo in the app. We do not share this data with anyone except the service providers listed above, and we do not use it for advertising.",
        "Vehicle Management's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.",
      ],
    },
    {
      heading: "Sharing with other people",
      paragraphs: [
        "Your vehicles and logs are private to you. They are visible to other people only when you share a vehicle with a family group, and then only to the members of that group. Group members can see your name and email address.",
        "We may disclose information if the law requires it, or to protect the safety of users or the service.",
      ],
    },
    {
      heading: "Data storage and security",
      paragraphs: [
        "Your data is stored in a Supabase Postgres database protected by row-level security, so each account can read only its own data and the data shared with its groups. Connections to the app are encrypted with HTTPS. No system is perfectly secure, but we take reasonable steps to protect your information.",
      ],
    },
    {
      heading: "Retention and deletion",
      bullets: [
        "We keep your account and vehicle data for as long as your account exists.",
        "Push notification tokens that have not been used for 60 days are deleted automatically.",
        `To delete your account and all associated vehicles, logs, receipts and images, email ${CONTACT_EMAIL} from the email address on your account. We will confirm and complete the deletion within 30 days.`,
      ],
    },
    {
      heading: "Your choices and rights",
      bullets: [
        "View and update your profile details in the app at any time.",
        "Turn notifications off in the app's notification settings or in your device settings.",
        "Ask for a copy of your data, a correction, or deletion by emailing us.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "The app is not intended for children under 13, and we do not knowingly collect information from them. If you believe a child has created an account, contact us and we will delete it.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this policy as the app changes. We will update the date at the top of this page and, for significant changes, let you know in the app or by email.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        `Questions about this policy or your data: ${CONTACT_EMAIL}`,
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocumentData = {
  title: "Terms of Service",
  lastUpdated: "11 October 2026",
  intro: `These terms apply to your use of Vehicle Management ("the app", "we", "us"), a personal project run by Wan Ahnaf, on the web at ${SITE} and on iOS and Android. By creating an account or using the app, you agree to these terms.`,
  sections: [
    {
      heading: "The service",
      paragraphs: [
        "Vehicle Management helps you track your vehicles, fuel, mileage, servicing and costs, and share them with family members. The app is free to use.",
      ],
    },
    {
      heading: "Your account",
      bullets: [
        "Give accurate information when you sign up and keep it up to date.",
        "Keep your password secure. You are responsible for activity on your account.",
        "Tell us promptly if you think someone else has accessed your account.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: ["Do not:"],
      bullets: [
        "use the app for anything illegal;",
        "upload content you do not have the right to share, or content that is harmful or offensive;",
        "try to access other people's data, or interfere with or overload the service;",
        "copy, resell or reverse-engineer the service.",
      ],
    },
    {
      heading: "Your content",
      paragraphs: [
        "You own the information and images you add to the app. You give us permission to store, process and display that content only to run the app for you and the people you share it with.",
      ],
    },
    {
      heading: "Family groups",
      paragraphs: [
        "When you share a vehicle with a group, its members can see and add logs for that vehicle. Invite only people you trust. You can remove members or stop sharing at any time.",
      ],
    },
    {
      heading: "Availability and changes",
      paragraphs: [
        "We work to keep the app running but do not guarantee it will always be available or free of errors. We may change, add or remove features, or stop the service. If we stop the service, we will try to give you notice so you can request a copy of your data.",
      ],
    },
    {
      heading: "No warranty",
      paragraphs: [
        'The app is provided "as is" and "as available", without warranties of any kind. Costs, fuel efficiency figures and reminders are estimates based on the information you enter. Always follow your vehicle manufacturer\'s maintenance schedule.',
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the extent the law allows, we are not liable for any indirect or consequential loss, or for loss of data, arising from your use of the app. Nothing in these terms limits any liability that cannot be limited by law.",
      ],
    },
    {
      heading: "Ending your use",
      paragraphs: [
        `You can stop using the app at any time and ask us to delete your account by emailing ${CONTACT_EMAIL}. We may suspend or close accounts that break these terms.`,
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these terms. We will update the date at the top of this page and, for significant changes, let you know in the app or by email. Continuing to use the app after a change means you accept the updated terms.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [`Questions about these terms: ${CONTACT_EMAIL}`],
    },
  ],
};
