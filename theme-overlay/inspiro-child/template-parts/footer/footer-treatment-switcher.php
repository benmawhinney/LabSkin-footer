<?php
/**
 * Homepage-only footer treatment preview.
 *
 * @package Inspiro_Child
 */

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

$footer_mesh_groups        = array();
$footer_mesh_contact_items = array();
$footer_mesh_legal_items   = array();
$footer_mesh_legal_urls    = array(
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
$render_logo      = static function () use ( $labskin_logo_url ) {
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
<section class="footer-lab-shell footer-lab-shell--homepage" data-footer-homepage>
	<section class="footer-lab-controls" aria-label="Footer treatment preview controls">
		<div class="footer-lab-controls__meta">
			<strong>Prototype controls</strong>
			<span>Not part of the final page! &#128522;</span>
		</div>
		<div class="footer-lab-selector" role="group" aria-label="Footer treatments">
			<button type="button" aria-pressed="true" data-footer-variant="current">Current footer</button>
			<button type="button" aria-pressed="false" data-footer-variant="github">LabSkin-Dev footer</button>
			<button type="button" aria-pressed="false" data-footer-variant="preview">Evidence</button>
			<button type="button" aria-pressed="false" data-footer-variant="fluorescent">Fluorescent</button>
			<button type="button" aria-pressed="false" data-footer-variant="mesh">Mesh</button>
		</div>
	</section>

	<section class="footer-lab-viewer" aria-live="polite">
		<div class="footer-lab-panel is-active" data-footer-panel="current" aria-hidden="false">
			<div class="site-footer footer-lab-current-footer">
				<div class="inner-wrap">
					<?php get_template_part( 'template-parts/footer/footer', 'widgets' ); ?>
					<?php get_template_part( 'template-parts/footer/footer', 'columns' ); ?>
					<?php get_template_part( 'template-parts/footer/site', 'info' ); ?>
				</div>
			</div>
		</div>

		<div class="footer-lab-panel" data-footer-panel="github" aria-hidden="true" hidden>
			<div class="footer-lab-github" aria-label="LabSkin footer">
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
					<div class="footer-lab-github__banner">
						<img src="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/images/scs-formulate-banner.jpg' ); ?>" alt="SCS Formulate 2026: Beyond the Horizon, the Future of Formulation. Visit stand 117 at Coventry Building Society Arena, 10-11 November." width="1940" height="500" loading="lazy" decoding="async">
					</div>
					<div class="footer-lab-github__bottom">
						<div class="footer-lab-github__legal">
							<p>&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> LabSkin Limited. All rights reserved.</p>
							<p class="footer-lab-registration">Registered in England and Wales Company number <strong>15371091</strong></p>
						</div>
						<?php $privacy_url = get_privacy_policy_url(); ?>
						<?php if ( $privacy_url ) : ?>
							<div class="footer-lab-github__bottom-links"><a href="<?php echo esc_url( $privacy_url ); ?>">Privacy Policy</a></div>
						<?php endif; ?>
					</div>
				</div>
			</div>
		</div>

		<div class="footer-lab-panel" data-footer-panel="preview" aria-hidden="true" hidden>
			<div class="footer-field footer-field--static" aria-labelledby="footer-home-evidence-title">
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
							<h2 id="footer-home-evidence-title">Evidence in every layer.</h2>
							<?php if ( get_bloginfo( 'description' ) ) : ?><p><?php bloginfo( 'description' ); ?></p><?php endif; ?>
							<?php $render_social( $social_links, 'footer-lab-socials footer-field__socials' ); ?>
						</section>
						<?php foreach ( $footer_groups as $group ) : ?>
							<?php if ( empty( $group['items'] ) ) { continue; } ?>
							<nav class="footer-field__list" aria-label="<?php echo esc_attr( $group['title'] ); ?>">
								<h3><?php echo esc_html( $group['title'] ); ?></h3>
								<?php foreach ( $group['items'] as $item ) : ?>
									<?php if ( 'publish' !== $item->post_status || '0' !== (string) $item->menu_item_parent ) { continue; } ?>
									<a href="<?php echo esc_url( $item->url ); ?>"><?php echo esc_html( $item->title ); ?></a>
								<?php endforeach; ?>
							</nav>
						<?php endforeach; ?>
					</div>
					<div class="footer-field__bottom">
						<span>&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'inspiro-child' ); ?></span>
					</div>
				</div>
			</div>
		</div>

		<div class="footer-lab-panel" data-footer-panel="fluorescent" aria-hidden="true" hidden>
			<div class="skin-footer footer-lab-fluorescent" id="footer-home-fluorescent" data-view="footer">
				<div class="skin-footer__scene" aria-hidden="true">
					<img class="skin-footer__image" src="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/images/skin-section.webp' ); ?>" alt="" width="1080" height="1080" loading="lazy" decoding="async">
				</div>
				<div class="skin-footer__veil" aria-hidden="true"></div>
				<div class="skin-footer__content footer-lab-fluorescent__content">
					<div class="footer-lab-fluorescent__caption">
						<span><?php bloginfo( 'name' ); ?></span>
						<span class="footer-lab-fluorescent__site-description"><?php bloginfo( 'description' ); ?></span>
					</div>
					<div class="footer-lab-fluorescent__main">
						<div class="footer-lab-fluorescent__brand">
							<div class="footer-lab-logo"><?php echo wp_kses_post( $logo_markup ); ?></div>
							<?php if ( get_bloginfo( 'description' ) ) : ?><p><?php bloginfo( 'description' ); ?></p><?php endif; ?>
							<?php $render_social( $social_links ); ?>
						</div>
						<div class="footer-lab-fluorescent__grid">
							<?php $render_group_grid( $footer_groups, 'footer-lab-fluorescent__column', 'footer-lab-fluorescent__title', 'footer-lab-fluorescent__links' ); ?>
						</div>
					</div>
					<div class="footer-lab-fluorescent__base">
						<span>&copy; <?php echo esc_html( wp_date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. <?php esc_html_e( 'All rights reserved.', 'inspiro-child' ); ?></span>
						<?php if ( get_bloginfo( 'description' ) ) : ?><span class="footer-lab-fluorescent__site-description"><?php bloginfo( 'description' ); ?></span><?php endif; ?>
					</div>
				</div>
			</div>
		</div>

		<div class="footer-lab-panel" data-footer-panel="mesh" aria-hidden="true" hidden>
			<div class="site-footer footer-lab-current-footer footer-lab-mesh-footer" data-mesh-state="idle">
				<div class="footer-lab-mesh-fallback" aria-hidden="true"></div>
				<canvas class="footer-lab-mesh-canvas" data-footer-mesh-canvas aria-hidden="true"></canvas>
				<div class="footer-lab-mesh-overlay">
					<span class="footer-lab-mesh-label">Mesh concept</span>
					<!--
					<div class="footer-lab-mesh-variants" role="group" aria-label="Mesh shape">
						<button type="button" data-mesh-variant="insert" aria-pressed="true">Insert</button>
						<button type="button" data-mesh-variant="ribbon" aria-pressed="false">Ribbon</button>
					</div>
					-->
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
							<?php if ( $footer_mesh_legal_urls['legal'] ) : ?><a href="<?php echo esc_url( $footer_mesh_legal_urls['legal'] ); ?>">Legal</a>.<?php endif; ?>
							<?php if ( $footer_mesh_legal_urls['privacy'] ) : ?><a href="<?php echo esc_url( $footer_mesh_legal_urls['privacy'] ); ?>">Privacy</a>.<?php endif; ?>
						</p>
						<p class="footer-lab-registration">Registered in England and Wales Company number <strong>15371091</strong></p>
						<?php if ( get_bloginfo( 'description' ) ) : ?><p class="footer-tagline"><?php bloginfo( 'description' ); ?></p><?php endif; ?>
					</div>
				</div>
			</div>
		</div>
	</section>
</section>
