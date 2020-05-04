import React, { useRef, useEffect, useState } from "react"
import { css } from "emotion/macro"
import scriptjs from "scriptjs"
import faker from "faker"
import _ from "lodash"
import { add, formatRelative } from "date-fns"

import { groups, points, Point, distanceBetweenPoints } from "./k-means"

const GOOGLE_MAP_API_KEY = ""
const MELBOURNE = { lat: -37.813629, lng: 144.963058 }
const MARKER_DROP_DELAY = 200
const GROUP_MARKERS_DELAY = 3000

const DELIVERY_DEPARTURE_TIME = new Date()

interface DeliveryOrder {
  id: string
  coords: Point
  clientName: string
  address: string
}

const legToPoint = (leg: google.maps.DirectionsLeg): Point => ({
  lat: leg.end_location.lat(),
  lng: leg.end_location.lng(),
})

const deliveryOrders: DeliveryOrder[] = points.map(point => ({
  id: faker.random.uuid(),
  coords: point,
  clientName: faker.name.findName(),
  address: faker.address.streetAddress(),
}))

const deliveryOrdersSelection = _.sampleSize(deliveryOrders, 5)

function App() {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const mapEl = useRef<HTMLDivElement>(null)

  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [
    orderDirectionsResult,
    setOrderDirectionsResult,
  ] = useState<google.maps.DirectionsResult | null>(null)

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

    const markers = deliveryOrders.map(
      order =>
        new google.maps.Marker({
          position: order.coords,
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

    setMap(map)
  }

  useEffect(() => {
    // As seen in react-google-maps' codebase: https://github.com/tomchentw/react-google-maps/blob/master/src/withScriptjs.jsx#L58
    scriptjs(
      `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAP_API_KEY}`,
      googleMapsHasLoadedCallback
    )
  }, [])

  useEffect(() => {
    if (!selectedOrder) {
      return
    }

    const parentGroup = groups.find(group =>
      _.includes(group.points, selectedOrder.coords)
    )

    if (!parentGroup) {
      return
    }

    const directionsService = new google.maps.DirectionsService()
    directionsService.route(
      {
        origin: MELBOURNE,
        destination: MELBOURNE,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: DELIVERY_DEPARTURE_TIME,
        },
        waypoints: parentGroup.points.map(point => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          stopover: true,
        })),
        optimizeWaypoints: true,
      },
      (result, status) => {
        console.log("directions service result", result)
        const directionsRenderer = new google.maps.DirectionsRenderer()
        directionsRenderer.setMap(map)
        directionsRenderer.setDirections(result)

        setOrderDirectionsResult(result)
      }
    )
  }, [map, selectedOrder])

  let deliveryNumber: number
  let deliveryArrivalTime: number
  if (selectedOrder && orderDirectionsResult) {
    const legs = orderDirectionsResult.routes[0].legs

    // Find the leg that delivers our order
    const leg = legs.reduce((closestLeg, currentLeg) => {
      const distanceToCurrent = distanceBetweenPoints(
        selectedOrder.coords,
        legToPoint(currentLeg)
      )
      const distanceToClosest = distanceBetweenPoints(
        selectedOrder.coords,
        legToPoint(closestLeg)
      )
      return distanceToCurrent < distanceToClosest ? currentLeg : closestLeg
    })
    const indexOfLeg = legs.findIndex(x => x === leg)
    const durationToLeg = _.sumBy(_.slice(legs, indexOfLeg), "duration.value")

    deliveryNumber = indexOfLeg
    deliveryArrivalTime = durationToLeg
  }

  return (
    <div
      onClick={() => {
        // Handle clicking off an order to deselect
        setSelectedOrder(null)
        setOrderDirectionsResult(null)
      }}
      className={css`
        display: grid;
        grid-template-columns: minmax(auto, 400px) 1fr;
        height: 100%;
      `}
    >
      <div
        className={css`
          padding: 0 1rem;
        `}
      >
        <h1>Orders:</h1>
        <p>Select a delivery order to view the estimated arrival time:</p>
        <ol
          className={css`
            list-style: none;
            padding: 0;
          `}
        >
          {deliveryOrdersSelection.map(order => (
            <li key={order.id}>
              <button
                onClick={ev => {
                  setSelectedOrder(order)
                  setOrderDirectionsResult(null)
                  // Prevent click off deselect handler from firing
                  ev.stopPropagation()
                }}
                className={css`
                  display: block;
                  width: 100%;
                  background-color: ${order.id === selectedOrder?.id
                    ? "#edf2f7"
                    : "white"};
                  border: 1px solid #cbd5e0;
                  padding: 1rem;
                  margin-bottom: 0.5rem;
                  border-radius: 3px;
                  cursor: pointer;

                  &:hover {
                    background-color: #edf2f7;
                  }
                `}
              >
                Order no: {order.id}
              </button>

              {order === selectedOrder && orderDirectionsResult && (
                <div
                  className={css`
                    margin-bottom: 3rem;
                  `}
                >
                  <div>Delivery number: {deliveryNumber}</div>
                  <div>
                    Estimated delivery time:{" "}
                    {formatRelative(
                      add(DELIVERY_DEPARTURE_TIME, {
                        seconds: deliveryArrivalTime,
                      }),
                      DELIVERY_DEPARTURE_TIME
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
      <div
        ref={mapEl}
        // Always set the map height explicitly to define the size of the div
        // element that contains the map
        className={css`
          height: 100%;
        `}
      />
    </div>
  )
}

export default App
