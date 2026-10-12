<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package Inspiro
 * @subpackage Inspiro_Lite
 * @since Inspiro 1.0.0
 * @version 1.0.0
 */

?>

		</div><!-- #content -->

		<?php if ( is_front_page() ) { get_template_part( 'template-parts/model', 'explorer' ); } ?>

		<?php get_template_part( 'template-parts/footer/footer', 'instagram-widget' ); ?>

		<footer id="colophon" <?php inspiro_footer_class(); ?> role="contentinfo">
			<div class="inner-wrap">
				<?php
				if ( is_front_page() ) {
					get_template_part( 'template-parts/footer/footer', 'treatment-switcher' );
				} else {
					get_template_part( 'template-parts/footer/footer', 'widgets' );
					get_template_part( 'template-parts/footer/footer', 'columns' );
					get_template_part( 'template-parts/footer/site', 'info' );
				}
				?>
			</div><!-- .inner-wrap -->
		</footer><!-- #colophon -->
	</div><!-- .site-content-contain -->
</div><!-- #page -->
<?php wp_footer(); ?>

</body>
</html>
