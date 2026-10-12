<?php

declare(strict_types=1);

$uploadRoot = $argv[1] ?? '';
$writeFiles = in_array('--write', $argv, true);
$quality = 90;

if ( '' === $uploadRoot || ! is_dir( $uploadRoot ) ) {
	fwrite( STDERR, "Usage: php optimize-homepage-images.php <uploads-root> [--write]\n" );
	exit( 2 );
}

if ( ! function_exists( 'imagewebp' ) || ! function_exists( 'imagecreatefromstring' ) ) {
	fwrite( STDERR, "GD WebP support is required.\n" );
	exit( 2 );
}

$relativePaths = array(
	'2024/06/cropped-HomePage-Website-small.png',
	'2024/06/cropped-HomePage-Website-small-300x180.png',
	'2024/06/cropped-HomePage-Website-small-1024x614.png',
	'2024/06/cropped-HomePage-Website-small-150x150.png',
	'2024/06/cropped-HomePage-Website-small-950x320.png',
	'2024/06/cropped-HomePage-Website-small-1900x640.png',
	'2024/06/gold-standard.png',
	'2024/06/gold-standard-300x220.png',
	'2024/06/gold-standard-150x150.png',
	'2024/06/gold-standard-675x320.png',
	'2024/06/who-we-are.png',
	'2024/06/who-we-are-300x150.png',
	'2024/06/who-we-are-150x150.png',
	'2024/04/PIONEERING-1.png',
	'2024/04/PIONEERING-1-300x150.png',
	'2024/04/PIONEERING-1-150x150.png',
	'2024/04/STAFF.png',
	'2024/04/STAFF-300x150.png',
	'2024/04/STAFF-150x150.png',
	'2024/04/INVEST.png',
	'2024/04/INVEST-300x150.png',
	'2024/04/INVEST-150x150.png',
	'2024/04/Labskin-Brand-Photography-York-Halifax-265.jpg',
	'2024/04/Labskin-Brand-Photography-York-Halifax-265-300x200.jpg',
	'2024/04/Labskin-Brand-Photography-York-Halifax-265-1024x683.jpg',
	'2024/04/Labskin-Brand-Photography-York-Halifax-265-150x150.jpg',
	'2024/04/Labskin-Brand-Photography-York-Halifax-265-950x320.jpg',
	'2024/04/Labskin-Brand-Photography-York-Halifax-265-1174x640.jpg',
	'2026/08/Map.png',
	'2026/08/Map-300x160.png',
	'2026/08/Map-1024x546.png',
	'2026/08/Map-150x150.png',
	'2026/08/Map-950x320.png',
	'2026/08/Map-1717x640.png',
);

$jobs = array();
$existingOutputs = array();
foreach ( $relativePaths as $relativePath ) {
	$source      = rtrim( $uploadRoot, DIRECTORY_SEPARATOR ) . DIRECTORY_SEPARATOR . str_replace( '/', DIRECTORY_SEPARATOR, $relativePath );
	$destination = dirname( $source ) . DIRECTORY_SEPARATOR . pathinfo( $source, PATHINFO_FILENAME ) . '.webp';
	$temp        = $destination . '.tmp';

	if ( ! is_file( $source ) ) {
		fwrite( STDERR, "Missing source image: {$source}\n" );
		exit( 1 );
	}
	if ( file_exists( $destination ) ) {
		$existingOutputs[] = $destination;
		continue;
	}
	if ( file_exists( $temp ) ) {
		fwrite( STDERR, "Refusing to overwrite temporary output: {$temp}\n" );
		exit( 1 );
	}

	$jobs[] = array(
		'source'      => $source,
		'destination' => $destination,
		'temp'        => $temp,
	);
}

if ( ! $writeFiles ) {
	foreach ( $existingOutputs as $destination ) {
		printf( "Already optimized; skipping %s\n", basename( $destination ) );
	}
	foreach ( $jobs as $job ) {
		printf( "Would convert %s (%s bytes) -> %s at quality %d\n", basename( $job['source'] ), filesize( $job['source'] ), basename( $job['destination'] ), $quality );
	}
	exit( 0 );
}

$completed = array();
try {
	foreach ( $jobs as $job ) {
		$imageBytes = file_get_contents( $job['source'] );
		$image = false === $imageBytes ? false : imagecreatefromstring( $imageBytes );
		if ( false === $image ) {
			throw new RuntimeException( "Could not decode {$job['source']}" );
		}

		$written = imagewebp( $image, $job['temp'], $quality );
		imagedestroy( $image );
		if ( ! $written ) {
			throw new RuntimeException( "WebP encoding failed for {$job['source']}" );
		}
		$completed[] = $job;
	}

	foreach ( $completed as $job ) {
		if ( ! rename( $job['temp'], $job['destination'] ) ) {
			throw new RuntimeException( "Could not finalize {$job['destination']}" );
		}
		$sourceBytes = filesize( $job['source'] );
		$webpBytes   = filesize( $job['destination'] );
		$saved       = $sourceBytes > 0 ? ( 1 - ( $webpBytes / $sourceBytes ) ) * 100 : 0;
		printf( "%s: %d -> %d bytes (%.1f%% smaller)\n", basename( $job['source'] ), $sourceBytes, $webpBytes, $saved );
	}
} catch ( Throwable $error ) {
	foreach ( $completed as $job ) {
		if ( is_file( $job['temp'] ) ) {
			unlink( $job['temp'] );
		}
	}
	fwrite( STDERR, $error->getMessage() . "\n" );
	exit( 1 );
}