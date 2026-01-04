import { useState, useEffect, useCallback } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'motion/react';

interface UseScrollClipPathOptions {
	minSize?: number;
	maxSize?: number;
	startRotation?: number;
	endRotation?: number;
	preventClipping?: boolean;
	deformation?: {
		topLeft: { x: number; y: number };
		topRight: { x: number; y: number };
		bottomRight: { x: number; y: number };
		bottomLeft: { x: number; y: number };
	};
}

function getRotatedSquare(
	centerX: number,
	centerY: number,
	size: number,
	rotation: number,
	deformation: UseScrollClipPathOptions['deformation'],
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

// Calculate the minimum safe size to prevent clipping at a given rotation
function calculateSafeMinSize(
	rotation: number,
	deformation: UseScrollClipPathOptions['deformation']
): number {
	const defaultDeformation = {
		topLeft: { x: -5, y: 2 },
		topRight: { x: 4, y: -2 },
		bottomRight: { x: 2, y: 3 },
		bottomLeft: { x: -2, y: -1 },
	};

	const def = deformation || defaultDeformation;

	// Find the maximum deformation offset
	const maxDeformation = Math.max(
		Math.abs(def.topLeft.x),
		Math.abs(def.topLeft.y),
		Math.abs(def.topRight.x),
		Math.abs(def.topRight.y),
		Math.abs(def.bottomRight.x),
		Math.abs(def.bottomRight.y),
		Math.abs(def.bottomLeft.x),
		Math.abs(def.bottomLeft.y)
	);

	// Calculate bounding box size for rotated square
	// For a square rotated by θ, the bounding box diagonal is size * (|cos(θ)| + |sin(θ)|)
	const rad = (rotation * Math.PI) / 180;
	const boundingFactor = Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad));

	// The minimum size should ensure that when rotated and deformed,
	// all corners stay within 0-100% range
	// Since we're centered at 50%, the max extent is 50% from center
	// We need: halfSize * boundingFactor + maxDeformation <= 50
	// Therefore: size <= 100 / (boundingFactor + maxDeformation/50)
	const safeSize = (100 - maxDeformation * 2) / boundingFactor;

	return Math.max(0, safeSize);
}

export function useScrollClipPath(options: UseScrollClipPathOptions = {}) {
	const {
		minSize: userMinSize = 20,
		maxSize = 100,
		startRotation = 45,
		endRotation = 0,
		preventClipping = false,
		deformation,
	} = options;

	// Calculate safe minimum size if preventClipping is enabled
	const safeMinSize = preventClipping
		? calculateSafeMinSize(
				Math.max(Math.abs(startRotation), Math.abs(endRotation)),
				deformation
			)
		: userMinSize;

	const minSize = preventClipping
		? Math.max(userMinSize, safeMinSize)
		: userMinSize;

	const [clipPath, setClipPath] = useState(
		'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'
	);

	// Use Framer Motion's useScroll for better performance
	const { scrollYProgress } = useScroll();

	// Transform scroll progress to size and rotation
	const size = useTransform(scrollYProgress, [0, 1], [minSize, maxSize]);
	const rotation = useTransform(
		scrollYProgress,
		[0, 1],
		[startRotation, endRotation]
	);

	// Memoized update function to avoid recreating it
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

	// Update clipPath when size changes
	useMotionValueEvent(size, 'change', latest => {
		const currentRotation = rotation.get();
		updateClipPath(latest, currentRotation);
	});

	// Update clipPath when rotation changes
	useMotionValueEvent(rotation, 'change', latest => {
		const currentSize = size.get();
		updateClipPath(currentSize, latest);
	});

	// Set initial state and handle parameter changes
	useEffect(() => {
		const currentSize = size.get();
		const currentRotation = rotation.get();
		updateClipPath(currentSize, currentRotation);
	}, [size, rotation, updateClipPath]);

	return clipPath;
}
