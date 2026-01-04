# Custom Hooks Documentation

This directory contains custom hooks for creating advanced clip-path animations in React. Each hook is explained in detail below.

---

## Table of Contents

1. [useMousePosition](#usemouseposition)
2. [useScrollClipPath](#usescrollclippath)
3. [useInitialClipPath](#useinitialclippath)
4. [Mathematical Concepts](#mathematical-concepts)

---

## useMousePosition

### Purpose

Tracks the mouse cursor position on the page in real-time.

### Usage

```tsx
import { useMousePosition } from '@/hooks/use-mouse-position';

function MyComponent() {
	const { x, y } = useMousePosition();
	return (
		<div>
			Mouse: {x}, {y}
		</div>
	);
}
```

### How It Works (Line by Line)

```typescript
import { useState, useEffect } from 'react';
```

- **Purpose**: Import React hooks needed for state management and side effects

```typescript
interface MousePosition {
	x: number | null;
	y: number | null;
}
```

- **Purpose**: TypeScript interface defining the shape of mouse position data
- **Why null?**: Before the first mouse move, we don't have a position yet

```typescript
export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: null,
    y: null,
  });
```

- **useState**: Creates a state variable to store the current mouse position
- **Initial state**: `{ x: null, y: null }` because no mouse movement has occurred yet

```typescript
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
```

- **useEffect**: Runs side effects (adding/removing event listeners)
- **updateMousePosition**: Callback function that updates state with new mouse coordinates
- **e.clientX / e.clientY**: Browser API properties giving mouse position relative to viewport

```typescript
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);
```

- **addEventListener**: Attaches our callback to the browser's mousemove event
- **return function**: Cleanup function that removes the listener when component unmounts
- **Empty dependency array []**: Effect runs once on mount, cleanup runs on unmount

```typescript
  return mousePosition;
}
```

- **Return**: Provides the current mouse position to the component using this hook

### Key Concepts

- **Event Listener Pattern**: Subscribe to browser events, clean up when done
- **State Updates**: Each mouse move triggers a re-render with new coordinates
- **Cleanup**: Critical to prevent memory leaks by removing listeners

---

## useScrollClipPath

### Purpose

Creates a dynamic polygon clip-path that animates based on scroll position, with rotation and size interpolation.

### Usage

```tsx
import { useScrollClipPath } from '@/hooks/use-scroll-clip-path';

function MyComponent() {
	const clipPath = useScrollClipPath({
		minSize: 20,
		maxSize: 100,
		startRotation: 90,
		endRotation: 0,
		preventClipping: true,
		deformation: {
			topLeft: { x: -5, y: 2 },
			topRight: { x: 4, y: -2 },
			bottomRight: { x: 2, y: 3 },
			bottomLeft: { x: -2, y: -1 },
		},
	});

	return <div style={{ clipPath }}>Content here</div>;
}
```

### Options Explained

| Option            | Type    | Default   | Description                         |
| ----------------- | ------- | --------- | ----------------------------------- |
| `minSize`         | number  | 20        | Starting size as percentage (0-100) |
| `maxSize`         | number  | 100       | Ending size as percentage (0-100)   |
| `startRotation`   | number  | 45        | Starting rotation in degrees        |
| `endRotation`     | number  | 0         | Ending rotation in degrees          |
| `preventClipping` | boolean | false     | Ensures corners stay within bounds  |
| `deformation`     | object  | see below | Per-corner offset adjustments       |

### Deformation Object

```typescript
{
  topLeft: { x: -5, y: 2 },      // Pull left, push down
  topRight: { x: 4, y: -2 },     // Push right, pull up
  bottomRight: { x: 2, y: 3 },   // Push right, push down
  bottomLeft: { x: -2, y: -1 }   // Pull left, pull up
}
```

- **x**: Horizontal offset (negative = left, positive = right)
- **y**: Vertical offset (negative = up, positive = down)
- Creates organic, non-perfect shapes

### How It Works (Line by Line)

#### Helper Function: `getRotatedSquare`

```typescript
function getRotatedSquare(
  centerX: number,
  centerY: number,
  size: number,
  rotation: number,
  deformation: UseScrollClipPathOptions['deformation'],
  preventClipping = false
): number[] {
```

- **Purpose**: Calculates the 4 corner coordinates of a rotated, deformed square
- **Returns**: Array of 8 numbers: [x1, y1, x2, y2, x3, y3, x4, y4]

```typescript
const halfSize = size / 2;
```

- **halfSize**: Distance from center to edge (for a 50% size square, this is 25)

```typescript
const rad = (rotation * Math.PI) / 180;
const cos = Math.cos(rad);
const sin = Math.sin(rad);
```

- **rad**: Convert degrees to radians (required for Math.cos/sin)
- **cos/sin**: Pre-calculate these values (used in rotation matrix)
- **Why?**: Rotation requires trigonometry to transform coordinates

```typescript
const defaultDeformation = {
	topLeft: { x: -5, y: 2 },
	topRight: { x: 4, y: -2 },
	bottomRight: { x: 2, y: 3 },
	bottomLeft: { x: -2, y: -1 },
};
const def = deformation || defaultDeformation;
```

- **Fallback pattern**: Use provided deformation or default values
- **Why?**: Ensures the function always has valid deformation data

```typescript
const corners = [
	[-halfSize + def.topLeft.x, -halfSize + def.topLeft.y],
	[halfSize + def.topRight.x, -halfSize + def.topRight.y],
	[halfSize + def.bottomRight.x, halfSize + def.bottomRight.y],
	[-halfSize + def.bottomLeft.x, halfSize + def.bottomLeft.y],
];
```

- **Corner positions**: Start with a square centered at (0,0)
  - Top-left: negative X, negative Y
  - Top-right: positive X, negative Y
  - Bottom-right: positive X, positive Y
  - Bottom-left: negative X, positive Y
- **Deformation applied**: Each corner adjusted by its deformation offset

```typescript
  const rotated: number[] = [];
  corners.forEach(([x, y]) => {
    const rotX = x * cos - y * sin;
    const rotY = x * sin + y * cos;
```

- **Rotation matrix math**: Standard 2D rotation formula
  - `newX = x * cos(θ) - y * sin(θ)`
  - `newY = x * sin(θ) + y * cos(θ)`
- **Why?**: Rotates each point around the origin (0,0)

```typescript
let finalX = centerX + rotX;
let finalY = centerY + rotY;
```

- **Translation**: Move rotated points from origin to actual center position
- **Why?**: We rotated around (0,0), now move to (centerX, centerY)

```typescript
if (preventClipping) {
	finalX = Math.max(0, Math.min(100, finalX));
	finalY = Math.max(0, Math.min(100, finalY));
}
```

- **Clamping**: Ensure values stay within 0-100% range
- **Math.max(0, ...)**: Floor at 0%
- **Math.min(100, ...)**: Ceiling at 100%
- **Result**: Corners never go outside the viewport

```typescript
    rotated.push(finalX, finalY);
  });
  return rotated;
}
```

- **Flatten array**: [x1, y1, x2, y2, x3, y3, x4, y4] format required for polygon()

#### Helper Function: `calculateSafeMinSize`

```typescript
function calculateSafeMinSize(
  rotation: number,
  deformation: UseScrollClipPathOptions['deformation']
): number {
```

- **Purpose**: Calculate minimum size that prevents clipping at any rotation

```typescript
const maxDeformation = Math.max(
	Math.abs(def.topLeft.x),
	Math.abs(def.topLeft.y)
	// ... all other deformation values
);
```

- **Find largest deformation**: Get the maximum offset in any direction
- **Why?**: Need to account for worst-case deformation

```typescript
const rad = (rotation * Math.PI) / 180;
const boundingFactor = Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad));
```

- **Bounding box calculation**: When a square rotates, its bounding box changes
  - At 0°: boundingFactor = 1 (square fits perfectly)
  - At 45°: boundingFactor = 1.414 (diagonal is longer)
  - At 90°: boundingFactor = 1 (square rotated 90° fits again)

```typescript
const safeSize = (100 - maxDeformation * 2) / boundingFactor;
return Math.max(0, safeSize);
```

- **Calculate safe size**:
  - Available space: 100% - (deformation padding on both sides)
  - Divide by bounding factor to get actual size
- **Example**: If deformation is 5% and rotation is 45°:
  - Available: 100 - (5\*2) = 90%
  - Safe size: 90 / 1.414 = 63.6%

#### Main Hook Function

```typescript
export function useScrollClipPath(options: UseScrollClipPathOptions = {}) {
  const {
    minSize: userMinSize = 20,
    maxSize = 100,
    startRotation = 45,
    endRotation = 0,
    preventClipping = false,
    deformation,
  } = options;
```

- **Destructuring with defaults**: Extract options or use sensible defaults
- **userMinSize**: Rename to distinguish from calculated minSize later

```typescript
const safeMinSize = preventClipping
	? calculateSafeMinSize(
			Math.max(Math.abs(startRotation), Math.abs(endRotation)),
			deformation
		)
	: userMinSize;
```

- **Conditional calculation**: Only calculate safe size if preventClipping enabled
- **Math.max(abs())**: Use the larger absolute rotation (worst case)
- **Why?**: If start is 90° and end is 0°, use 90° to calculate minimum size

```typescript
const minSize = preventClipping
	? Math.max(userMinSize, safeMinSize)
	: userMinSize;
```

- **Final minSize**: Use larger of user's minimum or calculated safe minimum
- **Why?**: Respects user preference while ensuring no clipping

```typescript
const [clipPath, setClipPath] = useState(
	'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'
);
```

- **Initial state**: All corners at center point (50%, 50%)
- **Why?**: Provides valid initial value before first calculation

```typescript
const { scrollYProgress } = useScroll();
```

- **Framer Motion hook**: Returns motion value representing scroll progress (0 to 1)
- **0**: Top of page
- **1**: Bottom of page
- **Why?**: More performant than manual scroll listeners

```typescript
const size = useTransform(scrollYProgress, [0, 1], [minSize, maxSize]);
const rotation = useTransform(
	scrollYProgress,
	[0, 1],
	[startRotation, endRotation]
);
```

- **useTransform**: Maps one value range to another
  - Input: scrollYProgress (0 to 1)
  - Output: size (minSize to maxSize) or rotation (start to end)
- **Automatic interpolation**: Framer Motion smoothly interpolates values
- **Why?**: Declarative animation - describe what you want, not how to do it

```typescript
const updateClipPath = useCallback(
	(currentSize: number, currentRotation: number) => {
		const corners = getRotatedSquare(
			50,
			50,
			currentSize,
			currentRotation,
			deformation,
			preventClipping
		);
		setClipPath(
			`polygon(${corners[0]}% ${corners[1]}%, ${corners[2]}% ${corners[3]}%, ${corners[4]}% ${corners[5]}%, ${corners[6]}% ${corners[7]}%)`
		);
	},
	[deformation, preventClipping]
);
```

- **useCallback**: Memoizes function to prevent recreation on every render
- **Dependencies**: Only recreate if deformation or preventClipping change
- **Template string**: Converts number array to CSS polygon format
- **Why memoize?**: Stable function reference for use in effects

```typescript
useMotionValueEvent(size, 'change', latest => {
	const currentRotation = rotation.get();
	updateClipPath(latest, currentRotation);
});

useMotionValueEvent(rotation, 'change', latest => {
	const currentSize = size.get();
	updateClipPath(currentSize, latest);
});
```

- **Listen to both values**: Separate listeners for size and rotation
- **Why both?**: Ensures we catch every animation frame for smooth updates
- **.get()**: Gets current value of other motion value
- **Why separate?**: One might change while the other doesn't

```typescript
useEffect(() => {
	const currentSize = size.get();
	const currentRotation = rotation.get();
	updateClipPath(currentSize, currentRotation);
}, [size, rotation, updateClipPath]);
```

- **Initial render effect**: Set clipPath on mount and when dependencies change
- **Why?**: Motion value listeners don't fire on initial mount
- **Dependencies**: Rerun if motion values or update function change

```typescript
  return clipPath;
}
```

- **Return**: The computed CSS polygon string

### Key Concepts

1. **Rotation Matrix Mathematics**

   ```
   | cos(θ)  -sin(θ) |   | x |   | x' |
   | sin(θ)   cos(θ) | × | y | = | y' |
   ```

2. **Coordinate System**
   - Center: (50%, 50%)
   - Percentages relative to container size
   - Y-axis: 0% at top, 100% at bottom

3. **Performance Optimization**
   - Framer Motion handles animation frames
   - useCallback prevents function recreation
   - Motion values update without causing full re-renders

---

## useInitialClipPath

### Purpose

Animates a clip-path on page load using requestAnimationFrame, independent of scroll.

### Usage

```tsx
import { useInitialClipPath } from '@/hooks/use-initial-clip-path';

function MyComponent() {
	const { clipPath, isComplete } = useInitialClipPath({
		duration: 1500,
		initialSize: 0,
		targetSize: 40,
		initialRotation: 180,
		targetRotation: 0,
		preventClipping: true,
	});

	return (
		<div
			style={{
				clipPath,
				opacity: isComplete ? 1 : 0.8,
			}}
		>
			Content here
		</div>
	);
}
```

### Options Explained

| Option            | Type     | Default        | Description                        |
| ----------------- | -------- | -------------- | ---------------------------------- |
| `duration`        | number   | 1200           | Animation duration in milliseconds |
| `initialSize`     | number   | 0              | Starting size percentage           |
| `targetSize`      | number   | 30             | Ending size percentage             |
| `initialRotation` | number   | 180            | Starting rotation in degrees       |
| `targetRotation`  | number   | 45             | Ending rotation in degrees         |
| `easing`          | function | ease-out cubic | Custom easing function             |
| `deformation`     | object   | default        | Corner deformation settings        |
| `preventClipping` | boolean  | false          | Prevent edge clipping              |

### How It Works (Line by Line)

```typescript
const defaultEasing = (t: number): number => {
	return 1 - Math.pow(1 - t, 3);
};
```

- **Easing function**: Takes linear progress (0-1), returns eased progress (0-1)
- **Formula**: 1 - (1 - t)³ creates ease-out cubic
  - t=0: output=0 (slow start)
  - t=0.5: output=0.875 (fast middle)
  - t=1: output=1 (slow end)
- **Why cubic?**: Feels natural - fast acceleration, slow deceleration

```typescript
function getRotatedSquare(...) {
  // Same as useScrollClipPath - see above
}
```

- **Reused logic**: Same coordinate calculation as scroll hook
- **Why duplicate?**: Could be extracted to shared utility, but kept inline for clarity

```typescript
export function useInitialClipPath(
  options: UseInitialClipPathOptions = {}
) {
  const {
    duration = 1200,
    initialSize = 0,
    targetSize = 30,
    initialRotation = 180,
    targetRotation = 45,
    easing = defaultEasing,
    deformation,
    preventClipping = false,
  } = options;
```

- **Destructure with defaults**: Standard options pattern

```typescript
const [clipPath, setClipPath] = useState(
	'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'
);
const [isComplete, setIsComplete] = useState(false);
```

- **State variables**:
  - `clipPath`: Current polygon string
  - `isComplete`: Flag indicating animation finished

```typescript
const rafRef = useRef<number>(0);
const startTimeRef = useRef<number>(0);
```

- **Refs for RAF**:
  - `rafRef`: Stores requestAnimationFrame ID (for cancellation)
  - `startTimeRef`: Stores animation start timestamp
- **Why refs?**: Values persist across renders without causing re-renders

```typescript
  useEffect(() => {
    const animate = (timestamp: number) => {
```

- **RAF callback**: Called every frame (~60fps)
- **timestamp**: DOMHighResTimeStamp from browser (milliseconds since page load)

```typescript
if (!startTimeRef.current) {
	startTimeRef.current = timestamp;
}
```

- **First frame setup**: Record when animation started
- **Why?**: Need reference point to calculate elapsed time

```typescript
const elapsed = timestamp - startTimeRef.current;
const progress = Math.min(elapsed / duration, 1);
```

- **Calculate progress**:
  - `elapsed`: How many milliseconds have passed
  - `progress`: 0 to 1 representing animation completion
  - `Math.min(..., 1)`: Cap at 1 (100% complete)

```typescript
const easedProgress = easing(progress);
```

- **Apply easing**: Transform linear progress to eased progress
- **Example**: At 50% time (linear=0.5), eased might be 0.875 (87.5%)

```typescript
const currentSize = initialSize + (targetSize - initialSize) * easedProgress;
const currentRotation =
	initialRotation + (targetRotation - initialRotation) * easedProgress;
```

- **Linear interpolation (lerp)**:
  - Formula: start + (end - start) \* progress
  - **Example**: 0 + (100 - 0) \* 0.5 = 50
- **Why?**: Smoothly transition from start to end value

```typescript
const corners = getRotatedSquare(
	50,
	50,
	currentSize,
	currentRotation,
	deformation,
	preventClipping
);

setClipPath(
	`polygon(${corners[0]}% ${corners[1]}%, ${corners[2]}% ${corners[3]}%, ${corners[4]}% ${corners[5]}%, ${corners[6]}% ${corners[7]}%)`
);
```

- **Generate and apply**: Calculate corners and update state
- **Triggers re-render**: Component updates with new clipPath

```typescript
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsComplete(true);
      }
    };
```

- **Loop or complete**:
  - If not done: schedule next frame
  - If done: set complete flag
- **requestAnimationFrame**: Browser optimally schedules callback before next repaint

```typescript
rafRef.current = requestAnimationFrame(animate);
```

- **Start animation**: Kick off the first frame

```typescript
return () => {
	if (rafRef.current) {
		cancelAnimationFrame(rafRef.current);
	}
};
```

- **Cleanup**: Cancel animation if component unmounts
- **Why critical?**: Prevents memory leaks and errors from updating unmounted component

```typescript
  }, [
    duration,
    initialSize,
    targetSize,
    initialRotation,
    targetRotation,
    easing,
    deformation,
    preventClipping,
  ]);
```

- **Dependencies**: Restart animation if any option changes
- **Why all of them?**: Any change should trigger new animation

```typescript
  return { clipPath, isComplete };
}
```

- **Return object**: Provides both the clipPath and completion status

### Key Concepts

1. **requestAnimationFrame (RAF)**
   - Browser API for smooth animations
   - Calls callback before next repaint (~60fps)
   - Automatically pauses when tab is hidden
   - Better than setTimeout/setInterval for animations

2. **Easing Functions**
   - Transform linear progress to curved progress
   - Create natural-feeling motion
   - Common types:
     - Linear: y = x
     - Ease-in: slow start (y = x²)
     - Ease-out: slow end (y = 1 - (1-x)²)
     - Ease-in-out: slow both ends

3. **Linear Interpolation (lerp)**

   ```
   value = start + (end - start) × progress
   ```

   - progress = 0: value = start
   - progress = 0.5: value = midpoint
   - progress = 1: value = end

4. **Animation Loop Pattern**
   ```
   Start → Calculate Progress → Apply Easing → Interpolate Values
     ↑                                                          ↓
     └─────────────────── Request Next Frame ←─────────────────┘
                               (if not complete)
   ```

---

## Mathematical Concepts

### 2D Rotation Matrix

When rotating a point (x, y) by angle θ around the origin:

```
x' = x × cos(θ) - y × sin(θ)
y' = x × sin(θ) + y × cos(θ)
```

**Why this works:**

- Rotation preserves distance from origin
- Changes the angle by θ
- Matrix multiplication handles both X and Y transformations simultaneously

**Example:** Rotate point (10, 0) by 90°:

```
cos(90°) = 0, sin(90°) = 1
x' = 10 × 0 - 0 × 1 = 0
y' = 10 × 1 + 0 × 0 = 10
Result: (0, 10) ✓ Correct!
```

### Polygon Clip-Path Format

CSS polygon() function requires coordinates in order:

```css
polygon(x1 y1, x2 y2, x3 y3, x4 y4)
```

**For a square (clockwise from top-left):**

1. Top-left
2. Top-right
3. Bottom-right
4. Bottom-left

**Why order matters:** Browser connects points in sequence, then closes the shape.

### Percentage Coordinates

All coordinates are percentage-based:

- **0% 0%**: Top-left of container
- **50% 50%**: Center of container
- **100% 100%**: Bottom-right of container

**Benefits:**

- Responsive: works at any container size
- No pixel calculations needed
- Resolution-independent

### Bounding Box Calculation

When a square rotates, its bounding box (smallest rectangle containing it) changes:

```
boundingSize = size × (|cos(θ)| + |sin(θ)|)
```

**Examples:**

- 0°: |cos(0°)| + |sin(0°)| = 1 + 0 = 1 (no expansion)
- 45°: |cos(45°)| + |sin(45°)| = 0.707 + 0.707 = 1.414 (√2 expansion)
- 90°: |cos(90°)| + |sin(90°)| = 0 + 1 = 1 (back to square)

**Why?:** At 45°, the diagonal of the square becomes the width/height of the bounding box.

---

## Performance Considerations

### Why Framer Motion for Scroll?

1. **Optimized updates**: Only re-renders when values actually change
2. **GPU acceleration**: Uses transform properties when possible
3. **RAF handling**: Automatically manages animation frames
4. **Memory efficient**: Motion values don't cause full React re-renders

### Why RAF for Initial Animation?

1. **Frame-perfect timing**: Syncs with browser repaint cycle
2. **Automatic throttling**: Browser optimizes when tab is hidden
3. **Smooth 60fps**: Guaranteed consistent frame rate
4. **No dependencies**: No need for external animation library

### Optimization Tips

1. **Use refs for non-render data**: Avoid unnecessary re-renders
2. **Memoize callbacks**: Prevent function recreation
3. **Batch state updates**: Group related updates together
4. **Clean up listeners**: Always remove event listeners on unmount

---

## Common Patterns

### Pattern 1: Intro Animation → Scroll Animation

Combine both hooks for a complete experience:

```tsx
function Page() {
	const { clipPath: introClipPath, isComplete } = useInitialClipPath({
		duration: 1500,
		initialSize: 0,
		targetSize: 30,
		initialRotation: 180,
		targetRotation: 45,
	});

	const scrollClipPath = useScrollClipPath({
		minSize: 30,
		maxSize: 100,
		startRotation: 45,
		endRotation: 0,
	});

	// Use intro until complete, then switch to scroll
	const activeClipPath = isComplete ? scrollClipPath : introClipPath;

	return <div style={{ clipPath: activeClipPath }}>Content</div>;
}
```

### Pattern 2: Multiple Deformations

Create different effects by varying deformation:

```tsx
// Liquid/organic feel
deformation: {
  topLeft: { x: -15, y: 8 },
  topRight: { x: 12, y: -10 },
  bottomRight: { x: 8, y: 14 },
  bottomLeft: { x: -10, y: -6 },
}

// Subtle, modern feel
deformation: {
  topLeft: { x: -2, y: 1 },
  topRight: { x: 2, y: -1 },
  bottomRight: { x: 1, y: 2 },
  bottomLeft: { x: -1, y: -1 },
}

// Aggressive, dynamic feel
deformation: {
  topLeft: { x: -25, y: 15 },
  topRight: { x: 20, y: -18 },
  bottomRight: { x: 15, y: 22 },
  bottomLeft: { x: -18, y: -12 },
}
```

### Pattern 3: Custom Easing

Create unique motion feels:

```tsx
// Bounce effect
const bounceEasing = (t: number) => {
	if (t < 0.5) {
		return 2 * t * t;
	}
	return 1 - Math.pow(-2 * t + 2, 2) / 2;
};

// Elastic effect
const elasticEasing = (t: number) => {
	return t === 0 || t === 1
		? t
		: -Math.pow(2, 10 * t - 10) *
				Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
};

useInitialClipPath({
	duration: 1500,
	easing: bounceEasing,
	// ... other options
});
```

---

## Troubleshooting

### Issue: Animation doesn't restart

**Problem:** Key prop not triggering remount

**Solution:** Wrap hook usage in separate component:

```tsx
function AnimatedContent({ config, key }: { config: Config; key: number }) {
	const { clipPath } = useInitialClipPath(config);
	return <div style={{ clipPath }}>Content</div>;
}

// In parent:
<AnimatedContent key={animKey} config={config} />;
```

### Issue: Clipping at edges

**Problem:** Shape extends beyond container bounds

**Solution:** Enable `preventClipping`:

```tsx
useScrollClipPath({
	preventClipping: true,
	// ... other options
});
```

### Issue: Jerky animation

**Problem:** Too many re-renders or heavy calculations

**Solution:**

1. Use refs for non-render values
2. Memoize expensive calculations
3. Reduce deformation values
4. Check for console warnings

### Issue: Memory leak warning

**Problem:** Didn't clean up listeners

**Solution:** Always return cleanup function:

```tsx
useEffect(() => {
	// Setup
	const id = requestAnimationFrame(animate);

	// Cleanup
	return () => {
		cancelAnimationFrame(id);
	};
}, []);
```

---

## Browser Compatibility

### clip-path Support

- **Chrome/Edge**: 55+
- **Firefox**: 54+
- **Safari**: 9.1+ (with -webkit- prefix)
- **Mobile**: Full support on modern browsers

### requestAnimationFrame Support

- **All modern browsers**: Full support
- **IE**: 10+
- **Fallback**: Use setTimeout(fn, 16) for older browsers

---

## Resources

- [MDN: clip-path](https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path)
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Easing Functions Cheat Sheet](https://easings.net/)
- [2D Rotation Matrix](https://en.wikipedia.org/wiki/Rotation_matrix)

---

## License

MIT - Feel free to use in your projects!
