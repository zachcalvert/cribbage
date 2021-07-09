import React, { useState } from 'react'
import { useSprings, animated, interpolate } from 'react-spring'
import { useGesture } from 'react-use-gesture'
import './GoodHand.css'

// These two are just helpers, they curate spring data, values that are later being interpolated into css
const to = i => ({ x: i * 20, y: i * -.5, scale: 1, rot: -10 + Math.random() * 20, delay: i * 50 })
const from = i => ({ x: 0, rot: 0, scale: 1.5, y: -1000 })
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r, s) => `perspective(1500px) rotateX(30deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`

const HANDS = [
    ['a6a3e792b4', '30e1ddb610', 'fa0873dd7d', '1d5eb77128', 'd7ca85cf5e'],
    ['def8effef6', '4c8519af34', 'ce46b344a3', '597e4519ac', '4dfe41e461'],
    ['c88523b677', 'def8effef6', '4c8519af34', 'ce46b344a3', '597e4519ac'],
    ['ff2de622d8', 'c88523b677', 'def8effef6', '4c8519af34', 'ce46b344a3'],
    ['def8effef6', '4c8519af34', '597e4519ac', '4dfe41e461', '110e6e5b19'],
    ['def8effef6', '4c8519af34', '597e4519ac', '4dfe41e461', '276f33cf69'],
    ['f6571e162f', 'd3a2460e93', 'ace1293f8a', 'd1c9fde8ef', '04f17d1351'],
    ['ace1293f8a', 'd1c9fde8ef', '04f17d1351', '5c6bdd4fee', 'f6571e162f'],
    ['6d95c18472', 'ace1293f8a', 'd1c9fde8ef', '04f17d1351', '85ba715700'],
    ['5c6bdd4fee', 'e356ece3fc', 'a6a3e792b4', '30e1ddb610', 'c88623fa16'],
    ['95f92b2f0c', 'dd3749a1bc', '04a70825ff', 'ae2caea4bb', '36493dcc05'],
    ['a6a3e792b4', '95f92b2f0c', 'dd3749a1bc', '04a70825ff', 'ae2caea4bb']
]

export const GoodHand = (props) => {
  const [cards, setCards] = useState(HANDS[Math.floor(Math.random()*HANDS.length)]);

  const [gone] = useState(() => new Set()) // The set flags all the cards that are flicked out
  const [properties, set] = useSprings(cards.length, i => ({ ...to(i), from: from(i) })) // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
  const bind = useGesture(({ args: [index], down, delta: [xDelta], distance, direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2 // If you flick hard enough it should trigger the card to fly out
    const dir = xDir < 0 ? -1 : 1 // Direction should either point left or right
    if (!down && trigger) gone.add(index) // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
    set(i => {
      if (index !== i) return // We're only interested in changing spring-data for the current spring
      const isGone = gone.has(index)
      const x = isGone ? (200 + window.innerWidth) * dir : down ? xDelta : 0 // When a card is gone it flys out left or right, otherwise goes back to zero
      const rot = xDelta / 100 + (isGone ? dir * 10 * velocity : 0) // How much the card tilts, flicking it harder makes it rotate faster
      const scale = down ? 1.1 : 1 // Active cards lift up a bit
      return { x, rot, scale, delay: undefined, config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 } }
    })
    if (!down && gone.size === cards.length) setTimeout(() => gone.clear() || set(i => to(i)), 600)
  });

  // Now we're just mapping the animated values to our view, that's it. Btw, this component only renders once. :-)
  return properties.map(({ x, y, rot, scale }, i) => (
    <animated.div className="animated-cards-container" key={i} style={{ transform: interpolate([x, y], (x, y) => `translate3d(${x}px,${y}px,0)`) }}>
      {/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
      <animated.div className="animated-card" {...bind(i)} style={{ transform: interpolate([rot, scale], trans), backgroundImage: `url(/cards/${cards[i]}.svg)` }} />
    </animated.div>
  ))
}