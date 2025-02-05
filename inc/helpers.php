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
