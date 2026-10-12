<?php
$model_explorer_path = get_stylesheet_directory() . '/assets/model-explorer/index.html';
$model_explorer_version = file_exists( $model_explorer_path ) ? (string) filemtime( $model_explorer_path ) : wp_get_theme()->get( 'Version' );
?>
<section class="labskin-model-explorer" aria-label="Labskin full-thickness skin model">
	<div class="inner-wrap">
		<iframe data-model-explorer-frame src="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/model-explorer/index.html?ver=' . rawurlencode( $model_explorer_version ) ); ?>" title="Explore Labskin: stratum corneum, epidermis and dermis" loading="lazy" height="1100"></iframe>
	</div>
</section>