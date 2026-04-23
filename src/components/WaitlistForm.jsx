import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("artist");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, "waitlist"), {
        email,
        role,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="your@studio.email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitted || loading}
        />
        <button type="submit" disabled={submitted || loading}>
          {submitted ? "◇ Thank you" : loading ? "Sending…" : "Request invite"}
        </button>
      </form>
      <div className="waitlist-role">
        <label>
          <input
            type="radio"
            name="r"
            value="artist"
            checked={role === "artist"}
            onChange={() => setRole("artist")}
          />
          I'm an artist
        </label>
        <label>
          <input
            type="radio"
            name="r"
            value="collector"
            checked={role === "collector"}
            onChange={() => setRole("collector")}
          />
          I collect art
        </label>
        <label>
          <input
            type="radio"
            name="r"
            value="both"
            checked={role === "both"}
            onChange={() => setRole("both")}
          />
          Both
        </label>
      </div>
      {error && <div style={{ color: "#c0392b", marginTop: 8, fontSize: 13 }}>{error}</div>}
    </>
  );
}