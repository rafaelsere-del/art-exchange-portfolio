"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <form
        className="waitlist-form"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <input type="email" placeholder="your@studio.email" required />
        <button type="submit">{submitted ? "◇ Thank you" : "Request invite"}</button>
      </form>
      <div className="waitlist-role">
        <label><input type="radio" name="r" defaultChecked /> I&apos;m an artist</label>
        <label><input type="radio" name="r" /> I collect art</label>
        <label><input type="radio" name="r" /> Both</label>
      </div>
    </>
  );
}find . -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | sort