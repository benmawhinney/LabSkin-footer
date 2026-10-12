<?php

declare(strict_types=1);

$applyChanges = '1' === getenv( 'LABSKIN_WEBP_APPLY' )
	|| ( isset( $args ) && is_array( $args ) && in_array( '--apply', $args, true ) );
$homepageId  = (int) get_option( 'page_on_front' );
$uploads      = wp_upload_dir();
$baseUrl      = 'https://mischiefandcraft.com/wp-content/uploads/';
$headerImage  = '2024/06/cropped-HomePage-Website-small.png';
$attachmentMap = array(
	353 => $headerImage,
	261 => '2024/06/gold-standard.png',
	255 => '2024/06/who-we-are.png',
	72  => '2024/04/PIONEERING-1.png',
	73  => '2024/04/STAFF.png',
	74  => '2024/04/INVEST.png',
	112 => '2024/04/Labskin-Brand-Photography-York-Halifax-265.jpg',
	789 => '2026/08/Map.png',
);

if ( 2 !== $homepageId ) {
	fwrite( STDERR, "Expected staging front page ID 2; found {$homepageId}.\n" );
	exit( 1 );
}

$post = get_post( $homepageId );
if ( ! $post instanceof WP_Post ) {
	fwrite( STDERR, "Could not load homepage post {$homepageId}.\n" );
	exit( 1 );
}

$updatedContent = $post->post_content;
$referenceCounts = array();
$attachmentUpdates = array();

foreach ( $attachmentMap as $attachmentId => $relativePng ) {
	$relativeWebp = substr( $relativePng, 0, -4 ) . '.webp';
	$attachedFile = get_post_meta( $attachmentId, '_wp_attached_file', true );
	$metadata      = get_post_meta( $attachmentId, '_wp_attachment_metadata', true );

	if ( ! in_array( $attachedFile, array( $relativePng, $relativeWebp ), true ) || ! is_array( $metadata ) ) {
		fwrite( STDERR, "Attachment metadata does not match expected source for ID {$attachmentId}.\n" );
		exit( 1 );
	}

	$fullSource = trailingslashit( $uploads['basedir'] ) . $relativePng;
	$fullTarget = trailingslashit( $uploads['basedir'] ) . $relativeWebp;
	$targetInfo = is_file( $fullTarget ) ? getimagesize( $fullTarget ) : false;
	if ( ( $relativePng === $attachedFile && ! is_file( $fullSource ) ) || ! $targetInfo || IMAGETYPE_WEBP !== $targetInfo[2] ) {
		fwrite( STDERR, "Missing source or valid WebP output for attachment {$attachmentId}.\n" );
		exit( 1 );
	}

	$metadata['file'] = $relativeWebp;
	$metadata['filesize'] = filesize( $fullTarget );
	$metadata['sizes'] = (array) ( $metadata['sizes'] ?? array() );
	foreach ( array_keys( $metadata['sizes'] ) as $sizeName ) {
		$sizeData = $metadata['sizes'][ $sizeName ];
		$sizePath = dirname( $relativePng ) . '/' . $sizeData['file'];
		$sizeWebp = preg_match( '/\.webp$/i', $sizePath )
			? $sizePath
			: dirname( $sizePath ) . '/' . pathinfo( $sizePath, PATHINFO_FILENAME ) . '.webp';
		$sourceExtension = pathinfo( $relativePng, PATHINFO_EXTENSION );
		$sizeSourcePath = dirname( $sizePath ) . '/' . pathinfo( $sizePath, PATHINFO_FILENAME ) . '.' . $sourceExtension;
		$sizeTarget = trailingslashit( $uploads['basedir'] ) . $sizeWebp;
		$sizeInfo = is_file( $sizeTarget ) ? getimagesize( $sizeTarget ) : false;
		if ( ! $sizeInfo || IMAGETYPE_WEBP !== $sizeInfo[2] ) {
			fwrite( STDERR, "Missing WebP responsive size {$sizeWebp}.\n" );
			exit( 1 );
		}
		$metadata['sizes'][ $sizeName ]['file'] = basename( $sizeWebp );
		$metadata['sizes'][ $sizeName ]['mime-type'] = 'image/webp';
		$metadata['sizes'][ $sizeName ]['filesize'] = filesize( $sizeTarget );

		if ( $attachmentId !== 353 ) {
			$oldSizeUrlHttp = 'http://mischiefandcraft.com/wp-content/uploads/' . $sizeSourcePath;
			$oldSizeUrlHttps = 'https://mischiefandcraft.com/wp-content/uploads/' . $sizeSourcePath;
			$newSizeUrl = $baseUrl . $sizeWebp;
			$countHttp = 0;
			$countHttps = 0;
			$updatedContent = str_replace( $oldSizeUrlHttp, $newSizeUrl, $updatedContent, $countHttp );
			$updatedContent = str_replace( $oldSizeUrlHttps, $newSizeUrl, $updatedContent, $countHttps );
			$referenceCounts[ $sizeSourcePath ] = ( $referenceCounts[ $sizeSourcePath ] ?? 0 ) + $countHttp + $countHttps;
		}
	}
	$attachmentUpdates[ $attachmentId ] = array(
		'file' => $relativeWebp,
		'metadata' => $metadata,
	);

	if ( $attachmentId !== 353 ) {
		$oldUrlHttp = 'http://mischiefandcraft.com/wp-content/uploads/' . $relativePng;
		$oldUrlHttps = 'https://mischiefandcraft.com/wp-content/uploads/' . $relativePng;
		$newUrl = $baseUrl . $relativeWebp;
		$countHttp = 0;
		$countHttps = 0;
		$updatedContent = str_replace( $oldUrlHttp, $newUrl, $updatedContent, $countHttp );
		$updatedContent = str_replace( $oldUrlHttps, $newUrl, $updatedContent, $countHttps );
		$referenceCounts[ $relativePng ] = $countHttp + $countHttps;
	}
}

$themeMods = get_option( 'theme_mods_inspiro-child' );
if ( ! is_array( $themeMods ) || empty( $themeMods['header_image_data'] ) ) {
	fwrite( STDERR, "Could not load the child theme's custom header settings.\n" );
	exit( 1 );
}

$headerUrl = $baseUrl . substr( $headerImage, 0, -4 ) . '.webp';
$headerData = $themeMods['header_image_data'];
if ( is_object( $headerData ) ) {
	$headerData->url = $headerUrl;
	$headerData->thumbnail_url = $headerUrl;
} elseif ( is_array( $headerData ) ) {
	$headerData['url'] = $headerUrl;
	$headerData['thumbnail_url'] = $headerUrl;
} else {
	fwrite( STDERR, "Unexpected custom header metadata type.\n" );
	exit( 1 );
}
$themeMods['header_image'] = $headerUrl;

echo $applyChanges ? "Applying homepage WebP references.\n" : "Dry run only; no WordPress data changed.\n";
echo "Header: {$headerUrl}\n";
foreach ( $referenceCounts as $relativePng => $count ) {
	echo "Content references: {$relativePng} -> " . substr( $relativePng, 0, -4 ) . ".webp ({$count} replacements)\n";
}
echo 'Attachments to update: ' . implode( ', ', array_keys( $attachmentUpdates ) ) . "\n";

if ( ! $applyChanges ) {
	exit( 0 );
}

$backupPath = getenv( 'LABSKIN_WEBP_BACKUP' ) ?: '/home/ubuntu/homepage-webp-before-20261009.json';
if ( file_exists( $backupPath ) ) {
	fwrite( STDERR, "Refusing to overwrite migration backup: {$backupPath}\n" );
	exit( 1 );
}

$backupAttachments = array();
foreach ( array_keys( $attachmentUpdates ) as $attachmentId ) {
	$attachmentPost = get_post( $attachmentId );
	$backupAttachments[ $attachmentId ] = array(
		'post_mime_type' => $attachmentPost instanceof WP_Post ? $attachmentPost->post_mime_type : '',
		'attached_file' => get_post_meta( $attachmentId, '_wp_attached_file', true ),
		'metadata' => get_post_meta( $attachmentId, '_wp_attachment_metadata', true ),
	);
}

$backupContents = array(
	'created_at' => gmdate( DATE_ATOM ),
	'homepage_post_id' => $homepageId,
	'homepage_post_content' => $post->post_content,
	'header_theme_mods' => get_option( 'theme_mods_inspiro-child' ),
	'attachments' => $backupAttachments,
);
$backupJson = wp_json_encode( $backupContents, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
if ( ! is_string( $backupJson ) || false === file_put_contents( $backupPath, $backupJson, LOCK_EX ) ) {
	fwrite( STDERR, "Could not write migration rollback file: {$backupPath}\n" );
	exit( 1 );
}
chmod( $backupPath, 0600 );
@chown( $backupPath, 'ubuntu' );
@chgrp( $backupPath, 'ubuntu' );
echo "Saved targeted rollback data to {$backupPath}\n";

foreach ( $attachmentUpdates as $attachmentId => $update ) {
	update_post_meta( $attachmentId, '_wp_attached_file', $update['file'] );
	update_post_meta( $attachmentId, '_wp_attachment_metadata', $update['metadata'] );
	$result = wp_update_post( array( 'ID' => $attachmentId, 'post_mime_type' => 'image/webp' ), true );
	if ( is_wp_error( $result ) ) {
		fwrite( STDERR, $result->get_error_message() . "\n" );
		exit( 1 );
	}
}

update_option( 'theme_mods_inspiro-child', $themeMods );
$postResult = wp_update_post( array( 'ID' => $homepageId, 'post_content' => $updatedContent ), true );
if ( is_wp_error( $postResult ) ) {
	fwrite( STDERR, $postResult->get_error_message() . "\n" );
	exit( 1 );
}

echo "Homepage header, attachment metadata, and image block URLs updated.\n";