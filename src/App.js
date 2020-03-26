import ReactDOM from "react-dom";
import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";

import fetchFakeData from "./api/fetchFakeData";
import Popup from "./components/Popup";
import "./App.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const App = () => {
  const mapContainerRef = useRef(null);
  const popUpRef = useRef(new mapboxgl.Popup({ offset: 15 }));

  // initialize map when component mounts
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      // See style options here: https://docs.mapbox.com/api/maps/#styles
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-104.9876, 39.7405],
      zoom: 12.5
    });

    // add navigation control (zoom buttons)
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      // add the data source for new a feature collection with no features
      map.addSource("random-points-data", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });
      // now add the layer, and reference the data source above by name
      map.addLayer({
        id: "random-points-layer",
        source: "random-points-data",
        type: "symbol",
        layout: {
          // full list of icons here: https://labs.mapbox.com/maki-icons
          "icon-image": "bakery-15", // this will put little croissants on our map
          "icon-padding": 0,
          "icon-allow-overlap": true
        }
      });
    });

    map.on("moveend", async () => {
      // get new center coordinates
      const { lng, lat } = map.getCenter();
      // fetch new data
      const results = await fetchFakeData({ longitude: lng, latitude: lat });
      // update "random-points-data" source with new data
      // all layers that consume the "random-points-data" data source will be updated automatically
      map.getSource("random-points-data").setData(results);
    });

    // change cursor to pointer when user hovers over a clickable feature
    map.on("mouseenter", "random-points-layer", e => {
      if (e.features.length) {
        map.getCanvas().style.cursor = "pointer";
      }
    });

    // reset cursor to default when user is no longer hovering over a clickable feature
    map.on("mouseleave", "random-points-layer", () => {
      map.getCanvas().style.cursor = "";
    });

    // add popup when user clicks a point
    map.on("click", "random-points-layer", e => {
      if (e.features.length) {
        const feature = e.features[0];
        // create popup node
        const popupNode = document.createElement("div");
        ReactDOM.render(<Popup feature={feature} />, popupNode);
        // set popup on map
        popUpRef.current
          .setLngLat(feature.geometry.coordinates)
          .setDOMContent(popupNode)
          .addTo(map);
      }
    });

    // clean up on unmount
    return () => map.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="map-container" ref={mapContainerRef} />;
};

export default App;
