import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TwoFactorPage: React.FC = () => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // companyId passed from login page
  const { companyId } = location.state || {};

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/companies/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, token }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Success — continue to dashboard
        navigate("/dashboard");
      } else {
        setError(data.error || "Invalid token, please try again.");
      }
    } catch (err) {
      console.error("2FA verify error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600 mb-4 text-center">
          Enter the 6-digit code from your Authenticator app.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456"
            className="w-full border rounded-lg p-2 text-center text-lg tracking-widest"
          />

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorPage;
