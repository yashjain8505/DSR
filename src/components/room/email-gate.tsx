"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EmailGatePayload } from "@/lib/types";

interface EmailGateProps {
  roomId: string;
  companyName: string;
  onAuthenticated: (visitorId: string) => void;
}

/**
 * Email gate modal that captures visitor identity before showing room content.
 * Shown on first visit; visitor ID is stored in localStorage for subsequent visits.
 */
export function EmailGate({
  roomId,
  companyName,
  onAuthenticated,
}: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: EmailGatePayload = {
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
        room_id: roomId,
      };

      const response = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // 403 = restricted room and this email isn't on the allowlist
        if (response.status === 403 && data.error) {
          setError(data.error);
          return;
        }
        throw new Error("Failed to submit");
      }

      const visitorId = data.visitor_id;

      // Store visitor info in localStorage for subsequent visits
      localStorage.setItem(`dsr_visitor_id`, visitorId);
      localStorage.setItem(`dsr_visitor_email`, email.trim().toLowerCase());

      onAuthenticated(visitorId);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo / branding */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
            <img
              src="/logos/linkrunner-icon.png"
              alt="Linkrunner"
              className="h-12 w-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to your room
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {companyName} &times; Linkrunner
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
            autoFocus
          />
          <Input
            label="Your name (optional)"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] focus-visible:ring-[var(--brand-primary)]"
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
