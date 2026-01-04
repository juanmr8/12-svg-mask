'use client';
import './globals.css';
import { useRef } from 'react';
import { useMousePosition } from '@/hooks/use-mouse-position';
import { useScrollClipPath } from '@/hooks/use-scroll-clip-path';
import { LenisProvider } from '@/components/lenis-provider';

export default function Page() {
	const { x, y } = useMousePosition();
	const divRef = useRef<HTMLDivElement>(null);
	const clipPath = useScrollClipPath({
		minSize: 20,
		maxSize: 100,
		startRotation: 190,
		endRotation: 0,
		preventClipping: true,
		deformation: {
			topLeft: { x: -90, y: 2 },
			topRight: { x: 50, y: -2 },
			bottomRight: { x: 10, y: 10 },
			bottomLeft: { x: -20, y: -1 },
		},
	});
	
	return (
		<LenisProvider>

		<main className='bg-[#F5F5F5]'>
			{/* Add content to enable scrolling */}
			<div className='h-[200vh]'>
				<div className='sticky top-0 flex h-screen items-center justify-center'>
					{/* Clipped div */}
					<div
						ref={divRef}
						className='h-[800px] w-[800px]'
						style={{
							clipPath: clipPath,
							WebkitClipPath: clipPath,
							backgroundImage: 'url(/bg.png)',
							backgroundColor: '#f59e0b',
							backgroundSize: 'cover',
							backgroundPosition: 'center',
						}}
					/>
				</div>
			</div>
		</main>
		</LenisProvider>
	);
}
