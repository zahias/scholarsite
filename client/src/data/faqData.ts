export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: "Where does the publication data come from?",
    answer:
      "All publication data comes from OpenAlex, a free and open index of 250\u202fM+ scholarly works. Your profile syncs automatically. Use the \"Report an issue\" button on any profile page to flag data problems.",
  },
  {
    question: "How accurate is the publication matching?",
    answer:
      "OpenAlex uses advanced algorithms, but no system is perfect for common names. You can see all attributed publications and use the \"Report an issue\" button to flag any that don\u2019t belong to you.",
  },
  {
    question: "Can I edit my publications?",
    answer:
      "You control your bio, photo, themes, and featured works. The publication list comes from OpenAlex \u2014 use the \"Report an issue\" button on your profile and we\u2019ll guide you through requesting corrections.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes! Pro plan includes custom domains (yourname.com). Starter uses yourname.scholar.name. Both are professional and memorable.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "Cancel anytime from your dashboard settings. Your profile stays active until the billing period ends, then becomes private (not deleted). Reactivate anytime.",
  },
  {
    question: "How does the auto-sync work?",
    answer:
      "We periodically query OpenAlex for your author record. When new publications appear, they\u2019re automatically added to your portfolio \u2014 no action needed on your part.",
  },
  {
    question: "Can I share my profile during the free trial?",
    answer:
      "Yes! Your portfolio goes live immediately when you sign up. The 14-day free trial gives you full access. After the trial, choose a plan to keep it active.",
  },
];
