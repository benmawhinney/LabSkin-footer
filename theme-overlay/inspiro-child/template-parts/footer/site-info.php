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
		// A different emoji on each page load (heart, test tube, brain, microscope, DNA, petri dish):
		// care and science go into LabSkin. Devices that can't draw an emoji in colour get a pixel icon
		// instead of an empty box. Printed once per page; it updates every copy of the credit.
		if ( ! defined( 'INSPIRO_CHILD_MADE_WITH_ROTATION' ) ) :
			define( 'INSPIRO_CHILD_MADE_WITH_ROTATION', true );
			$made_with_icons = array(
				array( 'heart', "\u{2764}\u{FE0F}", __( 'love', 'inspiro-child' ) ),
				array( 'tube', "\u{1F9EA}", __( 'science', 'inspiro-child' ) ),
				array( 'brain', "\u{1F9E0}", __( 'brains', 'inspiro-child' ) ),
				array( 'microscope', "\u{1F52C}", __( 'microscopy', 'inspiro-child' ) ),
				array( 'dna', "\u{1F9EC}", __( 'DNA', 'inspiro-child' ) ),
				array( 'petri', "\u{1F9EB}", __( 'petri dishes', 'inspiro-child' ) ),
			);
			?>
			<script>
			(function (icons, fallbackLabel) {
				var key = "labskin-made-with", index = 0, pixel = { heart: 1, tube: 1, brain: 1 };
				try {
					var last = localStorage.getItem(key);
					if (last !== null && !isNaN(+last)) index = (+last + 1) % icons.length;
					localStorage.setItem(key, String(index));
				} catch (e) { /* storage blocked: keep the heart */ }
				// true when the emoji is drawn in colour; a missing glyph (empty box) or monochrome font is not
				function drawsInColour(emoji) {
					try {
						var c = document.createElement("canvas"); c.width = c.height = 24;
						var g = c.getContext("2d", { willReadFrequently: true }); if (!g) return false;
						g.textBaseline = "top"; g.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
						g.fillText(emoji, 0, 0);
						var d = g.getImageData(0, 0, 24, 24).data, tinted = 0;
						for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 64 && (Math.abs(d[i] - d[i + 1]) > 8 || Math.abs(d[i + 1] - d[i + 2]) > 8)) tinted++;
						return tinted > 3;
					} catch (e) { return false; }
				}
				function apply() {
					var icon = icons[index], emoji = drawsInColour(icon[1]);
					var shown = emoji || pixel[icon[0]] ? icon[0] : "heart", label = shown === icon[0] ? icon[2] : fallbackLabel;
					Array.prototype.forEach.call(document.querySelectorAll(".footer-pixel-heart"), function (el) {
						el.setAttribute("data-icon", shown);
						el.setAttribute("aria-label", label);
						if (emoji) { el.setAttribute("data-emoji", ""); el.textContent = icon[1]; }
						else { el.removeAttribute("data-emoji"); el.textContent = ""; }
					});
				}
				if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply); else apply();
			})(<?php echo wp_json_encode( $made_with_icons ); ?>, <?php echo wp_json_encode( __( 'love', 'inspiro-child' ) ); ?>);
			</script>
		<?php endif; ?>
	<?php endif; ?>
</div><!-- .site-info -->
