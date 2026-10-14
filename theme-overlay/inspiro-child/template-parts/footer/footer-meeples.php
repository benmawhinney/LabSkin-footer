<?php $meeples_version = (string) filemtime( get_stylesheet_directory() . '/assets/meeples/labskin-footer.js' ); ?>
<div class="site-footer footer-lab-current-footer footer-lab-meeples-footer" data-meeples-version="<?php echo esc_attr( $meeples_version ); ?>">
	<div class="inner-wrap">
		<?php get_template_part( 'template-parts/footer/footer', 'widgets' ); ?>
		<?php get_template_part( 'template-parts/footer/footer', 'columns' ); ?>
		<div class="lsf-scene" data-lsf-hours="Mon-Fri 09:00-17:30" data-lsf-phone="+447387001146" data-lsf-contact="<?php echo esc_url( home_url( '/contact-us-2/' ) ); ?>" data-lsf-bot="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/meeples/labskin-bot-32.png' ); ?>" data-lsf-sprites="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/meeples/labskin-meeples-32.png' ); ?>" data-lsf-atlas="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/meeples/labskin-meeples.json' ); ?>" data-lsf-logo="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/meeples/labskin-logo-pixel.png' ); ?>" data-lsf-screen-cell="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/meeples/cell-pixel-art-100x60.png' ); ?>"></div>
		<?php get_template_part( 'template-parts/footer/site', 'info' ); ?>
	</div>
</div>
