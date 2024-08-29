// app/page.tsx
"use client"; // This marks the file as a Client Component

import { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  useEffect(() => {
    // Create the script element for Google Maps API
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c&callback=initMap&v=weekly&solution_channel=GMP_CCS_customcontrols_v2`;
    script.async = true;
    script.defer = true;

    // Define the initMap function
    window.initMap = function () {
      const map = new window.google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: { lat: 49.496675, lng: -102.65625 },
      });

      const chicago = { lat: 41.85, lng: -87.65 };

      // Create the custom control button
      const controlButton = document.createElement("button");
      controlButton.textContent = "Center Map";
      controlButton.title = "Click to recenter the map";
      controlButton.type = "button";
      controlButton.style.padding = "10px";
      controlButton.style.marginTop = "10px";
      controlButton.addEventListener("click", () => {
        map.setCenter(chicago);
      });

      // Add the control button to the map
      const centerControlDiv = document.createElement("div");
      centerControlDiv.appendChild(controlButton);
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);

      // Add a KML Layer to the map (optional)
      const georssLayer = new window.google.maps.KmlLayer({
        url: "http://api.flickr.com/services/feeds/geo/?g=322338@N20&lang=en-us&format=feed-georss",
      });
      georssLayer.setMap(map);
    };

    // Append the script to the head
    document.head.appendChild(script);

    // Cleanup script when component unmounts
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing HELLOOO YASH IS HERE&nbsp;
          Welcome To TruckTrack&nbsp;
          <code className="font-mono font-bold">app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" "}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>
      <div id="map" style={{ height: "500px", width: "100%" }}></div>
    </main>
  );
}
