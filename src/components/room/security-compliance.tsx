"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  MapPin,
  HelpCircle,
} from "lucide-react";

const TRUST_PORTAL_URL = "https://trust.linkrunner.io";

/* ------------------------------------------------------------------ */
/*  Data — scraped from trust.linkrunner.io                            */
/* ------------------------------------------------------------------ */

const COMPLIANCE_ITEMS = [
  {
    name: "GDPR",
    badge: "GDPR",
    verified: true,
    color: "#1a237e",
  },
  {
    name: "ISO 27001:2022",
    badge: "ISO",
    verified: true,
    color: "#0d47a1",
  },
  {
    name: "SOC 2",
    badge: "SOC 2",
    verified: true,
    color: "#212121",
  },
];

const DOCUMENTS = [
  { name: "GDPR", category: "Compliance", count: 1, isPrivate: true },
  { name: "ISO 27001:2022", category: "Compliance", count: 1, isPrivate: true },
  { name: "SOC 2", category: "Compliance", count: 1, isPrivate: true },
];

const SUB_PROCESSORS = [
  { name: "Google Cloud", location: "Global" },
  { name: "Slack", location: "United States" },
  { name: "Amazon Web Services", location: "Global" },
  { name: "Google Workspace", location: "United States" },
  { name: "GitHub", location: "United States" },
];

const FAQS = [
  {
    question: "How can we report a security issue?",
    answer:
      "You can report security concerns by contacting us at support@linkrunner.io. We take all reports seriously and respond promptly.",
  },
  {
    question: "Are you GDPR compliant?",
    answer:
      "Yes. Linkrunner follows GDPR-aligned data protection practices and supports customer requirements such as data access, deletion, and processing transparency.",
  },
  {
    question: "How does Linkrunner protect customer data?",
    answer:
      "We implement controls including:\n- Encryption in transit and at rest\n- Access controls and role-based permissions\n- Continuous monitoring and logging\n- Regular security audits and testing",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SecurityCompliance() {
  return (
    <div className="space-y-6">
      {/* Header with link to full portal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Security & Compliance
            </h2>
            <p className="text-xs text-gray-500">Linkrunner Trust Vault</p>
          </div>
        </div>
        <a
          href={TRUST_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          View Full Trust Portal
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Compliance badges */}
      <section className="rounded-xl bg-white p-5 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          Compliance
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {COMPLIANCE_ITEMS.map((item) => (
            <a
              key={item.name}
              href={TRUST_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-all hover:shadow-md"
            >
              {/* Badge icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {item.badge}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{item.name}</p>
                {item.verified && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              {/* Hover arrow */}
              <ExternalLink className="absolute right-3 top-3 h-3.5 w-3.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </section>

      {/* Documents */}
      <section className="rounded-xl bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Documents
          </h3>
          <a
            href={TRUST_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--brand-primary)" }}
          >
            Request Access
          </a>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DOCUMENTS.map((doc) => (
            <a
              key={doc.name}
              href={TRUST_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg bg-gray-50 p-4 transition-all hover:shadow-sm"
            >
              <FileText className="h-5 w-5 shrink-0 text-gray-500" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">{doc.category}</p>
                <p className="font-medium text-gray-900">{doc.name}</p>
                <p className="text-xs text-gray-400">
                  {doc.count} document{doc.count > 1 ? "s" : ""}
                </p>
              </div>
              {doc.isPrivate && (
                <Lock className="h-4 w-4 shrink-0 text-gray-300" />
              )}
            </a>
          ))}
        </div>
      </section>

      {/* Sub-Processors */}
      <section className="rounded-xl bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Sub-Processors
          </h3>
          <a
            href={TRUST_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--brand-primary)" }}
          >
            View all
          </a>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUB_PROCESSORS.map((sp) => (
            <div
              key={sp.name}
              className="flex items-center gap-3 rounded-lg bg-gray-50 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-gray-600">
                {sp.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{sp.name}</p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {sp.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="rounded-xl bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            FAQs
          </h3>
          <a
            href={TRUST_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--brand-primary)" }}
          >
            View all
          </a>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ accordion item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg bg-gray-50 transition-colors hover:bg-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <HelpCircle className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{question}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3.5 text-sm leading-relaxed text-gray-600">
          {answer.split("\n").map((line, i) => {
            if (line.startsWith("- ")) {
              return (
                <li key={i} className="ml-4 list-disc">
                  {line.slice(2)}
                </li>
              );
            }
            return <p key={i}>{line}</p>;
          })}
        </div>
      )}
    </div>
  );
}
