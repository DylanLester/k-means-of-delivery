// Sources:
// https://towardsdatascience.com/the-5-clustering-algorithms-data-scientists-need-to-know-a36d136ef68
// https://www.educba.com/k-means-clustering-algorithm/ -- quite good

import _ from "lodash"

const K = 3
const NUMBER_OF_POINTS = 30
const LEFTMOST_LAT = -37.58567
const RIGHTMOST_LAT = -38.005632
const TOPMOST_LNG = 144.610326
const BOTTOMMOST_LNG = 145.385414

interface Point {
  lat: number
  lng: number
}

interface Group extends Point {
  points: Point[]
}

// ============================================================================
// Functions
// ============================================================================

// This is calculating the distance via Pythagoras' theorem. Calculating distances
// on Earth's surface is more complicated than this (I think). Google has a distance
// calculation service, whether to use this (costly) or the naive solution below
// would be a business decision
const distanceBetweenPoints = (a: Point, b: Point) => {
  const horizontalDist = a.lat - b.lat
  const verticalDist = a.lng - b.lng
  const distance = Math.sqrt(horizontalDist ** 2 + verticalDist ** 2)
  return distance
}

const pointsMatch = (a: Point, b: Point) => a.lat === b.lat && a.lng === b.lng

// Contains side effects
const assignPointsToGroups = () =>
  points.forEach(point => {
    // Determine closest group to this point
    const group = groups.reduce((closestGroup, currentGroup) => {
      const distanceToCurrent = distanceBetweenPoints(point, currentGroup)
      const distanceToClosest = distanceBetweenPoints(point, closestGroup)
      return distanceToCurrent < distanceToClosest ? currentGroup : closestGroup
    })
    group.points.push(point)
  })

// Contains side effects
const recalculateGroupMeans = () =>
  groups.forEach(group => {
    const horizontalMean = _.sumBy(group.points, "lat") / group.points.length
    const verticalMean = _.sumBy(group.points, "lng") / group.points.length
    group.lat = horizontalMean
    group.lng = verticalMean
    group.points = []
  })

// ============================================================================
// Main
// ============================================================================

const points = _.times(NUMBER_OF_POINTS, () => ({
  lat: _.random(LEFTMOST_LAT, RIGHTMOST_LAT),
  lng: _.random(BOTTOMMOST_LNG, TOPMOST_LNG),
}))

const maxLat = _.maxBy(points, "lat")?.lat as number
const minLat = _.minBy(points, "lat")?.lat as number
const maxLng = _.maxBy(points, "lng")?.lng as number
const minLng = _.minBy(points, "lng")?.lng as number

const groups = _.times(K, () => ({
  lat: _.random(maxLat, minLat),
  lng: _.random(maxLng, minLng),
  points: [] as Point[],
}))

let iterations = 0
let oldGroups: Group[]

const haveGroupMeansConverged = () =>
  oldGroups.every((oldGroup, i) => pointsMatch(oldGroup, groups[i]))

do {
  console.log("Running k-means iteration")

  oldGroups = _.cloneDeep(groups)

  assignPointsToGroups()
  recalculateGroupMeans()

  iterations++
  // Ensure iterations haven't exceed 50 as a safeguard
} while (iterations < 50 && !haveGroupMeansConverged())

console.log("Total k-means iterations:", iterations)

// if (iterations >= 50) {
//   throw new Error("K-means algorithmn did not converge before 50 iterations");
// }

export { groups, points }
