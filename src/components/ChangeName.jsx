"use client";

import { useState, useEffect } from "react";
import { showSuccess, showError } from "@/app/utils/Toast";

export default function ChangeName({ userId }) {
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [loading, setLoading] = useState(false);
  const minLen = 5;
  const maxLen = 15;

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const baseUrl = process.env.GET_NAME_URL;
        const url = baseUrl
          ? `${baseUrl}?userId=${user.id}`
          : `http://localhost:5050/api/name/get?userId=${user.id}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message);
        }

        const data = await res.json();
        setOriginalName(data.name);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        showError("Could not retrieve username");
      }
    };

    fetchUsername();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      showError("Enter a new valid username (15 characters max)");
      return;
    }

    if (trimmed.length < minLen || trimmed.length > maxLen) {
      toast.error(`Name must be ${minLen}-${maxLen} characters.`);
      return;
    }

    if (trimmed === originalName) {
      showError("New username must differ from the old one");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = process.env.CHANGE_NAME;
      const url = baseUrl
        ? `${baseUrl}?userId=${userId}`
        : `http://localhost:5050/api/name/change?userId=${userId}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      setOriginalName(trimmed);
      setName("");
      showSuccess("Username updated successfully!");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError("Could not update the username");
    } finally {
      setLoading(false);
    }
  };

  const currentCount =
    name.trim().length > 0
      ? name.trim().length
      : originalName
      ? originalName.length
      : 0;

  return (
    <div className="w-full max-w-4xl">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-100 rounded-md p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-700">
          Choose a display name
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          This is the name that will be shown in your transactions inside
          families. Try to keep it short and recognizable.
        </p>

        <label
          htmlFor="displayName"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Display name
        </label>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            id="displayName"
            name="displayName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={originalName || ""}
            className="w-full sm:flex-1 min-w-0 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            maxLength={maxLen}
            aria-describedby="nameHelp"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-w-[96px] px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>

        <div id="nameHelp" className="text-xs text-gray-500 mt-2">
          {currentCount}/{maxLen} characters
        </div>
      </form>
    </div>
  );
}
