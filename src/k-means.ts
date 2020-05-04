// Sources:
// https://towardsdatascience.com/the-5-clustering-algorithms-data-scientists-need-to-know-a36d136ef68
// https://www.educba.com/k-means-clustering-algorithm/ -- quite good

// NOTE: K-means works well to cluster the points to the closest group. However,
// k-means *does not equally* divide the points. This is interesting. In a real world
// environment this probably would not work. If a driver were assigned 1 delivery
// and another were assigned 50, this would probably not be acceptable. There are
// numerous interesting questions though: what if the 50 could be delivered at a
// far greater rate than if they were divided? Should the durations be summed and
// then the work redistributed? More questions like this...

import _ from "lodash"

const K = 3
const NUMBER_OF_POINTS = 30
const K_MEANS_ITERATIONS_LIMIT = 50

// Rounding as an optimization: https://gis.stackexchange.com/a/8674
const optimizedCoords = (n: number) => _.round(n, 4)
const randomOptimizedCoords = _.flow([_.random, optimizedCoords])
const LEFTMOST_LAT = optimizedCoords(-37.58567)
const RIGHTMOST_LAT = optimizedCoords(-38.005632)
const TOPMOST_LNG = optimizedCoords(144.610326)
const BOTTOMMOST_LNG = optimizedCoords(145.385414)

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
  })

const resetGroupPoints = () => groups.forEach(group => (group.points = []))

// ============================================================================
// Main
// ============================================================================

const points = _.times(NUMBER_OF_POINTS, () => ({
  lat: randomOptimizedCoords(LEFTMOST_LAT, RIGHTMOST_LAT),
  lng: randomOptimizedCoords(BOTTOMMOST_LNG, TOPMOST_LNG),
}))

const maxLat = _.maxBy(points, "lat")?.lat as number
const minLat = _.minBy(points, "lat")?.lat as number
const maxLng = _.maxBy(points, "lng")?.lng as number
const minLng = _.minBy(points, "lng")?.lng as number

const groups = _.times(K, () => ({
  lat: randomOptimizedCoords(maxLat, minLat),
  lng: randomOptimizedCoords(maxLng, minLng),
  points: [] as Point[],
}))

let oldGroups: Group[]
let iteration = 0
let shouldContinue = false

const haveGroupMeansConverged = () =>
  oldGroups.every((oldGroup, i) => pointsMatch(oldGroup, groups[i]))

console.group("K-means")
do {
  console.log("Running k-means iteration")

  oldGroups = _.cloneDeep(groups)

  assignPointsToGroups()
  recalculateGroupMeans()

  iteration++

  // Stop if iteration has exceed 50 as a safeguard
  shouldContinue =
    iteration < K_MEANS_ITERATIONS_LIMIT && !haveGroupMeansConverged()

  if (shouldContinue) {
    resetGroupPoints()
  }
} while (shouldContinue)

console.log("Total k-means iterations:", iteration)
console.log("Points:", points)
console.log("Groups:", groups)
console.groupEnd()

if (iteration >= K_MEANS_ITERATIONS_LIMIT) {
  throw new Error(
    `K-means algorithmn did not converge before ${K_MEANS_ITERATIONS_LIMIT} iterations`
  )
}

export { groups, points }
