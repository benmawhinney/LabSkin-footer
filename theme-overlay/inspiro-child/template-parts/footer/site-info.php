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
		<p class="footer-tagline"><span class="footer-made-with-love"><?php esc_html_e( 'Made with', 'inspiro-child' ); ?> <span class="footer-pixel-heart" data-icon="heart" role="img" aria-label="<?php esc_attr_e( 'love', 'inspiro-child' ); ?>"></span> <?php esc_html_e( 'by LabSkin.', 'inspiro-child' ); ?></span> <?php bloginfo( 'description' ); ?></p>
		<?php
		// Heart, then test tube, then brain on each page load: care and science go into LabSkin.
		// Printed once per page; it updates every copy of the credit (the homepage repeats the footer).
		if ( ! defined( 'INSPIRO_CHILD_MADE_WITH_ROTATION' ) ) :
			define( 'INSPIRO_CHILD_MADE_WITH_ROTATION', true );
			$made_with_icons = array(
				array( 'heart', __( 'love', 'inspiro-child' ) ),
				array( 'tube', __( 'science', 'inspiro-child' ) ),
				array( 'brain', __( 'brains', 'inspiro-child' ) ),
			);
			?>
			<script>
			(function (icons) {
				var key = "labskin-made-with", index = 0;
				try {
					var last = localStorage.getItem(key);
					if (last !== null && !isNaN(+last)) index = (+last + 1) % icons.length;
					localStorage.setItem(key, String(index));
				} catch (e) { /* storage blocked: keep the heart */ }
				function apply() {
					Array.prototype.forEach.call(document.querySelectorAll(".footer-pixel-heart"), function (el) {
						el.setAttribute("data-icon", icons[index][0]);
						el.setAttribute("aria-label", icons[index][1]);
					});
				}
				if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply); else apply();
			})(<?php echo wp_json_encode( $made_with_icons ); ?>);
			</script>
		<?php endif; ?>
	<?php endif; ?>
</div><!-- .site-info -->
