import type { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

export const CONTACT_EMAIL = "ahnaf@wanahnaf.dev";
export const GITHUB_URL = "https://github.com/SShinbae/vm";

// Only claims backed by shipped features — no invented usage numbers.
export const FACTS: { icon: IconName; label: string }[] = [
  { icon: "pricetag-outline", label: "Free to use" },
  { icon: "phone-portrait-outline", label: "iOS · Android · Web" },
  { icon: "camera-outline", label: "Receipt photos" },
  { icon: "people-outline", label: "Share with family" },
];

export const FEATURES: {
  icon: IconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "wallet-outline",
    title: "See where the money goes",
    description:
      "Log services, repairs, insurance and road tax in seconds. Snap the receipt so you never dig through the glovebox again.",
  },
  {
    icon: "water-outline",
    title: "Know your real fuel cost",
    description:
      "Record each fill-up and get your actual consumption and cost per kilometre, not the brochure number.",
  },
  {
    icon: "people-outline",
    title: "Share cars with family",
    description:
      "Put household vehicles in a group and invite family members. Everyone logs to the same history.",
  },
  {
    icon: "stats-chart-outline",
    title: "Spot trends early",
    description:
      "Charts show monthly spending and fuel efficiency over time, so a costly change stands out before it hurts.",
  },
];

export const STEPS: { title: string; description: string }[] = [
  {
    title: "Add your vehicle",
    description: "Enter the plate, model and current mileage. Takes a minute.",
  },
  {
    title: "Log fuel and expenses",
    description: "Record each fill-up or bill as it happens, with a photo.",
  },
  {
    title: "See the trends",
    description: "Your dashboard turns the logs into costs and efficiency.",
  },
];

export const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is it free?",
    answer:
      "Yes. Vehicle Management is free to use with no paid plans and no ads. Create an account, add your vehicles and start logging straight away. There is no trial period and no credit card is required.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Your data is stored in a Supabase Postgres database with row-level security, so only you and the family members you invite can read your vehicles and logs. Connections are encrypted. The privacy policy explains exactly what is collected.",
  },
  {
    question: "Which devices can I use?",
    answer:
      "Use it in any modern browser, or install the app on iPhone and Android. Your account syncs across all of them, so a fill-up logged on your phone shows up on the web dashboard immediately.",
  },
  {
    question: "Can my family share a vehicle?",
    answer:
      "Yes. Create a group, add the household vehicles and invite family members by email. Everyone in the group can log fuel and expenses against the same vehicle, and the history stays in one place.",
  },
  {
    question: "Can I delete my data?",
    answer: `Yes. Email ${CONTACT_EMAIL} from your account address and your account and all associated vehicles, logs and receipts will be permanently deleted. The privacy policy covers retention in more detail.`,
  },
];
