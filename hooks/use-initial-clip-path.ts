import { useState, useEffect, useRef } from 'react';

interface UseInitialClipPathOptions {
	duration?: number;
	initialSize?: number;
	targetSize?: number;
	initialRotation?: number;
	targetRotation?: number;
	easing?: (t: number) => number;
	deformation?: {
		topLeft: { x: number; y: number };
		topRight: { x: number; y: number };
		bottomRight: { x: number; y: number };
		bottomLeft: { x: number; y: number };
	};
	preventClipping?: boolean;
}

// Default easing function (ease-out cubic)
const defaultEasing = (t: number): number => {
	return 1 - Math.pow(1 - t, 3);
};

function getRotatedSquare(
	centerX: number,
	centerY: number,
	size: number,
	rotation: number,
	deformation: UseInitialClipPathOptions['deformation'],
	preventClipping = false
): number[] {
	const halfSize = size / 2;
	const rad = (rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);

	const defaultDeformation = {
		topLeft: { x: -5, y: 2 },
		topRight: { x: 4, y: -2 },
		bottomRight: { x: 2, y: 3 },
		bottomLeft: { x: -2, y: -1 },
	};

	const def = deformation || defaultDeformation;

	// Calculate 4 corners relative to center with deformation
	const corners = [
		[-halfSize + def.topLeft.x, -halfSize + def.topLeft.y], // Top-left
		[halfSize + def.topRight.x, -halfSize + def.topRight.y], // Top-right
		[halfSize + def.bottomRight.x, halfSize + def.bottomRight.y], // Bottom-right
		[-halfSize + def.bottomLeft.x, halfSize + def.bottomLeft.y], // Bottom-left
	];

	// Rotate and translate corners
	const rotated: number[] = [];
	corners.forEach(([x, y]) => {
		const rotX = x * cos - y * sin;
		const rotY = x * sin + y * cos;
		let finalX = centerX + rotX;
		let finalY = centerY + rotY;

		// Clamp values to prevent clipping if enabled
		if (preventClipping) {
			finalX = Math.max(0, Math.min(100, finalX));
			finalY = Math.max(0, Math.min(100, finalY));
		}

		rotated.push(finalX, finalY);
	});

	return rotated;
}

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

	const [clipPath, setClipPath] = useState(
		'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'
	);
	const [isComplete, setIsComplete] = useState(false);
	const rafRef = useRef<number>(0);
	const startTimeRef = useRef<number>(0);

	useEffect(() => {
		const animate = (timestamp: number) => {
			if (!startTimeRef.current) {
				startTimeRef.current = timestamp;
			}

			const elapsed = timestamp - startTimeRef.current;
			const progress = Math.min(elapsed / duration, 1);
			const easedProgress = easing(progress);

			// Interpolate size and rotation
			const currentSize =
				initialSize + (targetSize - initialSize) * easedProgress;
			const currentRotation =
				initialRotation + (targetRotation - initialRotation) * easedProgress;

			// Generate square corners
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

			// Continue animation or complete
			if (progress < 1) {
				rafRef.current = requestAnimationFrame(animate);
			} else {
				setIsComplete(true);
			}
		};

		// Start animation
		rafRef.current = requestAnimationFrame(animate);

		// Cleanup
		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
		};
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

	return { clipPath, isComplete };
}
