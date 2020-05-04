import React, { useRef, useEffect, useState } from "react"
import scriptjs from "scriptjs"

import { groups, points } from "./k-means"

const MELBOURNE = { lat: -37.813629, lng: 144.963058 }
const MARKER_DROP_DELAY = 200
const GROUP_MARKERS_DELAY = 3000

function App() {
  // const [map, setMap] = useState(null);
  const mapEl = useRef<HTMLDivElement>(null)

  const googleMapsHasLoadedCallback = () => {
    if (!mapEl || !mapEl.current) {
      return
    }

    const map = new google.maps.Map(mapEl.current, {
      center: MELBOURNE,
      zoom: 10,
      disableDefaultUI: true,
      zoomControl: true,
    })

    const markers = points.map(
      point =>
        new google.maps.Marker({
          position: point,
          animation: google.maps.Animation.DROP,
        })
    )

    markers.forEach((marker, i) => {
      setTimeout(() => marker.setMap(map), i * MARKER_DROP_DELAY)
    })

    const groupMarkers = groups.map(
      group =>
        new google.maps.Marker({
          position: { lat: group.lat, lng: group.lng },
          animation: google.maps.Animation.DROP,
          icon: {
            fillColor: "green",
            strokeColor: "green",
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
          },
        })
    )

    setTimeout(() => {
      groupMarkers.forEach((marker, i) => {
        setTimeout(() => marker.setMap(map), i * MARKER_DROP_DELAY)
      })
    }, markers.length * MARKER_DROP_DELAY + GROUP_MARKERS_DELAY)

    // setMap(map);
  }

  useEffect(() => {
    // As seen in react-google-maps' codebase: https://github.com/tomchentw/react-google-maps/blob/master/src/withScriptjs.jsx#L58
    scriptjs(
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyCvnJVKB15Os2X_IWWt4Ir4z_sPRy8gxO",
      googleMapsHasLoadedCallback
    )
  }, [])

  return (
    <div
      ref={mapEl}
      // Always set the map height explicitly to define the size of the div
      // element that contains the map
      style={{ height: "100%" }}
    ></div>
  )
}

export default App
