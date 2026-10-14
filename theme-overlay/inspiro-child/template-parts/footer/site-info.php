<?php
/**
 * Displays the footer bottom bar: copyright and tagline.
 *
 * Replaces Inspiro's "Powered by WordPress / Theme by WPZOOM" credit.
 * Legal links (privacy, terms, sitemap) live in the footer menu columns.
 *
 * @package Inspiro_Child
 */

?>
<div class="site-info footer-bottom">
	<p class="footer-copyright">
		<span class="footer-copyright__legal">
			&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>">LabSkin Limited</a>.
			<?php esc_html_e( 'All rights reserved.', 'inspiro-child' ); ?>
		</span>
	</p>
	<?php if ( get_bloginfo( 'description' ) ) : ?>
		<p class="footer-tagline"><span class="footer-made-with-love"><?php esc_html_e( 'Made with', 'inspiro-child' ); ?> <span class="footer-pixel-heart" role="img" aria-label="<?php esc_attr_e( 'love', 'inspiro-child' ); ?>"></span> <?php esc_html_e( 'by LabSkin.', 'inspiro-child' ); ?></span> <?php bloginfo( 'description' ); ?></p>
	<?php endif; ?>
</div><!-- .site-info -->
