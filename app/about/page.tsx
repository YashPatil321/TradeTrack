"use client"; // This marks the file as a Client Component

import { useEffect } from "react";

export default function AboutPage() {
  useEffect(() => {
    // Any side effects or data fetching you want to include
    console.log("About page mounted");
  }, []);

  return (
    <div>
      <h1>About Us</h1>
      <p>This is the about page.</p>
    </div>
  );
}
