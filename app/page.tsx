import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Welcome To TruckTrack This is Yash and Rudra
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
          </a>
        </div>
      </div>
      <html>
  <head>
    <title>Custom Controls</title>
    <script>
      /**
       * @license
       * Copyright 2019 Google LLC. All Rights Reserved.
       * SPDX-License-Identifier: Apache-2.0
       */
      let map;
      const chicago = { lat: 41.85, lng: -87.65 };

      /**
       * Creates a control that recenters the map on Chicago.
       */
      function createCenterControl(map) {
        const controlButton = document.createElement("button");
        // Set CSS for the control.
        controlButton.classList.add('buttonStyle');

        controlButton.textContent = "Center Map";
        controlButton.title = "Click to recenter the map";
        controlButton.type = "button";
        // Setup the click event listeners: simply set the map to Chicago.
        controlButton.addEventListener("click", () => {
          map.setCenter(chicago);
        });
        return controlButton;
      }

      function initMap() {
        map = new google.maps.Map(document.getElementById("map"), {
          zoom: 4,
          center: { lat: 49.496675, lng: -102.65625 },
        });

        var georssLayer = new google.maps.KmlLayer({
          url: "http://api.flickr.com/services/feeds/geo/?g=322338@N20&lang=en-us&format=feed-georss",
        });
        georssLayer.setMap(map);

        // Create the DIV to hold the control.
        const centerControlDiv = document.createElement("div");
        // Create the control.
        const centerControl = createCenterControl(map);

        // Append the control to the DIV.
        centerControlDiv.appendChild(centerControl);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(
          centerControlDiv
        );
      }

      window.initMap = initMap;
    </script>
    <style>
      /**
       * @license
       * Copyright 2019 Google LLC. All Rights Reserved.
       * SPDX-License-Identifier: Apache-2.0
       */
      /** 
       * Always set the map height explicitly to define the size of the div element
       * that contains the map. 
       */
      #map {
        height: 100%;
      }

      /** 
       * Optional: Makes the sample page fill the window. 
       */
      html,
      body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA-TlVuQXWUgjmMxpLS4qmWjv164jkl75c&callback=initMap&v=weekly&solution_channel=GMP_CCS_customcontrols_v2"
      defer
    ></script>
  </body>
</html>