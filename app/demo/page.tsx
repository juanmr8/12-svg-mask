'use client';
import '../globals.css';
import { useState } from 'react';
import { useInitialClipPath } from '@/hooks/use-initial-clip-path';
import { LenisProvider } from '@/components/lenis-provider';

function AnimatedDemo({
	config,
	animKey,
	onClipPathChange,
}: {
	config: any;
	animKey: number;
	onClipPathChange: (clipPath: string) => void;
}) {
	const { clipPath, isComplete } = useInitialClipPath(config);

	// Update parent with current clipPath
	onClipPathChange(clipPath);

	return (
		<>
			<div className='flex h-full items-center justify-center'>
				<div className='relative h-[500px] w-[500px]'>
					<div
						className='h-full w-full'
						style={{
							clipPath: clipPath,
							WebkitClipPath: clipPath,
							backgroundImage: 'url(/bg.png)',
							backgroundColor: '#f59e0b',
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							transition: isComplete ? 'opacity 0.3s ease-out' : 'none',
							opacity: isComplete ? 1 : 0.95,
						}}
					/>
					{/* Center Dot */}
					<div className='absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500' />
				</div>
			</div>
			{/* Status Indicator */}
			<div className='absolute right-4 bottom-4 rounded-full bg-white/10 px-4 py-2 font-mono text-sm text-white backdrop-blur-sm'>
				{isComplete ? '✓ Complete' : '⟳ Animating...'}
			</div>
		</>
	);
}

export default function DemoPage() {
	const [config, setConfig] = useState({
		duration: 1500,
		initialSize: 0,
		targetSize: 40,
		initialRotation: 180,
		targetRotation: 0,
		preventClipping: true,
		deformation: {
			topLeft: { x: -10, y: 5 },
			topRight: { x: 8, y: -4 },
			bottomRight: { x: 5, y: 6 },
			bottomLeft: { x: -4, y: -3 },
		},
	});

	const [key, setKey] = useState(0);
	const [clipPath, setClipPath] = useState(
		'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'
	);

	const handleReset = () => {
		setKey(prev => prev + 1);
	};

	return (
		<LenisProvider>
			<main className='min-h-screen bg-linear-to-br from-gray-900 to-gray-800 p-8'>
				<div className='mx-auto max-w-7xl'>
					<h1 className='mb-8 text-4xl font-bold text-white'>
						useInitialClipPath Hook Demo
					</h1>

					<div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
						{/* Demo Area */}
						<div className='flex flex-col gap-4'>
							<div className='relative h-[600px] w-full overflow-hidden rounded-lg bg-gray-800 p-8'>
								<AnimatedDemo
									key={key}
									config={config}
									animKey={key}
									onClipPathChange={setClipPath}
								/>
							</div>

							<button
								onClick={handleReset}
								className='rounded-lg bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600'
							>
								Reset Animation
							</button>
						</div>

						{/* Controls */}
						<div className='rounded-lg bg-gray-800 p-6'>
							<h2 className='mb-6 text-2xl font-bold text-white'>
								Configuration
							</h2>

							<div className='space-y-6'>
								{/* Duration */}
								<div>
									<label className='mb-2 block font-mono text-sm text-gray-400'>
										Duration: {config.duration}ms
									</label>
									<input
										type='range'
										min='500'
										max='3000'
										step='100'
										value={config.duration}
										onChange={e =>
											setConfig(prev => ({
												...prev,
												duration: Number(e.target.value),
											}))
										}
										className='w-full'
									/>
								</div>

								{/* Initial Size */}
								<div>
									<label className='mb-2 block font-mono text-sm text-gray-400'>
										Initial Size: {config.initialSize}%
									</label>
									<input
										type='range'
										min='0'
										max='50'
										step='1'
										value={config.initialSize}
										onChange={e =>
											setConfig(prev => ({
												...prev,
												initialSize: Number(e.target.value),
											}))
										}
										className='w-full'
									/>
								</div>

								{/* Target Size */}
								<div>
									<label className='mb-2 block font-mono text-sm text-gray-400'>
										Target Size: {config.targetSize}%
									</label>
									<input
										type='range'
										min='20'
										max='100'
										step='1'
										value={config.targetSize}
										onChange={e =>
											setConfig(prev => ({
												...prev,
												targetSize: Number(e.target.value),
											}))
										}
										className='w-full'
									/>
								</div>

								{/* Initial Rotation */}
								<div>
									<label className='mb-2 block font-mono text-sm text-gray-400'>
										Initial Rotation: {config.initialRotation}°
									</label>
									<input
										type='range'
										min='0'
										max='360'
										step='15'
										value={config.initialRotation}
										onChange={e =>
											setConfig(prev => ({
												...prev,
												initialRotation: Number(e.target.value),
											}))
										}
										className='w-full'
									/>
								</div>

								{/* Target Rotation */}
								<div>
									<label className='mb-2 block font-mono text-sm text-gray-400'>
										Target Rotation: {config.targetRotation}°
									</label>
									<input
										type='range'
										min='0'
										max='360'
										step='15'
										value={config.targetRotation}
										onChange={e =>
											setConfig(prev => ({
												...prev,
												targetRotation: Number(e.target.value),
											}))
										}
										className='w-full'
									/>
								</div>

								{/* Prevent Clipping */}
								<div className='flex items-center gap-3'>
									<input
										type='checkbox'
										id='preventClipping'
										checked={config.preventClipping}
										onChange={e =>
											setConfig(prev => ({
												...prev,
												preventClipping: e.target.checked,
											}))
										}
										className='h-5 w-5'
									/>
									<label
										htmlFor='preventClipping'
										className='font-mono text-sm text-gray-400'
									>
										Prevent Clipping
									</label>
								</div>

								{/* Deformation Controls */}
								<div className='mt-6 space-y-4 rounded-lg border border-gray-700 p-4'>
									<h3 className='mb-4 font-mono text-sm tracking-wider text-gray-400 uppercase'>
										Shape Deformation
									</h3>

									{/* Top Left */}
									<div className='space-y-2'>
										<p className='font-mono text-xs text-gray-500'>Top Left</p>
										<div className='grid grid-cols-2 gap-3'>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													X: {config.deformation.topLeft.x}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.topLeft.x}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																topLeft: {
																	...prev.deformation.topLeft,
																	x: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													Y: {config.deformation.topLeft.y}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.topLeft.y}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																topLeft: {
																	...prev.deformation.topLeft,
																	y: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
										</div>
									</div>

									{/* Top Right */}
									<div className='space-y-2'>
										<p className='font-mono text-xs text-gray-500'>Top Right</p>
										<div className='grid grid-cols-2 gap-3'>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													X: {config.deformation.topRight.x}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.topRight.x}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																topRight: {
																	...prev.deformation.topRight,
																	x: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													Y: {config.deformation.topRight.y}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.topRight.y}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																topRight: {
																	...prev.deformation.topRight,
																	y: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
										</div>
									</div>

									{/* Bottom Right */}
									<div className='space-y-2'>
										<p className='font-mono text-xs text-gray-500'>
											Bottom Right
										</p>
										<div className='grid grid-cols-2 gap-3'>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													X: {config.deformation.bottomRight.x}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.bottomRight.x}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																bottomRight: {
																	...prev.deformation.bottomRight,
																	x: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													Y: {config.deformation.bottomRight.y}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.bottomRight.y}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																bottomRight: {
																	...prev.deformation.bottomRight,
																	y: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
										</div>
									</div>

									{/* Bottom Left */}
									<div className='space-y-2'>
										<p className='font-mono text-xs text-gray-500'>
											Bottom Left
										</p>
										<div className='grid grid-cols-2 gap-3'>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													X: {config.deformation.bottomLeft.x}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.bottomLeft.x}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																bottomLeft: {
																	...prev.deformation.bottomLeft,
																	x: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
											<div>
												<label className='mb-1 block font-mono text-xs text-gray-400'>
													Y: {config.deformation.bottomLeft.y}
												</label>
												<input
													type='range'
													min='-50'
													max='50'
													step='1'
													value={config.deformation.bottomLeft.y}
													onChange={e =>
														setConfig(prev => ({
															...prev,
															deformation: {
																...prev.deformation,
																bottomLeft: {
																	...prev.deformation.bottomLeft,
																	y: Number(e.target.value),
																},
															},
														}))
													}
													className='w-full'
												/>
											</div>
										</div>
									</div>
								</div>

								{/* Debug Info */}
								<div className='mt-8 rounded-lg bg-black/30 p-4'>
									<h3 className='mb-2 font-mono text-xs tracking-wider text-gray-500 uppercase'>
										Current Clip Path
									</h3>
									<p className='font-mono text-xs break-all text-gray-300'>
										{clipPath}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Presets */}
					<div className='mt-8'>
						<h2 className='mb-4 text-2xl font-bold text-white'>Presets</h2>
						<div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
							<button
								onClick={() => {
									setConfig({
										duration: 1200,
										initialSize: 0,
										targetSize: 50,
										initialRotation: 180,
										targetRotation: 0,
										preventClipping: true,
										deformation: {
											topLeft: { x: -10, y: 5 },
											topRight: { x: 8, y: -4 },
											bottomRight: { x: 5, y: 6 },
											bottomLeft: { x: -4, y: -3 },
										},
									});
									handleReset();
								}}
								className='rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700'
							>
								Flip Down
							</button>
							<button
								onClick={() => {
									setConfig({
										duration: 1500,
										initialSize: 0,
										targetSize: 60,
										initialRotation: 90,
										targetRotation: 0,
										preventClipping: true,
										deformation: {
											topLeft: { x: -20, y: 10 },
											topRight: { x: 15, y: -8 },
											bottomRight: { x: 12, y: 15 },
											bottomLeft: { x: -15, y: -10 },
										},
									});
									handleReset();
								}}
								className='rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700'
							>
								Side Spin
							</button>
							<button
								onClick={() => {
									setConfig({
										duration: 2000,
										initialSize: 100,
										targetSize: 40,
										initialRotation: 360,
										targetRotation: 45,
										preventClipping: false,
										deformation: {
											topLeft: { x: -5, y: 2 },
											topRight: { x: 4, y: -2 },
											bottomRight: { x: 2, y: 3 },
											bottomLeft: { x: -2, y: -1 },
										},
									});
									handleReset();
								}}
								className='rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700'
							>
								Full Spin Shrink
							</button>
							<button
								onClick={() => {
									setConfig({
										duration: 1000,
										initialSize: 10,
										targetSize: 70,
										initialRotation: 45,
										targetRotation: 0,
										preventClipping: true,
										deformation: {
											topLeft: { x: -25, y: 15 },
											topRight: { x: 20, y: -12 },
											bottomRight: { x: 18, y: 20 },
											bottomLeft: { x: -22, y: -15 },
										},
									});
									handleReset();
								}}
								className='rounded-lg bg-pink-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-700'
							>
								Quick Expand
							</button>
						</div>
					</div>
				</div>
			</main>
		</LenisProvider>
	);
}
