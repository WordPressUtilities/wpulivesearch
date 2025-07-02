<?php
defined('ABSPATH') || die;

/* ----------------------------------------------------------
  Get query for all posts of a post type
---------------------------------------------------------- */

function wpulivesearch_get_query_for_post_type($post_type = 'post', $args = array()) {

    if (!is_array($args)) {
        $args = array();
    }
    if (!isset($args['filter_taxonomy_pages'])) {
        $args['filter_taxonomy_pages'] = array();
    }

    $q = array(
        'posts_per_page' => -1,
        'post_type' => $post_type
    );

    $tax_query = array();
    if ($args['filter_taxonomy_pages']) {
        foreach ($args['filter_taxonomy_pages'] as $taxonomy) {
            if (is_tax($taxonomy)) {
                $tax_query[] = array(
                    'taxonomy' => $taxonomy,
                    'field' => 'slug',
                    'terms' => get_query_var($taxonomy)
                );
            }
        }
    }
    if ($tax_query) {
        $q['tax_query'] = $tax_query;
    }

    return $q;
}

/* ----------------------------------------------------------
  Filter : post type
---------------------------------------------------------- */

function wpulivesearch_get_filters_post_type_values($post_type) {
    $items_values = array();
    $items = get_posts(array(
        'post_type' => $post_type,
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'orderby' => 'title',
        'order' => 'ASC'
    ));
    foreach ($items as $item) {
        $items_values[] = array(
            'label' => get_the_title($item->ID),
            'value' => $item->ID
        );
    }

    return $items_values;
}

/* ----------------------------------------------------------
  Get terms for post
---------------------------------------------------------- */

function wpulivesearch_get_terms_for_post($taxonomy = 'category', $field = 'slug') {
    $terms = get_the_terms(get_the_ID(), $taxonomy);
    $values = array();
    if ($terms) {
        foreach ($terms as $term) {
            $values[] = $term->$field;
        }
    }
    return $values;
}

/* ----------------------------------------------------------
  Get template HTML
---------------------------------------------------------- */

function wpulivesearch_get_template_html($template, $args = array()) {
    ob_start();
    include $template;
    return ob_get_clean();
}

/* ----------------------------------------------------------
  Get HTML as JS content
---------------------------------------------------------- */

function wpulivesearch_get_html_as_js_content($value) {
    /* Protect HTML quotes */
    $value = addslashes($value);

    /* Fix for multiline */
    $value = explode("\n", $value);
    $value = implode("'+\n'", $value);

    /* Add simple quotes */
    return "'" . $value . "'";
}

/* ----------------------------------------------------------
  Preload thumbnail cache for posts
---------------------------------------------------------- */

function wpulivesearch_preload_thumbnail_cache($post_ids) {
    $thumbnail_ids = [];

    /* Load all thumbnails ids */
    foreach ($post_ids as $post_id) {
        $thumbnail_id = get_post_meta($post_id, '_thumbnail_id', true);
        if ($thumbnail_id) {
            $thumbnail_ids[] = $thumbnail_id;
        }
    }

    /* Preload all metas for thumbnails */
    if (!empty($thumbnail_ids)) {
        _prime_post_caches($thumbnail_ids, false, true);
        update_meta_cache('post', $thumbnail_ids);
    }
}
