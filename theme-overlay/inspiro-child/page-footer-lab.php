<?php
/**
 * Template Name: Footer Lab
 *
 * A live prototype page for comparing the current footer with two concept
 * treatments without replacing the global site footer.
 *
 * @package Inspiro_Child
 */

$theme_version = wp_get_theme()->get( 'Version' );
$skin_footer_css_version = file_exists( get_stylesheet_directory() . '/assets/css/skin-footer.css' )
	? (string) filemtime( get_stylesheet_directory() . '/assets/css/skin-footer.css' )
	: $theme_version;
$footer_lab_css_version = file_exists( get_stylesheet_directory() . '/assets/css/footer-lab.css' )
	? (string) filemtime( get_stylesheet_directory() . '/assets/css/footer-lab.css' )
	: $theme_version;
$skin_footer_js_version = file_exists( get_stylesheet_directory() . '/assets/js/skin-footer.js' )
	? (string) filemtime( get_stylesheet_directory() . '/assets/js/skin-footer.js' )
	: $theme_version;
$preview_animation_js_version = file_exists( get_stylesheet_directory() . '/assets/js/footer-lab-preview-animation.js' )
	? (string) filemtime( get_stylesheet_directory() . '/assets/js/footer-lab-preview-animation.js' )
	: $theme_version;
$footer_lab_js_version = file_exists( get_stylesheet_directory() . '/assets/js/footer-lab.js' )
	? (string) filemtime( get_stylesheet_directory() . '/assets/js/footer-lab.js' )
	: $theme_version;
$footer_mesh_js_version = file_exists( get_stylesheet_directory() . '/assets/js/footer-mesh.js' )
	? (string) filemtime( get_stylesheet_directory() . '/assets/js/footer-mesh.js' )
	: $theme_version;

wp_enqueue_style(
	'inspiro-child-skin-footer',
	get_stylesheet_directory_uri() . '/assets/css/skin-footer.css',
	array(),
	$skin_footer_css_version
);

wp_enqueue_style(
	'inspiro-child-footer-lab',
	get_stylesheet_directory_uri() . '/assets/css/footer-lab.css',
	array( 'inspiro-parent', 'inspiro-style', 'inspiro-child-skin-footer', 'inspiro-child' ),
	$footer_lab_css_version
);

wp_add_inline_style(
	'inspiro-child-footer-lab',
	'.page-id-' . get_the_ID() . ' #colophon { display: none !important; }'
);

wp_enqueue_script(
	'inspiro-child-skin-footer',
	get_stylesheet_directory_uri() . '/assets/js/skin-footer.js',
	array(),
	$skin_footer_js_version,
	true
);

wp_enqueue_script(
	'inspiro-child-footer-lab-preview-animation',
	get_stylesheet_directory_uri() . '/assets/js/footer-lab-preview-animation.js',
	array(),
	$preview_animation_js_version,
	true
);

wp_enqueue_script(
	'inspiro-child-footer-lab',
	get_stylesheet_directory_uri() . '/assets/js/footer-lab.js',
	array( 'inspiro-child-skin-footer', 'inspiro-child-footer-lab-preview-animation' ),
	$footer_lab_js_version,
	true
);

wp_add_inline_script(
	'inspiro-child-footer-lab',
	'window.footerMeshModuleUrl = ' . wp_json_encode( get_stylesheet_directory_uri() . '/assets/js/footer-mesh.js?ver=' . rawurlencode( $footer_mesh_js_version ) ) . ';',
	'before'
);

get_header();

$footer_groups = array();
$menu_locations = get_nav_menu_locations();

for ( $i = 1; $i <= 5; $i++ ) {
	$location = "footer-$i";

	if ( ! has_nav_menu( $location ) ) {
		continue;
	}

	$menu_name = wp_get_nav_menu_name( $location );
	$menu_id   = isset( $menu_locations[ $location ] ) ? (int) $menu_locations[ $location ] : 0;
	$menu_obj  = $menu_id ? wp_get_nav_menu_object( $menu_id ) : null;
	$items     = $menu_obj ? wp_get_nav_menu_items( $menu_obj->term_id ) : array();

	$footer_groups[] = array(
		'title' => $menu_name,
		'items' => is_array( $items ) ? $items : array(),
	);
}

$footer_mesh_groups         = array();
$footer_mesh_contact_items  = array();
$footer_mesh_legal_items    = array();
$footer_mesh_legal_urls     = array(
	'legal'   => '',
	'privacy' => '',
);

foreach ( $footer_groups as $group ) {
	$group_title = strtolower( trim( $group['title'] ) );
	if ( 'contact' === $group_title ) {
		$footer_mesh_contact_items = $group['items'];
		continue;
	}
	if ( 'legal' === $group_title ) {
		$footer_mesh_legal_items = $group['items'];
		continue;
	}
	$footer_mesh_groups[] = $group;
}

foreach ( $footer_mesh_groups as &$group ) {
	if ( 'about' === strtolower( trim( $group['title'] ) ) ) {
		$group['items'] = array_merge( $group['items'], $footer_mesh_contact_items );
		break;
	}
}
unset( $group );

foreach ( $footer_mesh_legal_items as $item ) {
	if ( 'publish' !== $item->post_status || '0' !== (string) $item->menu_item_parent ) {
		continue;
	}
	if ( false !== stripos( $item->title, 'privacy' ) ) {
		$footer_mesh_legal_urls['privacy'] = $item->url;
	} elseif ( false !== stripos( $item->title, 'term' ) || false !== stripos( $item->title, 'legal' ) ) {
		$footer_mesh_legal_urls['legal'] = $item->url;
	}
}

$social_links = array(
	array(
		'label' => 'Instagram',
		'url'   => 'https://www.instagram.com/labskin_limited/',
	),
	array(
		'label' => 'YouTube',
		'url'   => 'https://www.youtube.com/@Labskin-skin-science/videos',
	),
	array(
		'label' => 'LinkedIn',
		'url'   => 'https://www.linkedin.com/company/labskin-ltd/posts/?feedView=all',
	),
);

$labskin_logo_url = get_stylesheet_directory_uri() . '/assets/images/labskin-logo-white.png';

$render_logo = static function () use ( $labskin_logo_url ) {
	return sprintf(
		'<a class="footer-lab-logo-link" href="%1$s"><img class="footer-lab-logo-img" src="%2$s" width="497" height="151" alt="LabSkin"></a>',
		esc_url( home_url( '/' ) ),
		esc_url( $labskin_logo_url )
	);
};

$social_icons = array(
	'instagram' => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
	'youtube'   => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/></svg>',
	'linkedin'  => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7.5 10.5V17M7.5 7.6v.1M11.2 17v-6.5M11.2 13c0-1.6 1-2.6 2.5-2.6s2.3.9 2.3 2.7V17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
);

$render_social = static function ( $links, $class = 'footer-lab-socials' ) use ( $social_icons ) {
	if ( empty( $links ) ) {
		return;
	}
	?>
	<div class="<?php echo esc_attr( $class ); ?>" role="group" aria-label="LabSkin social links">
		<?php foreach ( $links as $link ) : ?>
			<?php $icon_key = strtolower( $link['label'] ); ?>
			<?php if ( empty( $social_icons[ $icon_key ] ) ) { continue; } ?>
			<a class="footer-lab-social" href="<?php echo esc_url( $link['url'] ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr( 'LabSkin on ' . $link['label'] ); ?>" title="<?php echo esc_attr( $link['label'] ); ?>">
				<?php echo $social_icons[ $icon_key ]; // Static, trusted SVG markup. ?>
			</a>
		<?php endforeach; ?>
	</div>
	<?php
};

$render_group_grid = static function ( $groups, $column_class, $title_class, $list_class ) {
	foreach ( $groups as $group ) {
		if ( empty( $group['items'] ) ) {
			continue;
		}
		?>
		<nav class="<?php echo esc_attr( $column_class ); ?>" aria-label="<?php echo esc_attr( $group['title'] ); ?>">
			<h2 class="<?php echo esc_attr( $title_class ); ?>"><?php echo esc_html( $group['title'] ); ?></h2>
			<div class="<?php echo esc_attr( $list_class ); ?>">
				<?php foreach ( $group['items'] as $item ) : ?>
					<?php if ( 'publish' !== $item->post_status || '0' !== (string) $item->menu_item_parent ) { continue; } ?>
					<a href="<?php echo esc_url( $item->url ); ?>"><?php echo esc_html( $item->title ); ?></a>
				<?php endforeach; ?>
			</div>
		</nav>
		<?php
	}
};

$logo_markup = $render_logo();
?>

<div class="inner-wrap footer-lab-page">
	<main id="main" class="site-main footer-lab-page__content" role="main">
		<section class="footer-lab-shell">
			<header class="footer-lab-masthead">
				<div>
					<p class="footer-lab-eyebrow">Mischief &amp; Craft prototype surface</p>
					<h1>Footer Lab</h1>
					<p class="footer-lab-lead">Compare the live child-theme footer with four concept treatments. The mesh concept starts from the live footer and adds a more dramatic opening scene for review.</p>
				</div>
				<div class="footer-lab-badge">Prototype live on M&amp;C</div>
			</header>

			<section class="footer-lab-controls" aria-label="Footer variant selector">
				<div class="footer-lab-selector" role="tablist" aria-label="Footer treatments">
					<button type="button" role="tab" aria-selected="true" aria-pressed="true" data-footer-variant="current">Current footer</button>
					<button type="button" role="tab" aria-selected="false" aria-pressed="false" data-footer-variant="mesh">Mesh concept</button>
					<button type="button" role="tab" aria-selected="false" aria-pressed="false" data-footer-variant="preview">Evidence concept</button>
					<button type="button" role="tab" aria-selected="false" aria-pressed="false" data-footer-variant="fluorescent">Fluorescent concept</button>
					<button type="button" role="tab" aria-selected="false" aria-pressed="false" data-footer-variant="github">LabSkin-Dev footer</button>
				</div>
				<div class="footer-lab-status" id="footer-lab-status">Showing the live child-theme footer.</div>
			</section>

			<section class="footer-lab-viewer" aria-live="polite">
				<div class="footer-lab-panel is-active" data-footer-panel="current" aria-hidden="false">
					<div class="footer-lab-note">Live child theme footer</div>
					<footer class="site-footer footer-lab-current-footer" role="contentinfo">
						<div class="inner-wrap">
							<?php get_template_part( 'template-parts/footer/footer', 'widgets' ); ?>
							<?php get_template_part( 'template-parts/footer/footer', 'columns' ); ?>
							<?php $render_social( $social_links, 'footer-lab-socials footer-lab-current-social' ); ?>
							<div class="site-info footer-bottom">
								<p class="footer-copyright">
									&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?>
									<a href="<?php echo esc_url( home_url( '/' ) ); ?>">LabSkin Limited</a>.
									<?php esc_html_e( 'All rights reserved.', 'inspiro-child' ); ?>
								</p>
								<p class="footer-lab-registration">Registered in England and Wales Company number <strong>15371091</strong></p>
								<?php if ( get_bloginfo( 'description' ) ) : ?>
									<p class="footer-tagline"><?php bloginfo( 'description' ); ?></p>
								<?php endif; ?>
							</div>
						</div>
					</footer>
				</div>

				<div class="footer-lab-panel" data-footer-panel="mesh" aria-hidden="true" hidden>
					<!-- Reserved for a testimonial or client-logo band.
					<section class="footer-lab-mesh-intro" aria-labelledby="footer-lab-mesh-intro-title">
						<div class="footer-lab-mesh-intro__eyebrow">Enhanced footer treatment</div>
						<div class="footer-lab-mesh-intro__body">
							<h2 id="footer-lab-mesh-intro-title">Turn the live footer into a barrier surface.</h2>
							<p>This version preserves the live footer links, groups them into four compact columns, and leaves the right side open for the barrier mesh.</p>
						</div>
						<div class="footer-lab-mesh-intro__actions">
							<div class="footer-lab-mesh-variants" role="group" aria-label="Mesh shape">
								<button type="button" data-mesh-variant="insert" aria-pressed="true">Insert</button>
								<button type="button" data-mesh-variant="ribbon" aria-pressed="false">Ribbon</button>
							</div>
						</div>
					</section>
					-->
					<footer class="site-footer footer-lab-current-footer footer-lab-mesh-footer" role="contentinfo" data-mesh-state="idle">
						<div class="footer-lab-mesh-fallback" aria-hidden="true"></div>
						<canvas class="footer-lab-mesh-canvas" data-footer-mesh-canvas aria-hidden="true"></canvas>
						<div class="footer-lab-mesh-overlay">
							<span class="footer-lab-mesh-label">Mesh concept</span>
							<div class="footer-lab-mesh-variants" role="group" aria-label="Mesh shape">
								<button type="button" data-mesh-variant="insert" aria-pressed="true">Insert</button>
								<button type="button" data-mesh-variant="ribbon" aria-pressed="false">Ribbon</button>
							</div>
						</div>
						<output class="footer-lab-mesh-fps" data-footer-mesh-fps aria-live="off">FPS --</output>
						<div class="inner-wrap">
							<div class="footer-lab-mesh-columns">
								<?php $render_group_grid( $footer_mesh_groups, 'footer-lab-mesh-column', 'footer-lab-mesh-column-title', 'footer-lab-mesh-links' ); ?>
								<nav class="footer-lab-mesh-column footer-lab-mesh-connect" aria-label="Connect">
									<h2 class="footer-lab-mesh-column-title">Connect</h2>
									<?php $render_social( $social_links, 'footer-lab-socials footer-lab-mesh-socials' ); ?>
								</nav>
							</div>
							<div class="site-info footer-bottom">
								<p class="footer-copyright">
									&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?>
									<a href="<?php echo esc_url( home_url( '/' ) ); ?>">LabSkin Limited</a>. <?php esc_html_e( 'All rights reserved.', 'inspiro-child' ); ?>
									<?php if ( $footer_mesh_legal_urls['legal'] ) : ?>
										<a href="<?php echo esc_url( $footer_mesh_legal_urls['legal'] ); ?>">Legal</a>.
									<?php endif; ?>
									<?php if ( $footer_mesh_legal_urls['privacy'] ) : ?>
										<a href="<?php echo esc_url( $footer_mesh_legal_urls['privacy'] ); ?>">Privacy</a>.
									<?php endif; ?>
								</p>
								<p class="footer-lab-registration">Registered in England and Wales Company number <strong>15371091</strong></p>
								<?php if ( get_bloginfo( 'description' ) ) : ?>
									<p class="footer-tagline"><?php bloginfo( 'description' ); ?></p>
								<?php endif; ?>
							</div>
						</div>
					</footer>
				</div>

				<div class="footer-lab-panel" data-footer-panel="preview" aria-hidden="true" hidden>
					<div class="footer-lab-note">Evidence concept</div>
					<footer class="footer-field footer-field--static" aria-labelledby="layered-static-title">
						<canvas class="footer-field__canvas" data-footer-preview-canvas aria-hidden="true"></canvas>

						<div class="footer-field__hud" aria-hidden="true">
							<div class="footer-field__hud-row"><span>Keratin / cornified layer</span><span class="footer-field__swatch footer-field__swatch--pink"></span></div>
							<div class="footer-field__hud-row"><span>Labelled protein expression</span><span class="footer-field__swatch footer-field__swatch--green"></span></div>
							<div class="footer-field__hud-row"><span>DAPI-stained cell nuclei</span><span class="footer-field__swatch footer-field__swatch--blue"></span></div>
						</div>

						<div class="footer-field__content">
							<div class="footer-field__grid">
								<section class="footer-field__brand">
									<div class="footer-field__logo"><?php echo wp_kses_post( $logo_markup ); ?></div>
									<span class="footer-field__eyebrow">Human skin models · CRO testing</span>
									<h2 id="layered-static-title">Evidence in every layer.</h2>
									<p>Animated microscopy-inspired background for a footer: fluorescent staining, stratified skin structure, and a sweeping camera that moves through the sample without competing with footer content.</p>
									<?php $render_social( $social_links, 'footer-lab-socials footer-field__socials' ); ?>
								</section>

								<nav class="footer-field__list" aria-label="Services">
									<h3>Services</h3>
									<a href="/services/ex-vivo-skin-testing/">Ex vivo testing</a>
									<a href="/services/lab-grown-skin/">Lab-grown skin</a>
									<a href="/services/contract-research/">Efficacy studies</a>
								</nav>

								<nav class="footer-field__list" aria-label="Science">
									<h3>Science</h3>
									<a href="/histology-services/">Histology</a>
									<a href="/resources/">Biomarkers</a>
									<a href="/resources/">Imaging</a>
								</nav>

								<nav class="footer-field__list" aria-label="Company">
									<h3>Company</h3>
									<a href="/case-studies/">Case studies</a>
									<a href="/contact-us-2/">Contact</a>
									<a href="/about-us/">Quality</a>
								</nav>
							</div>

							<div class="footer-field__bottom">
								<span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> LabSkin Limited. All rights reserved. Registered in England and Wales Company number <strong>15371091</strong></span>
							</div>
						</div>
					</footer>
				</div>

				<div class="footer-lab-panel" data-footer-panel="fluorescent" aria-hidden="true" hidden>
					<div class="footer-lab-note">Fluorescent concept</div>
					<div class="footer-lab-journey-bar">
						<div class="footer-lab-journey-copy">
							<p class="footer-lab-journey-title">Follow the tissue.</p>
							<p class="footer-lab-journey-note">Prototype controls for an end-user review surface.</p>
						</div>
						<div class="footer-lab-journey-actions" role="group" aria-label="Animated footer view mode">
							<button type="button" data-skin-view="footer" aria-pressed="true">Behind footer content</button>
							<button type="button" data-skin-view="specimen" aria-pressed="false">Explore specimen</button>
						</div>
					</div>
					<footer class="skin-footer footer-lab-fluorescent" id="footer-lab-fluorescent" data-view="footer">
						<div class="skin-footer__scene" aria-hidden="true">
							<img class="skin-footer__image" src="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/images/skin-section.webp' ); ?>" alt="" width="1080" height="1080" loading="lazy" decoding="async">
						</div>
						<div class="skin-footer__veil" aria-hidden="true"></div>
						<div class="skin-footer__content footer-lab-fluorescent__content">
							<div class="footer-lab-fluorescent__caption">
								<span>Lab-grown skin. Human insight.</span>
								<span>Contract research<br>Skin science and testing</span>
							</div>
							<div class="footer-lab-fluorescent__main">
								<div class="footer-lab-fluorescent__brand">
									<div class="footer-lab-logo"><?php echo wp_kses_post( $logo_markup ); ?></div>
									<h2>Within the section.</h2>
									<p>Real footer content, live WordPress menus, and a motion-led specimen journey combined into one review surface. This treatment is intended as the boldest prototype, not the default production footer.</p>
									<?php $render_social( $social_links ); ?>
								</div>
								<div class="footer-lab-fluorescent__grid">
									<?php $render_group_grid( $footer_groups, 'footer-lab-fluorescent__column', 'footer-lab-fluorescent__title', 'footer-lab-fluorescent__links' ); ?>
								</div>
							</div>
							<div class="footer-lab-fluorescent__base">
								<span>LabSkin Limited / Research, reconstructed.</span>
								<span><?php bloginfo( 'description' ); ?></span>
							</div>
						</div>
						<span class="footer-lab-specimen-label">Source 01 / fluorescent skin section</span>
						<button class="skin-footer__motion" type="button" hidden>Pause background</button>
					</footer>
					<div class="footer-lab-scrubber">
						<label class="footer-lab-scrubber__label" for="footer-lab-progress">Camera journey</label>
						<input id="footer-lab-progress" data-skin-range type="range" min="0" max="100" step="0.1" value="0" aria-valuetext="0 percent of camera journey">
						<div class="footer-lab-scrubber__stops">
							<button type="button" data-skin-position="0">00 / Establish</button>
							<button type="button" data-skin-position="0.25">18 / Sweep</button>
							<button type="button" data-skin-position="0.5">36 / Cellular field</button>
							<button type="button" data-skin-position="0.75">54 / Return</button>
						</div>
						<p class="footer-lab-scrubber__status" id="footer-lab-motion-status" aria-live="polite">72-second seamless journey</p>
					</div>
				</div>

				<div class="footer-lab-panel" data-footer-panel="github" aria-hidden="true" hidden>
					<div class="footer-lab-note">LabSkin-Dev footer</div>
					<footer class="footer-lab-github" aria-label="LabSkin footer">
						<div class="footer-lab-github__container">
							<div class="footer-lab-github__main">
								<div class="footer-lab-github__links">
									<?php $render_group_grid( $footer_groups, 'footer-lab-github__column', 'footer-lab-github__title', 'footer-lab-github__list' ); ?>
								</div>
								<div class="footer-lab-github__brand">
									<div class="footer-lab-github__logo"><?php echo wp_kses_post( $logo_markup ); ?></div>
									<?php $render_social( $social_links, 'footer-lab-socials footer-lab-github__socials' ); ?>
								</div>
							</div>
							<div class="footer-lab-github__bottom">
								<div class="footer-lab-github__legal">
									<p>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> LabSkin Limited. All rights reserved.</p>
									<p class="footer-lab-registration">Registered in England and Wales Company number <strong>15371091</strong></p>
								</div>
								<?php $privacy_url = get_privacy_policy_url(); ?>
								<?php if ( $privacy_url ) : ?>
									<div class="footer-lab-github__bottom-links"><a href="<?php echo esc_url( $privacy_url ); ?>">Privacy Policy</a></div>
								<?php endif; ?>
							</div>
						</div>
					</footer>
				</div>
			</section>
		</section>
	</main>
</div>

<?php get_footer(); ?>