<?php
/*
Plugin Name: WPU Live Search
Description: Live Search datas
Plugin URI: https://github.com/WordPressUtilities/wpulivesearch
Version: 0.1.0
Author: Darklg
Author URI: http://darklg.me/
License: MIT License
License URI: http://opensource.org/licenses/MIT
*/

class WPULiveSearch {
    private $plugin_version = '0.1.0';

    public function __construct() {
        add_action('wp_enqueue_scripts', array(&$this, 'wp_enqueue_scripts'));
        add_action('wpulivesearch_form', array(&$this, 'display_form'), 10, 3);
    }

    public function wp_enqueue_scripts() {
        wp_register_script('wpulivesearch_front', plugins_url('assets/front.js', __FILE__), 'jquery', $this->plugin_version, true);
        wp_enqueue_script('wpulivesearch_front');
    }

    public function display_form($datas = array(), $filters = array(), $templates = array()) {
        if (!is_array($datas) || !is_array($filters)) {
            return;
        }

        foreach ($filters as &$filter) {
            if (!isset($filter['taxonomy'])) {
                continue;
            }

            $values = get_terms($filter['taxonomy'], array(
                'hide_empty' => false
            ));

            $filter['values'] = array();
            if (!is_wp_error($values)) {
                foreach ($values as $value) {
                    $filter['values'][$value->term_id] = $value->name;
                }
            }

            unset($filter['type']);
            unset($filter['taxonomy']);
        }

        echo '<script>';
        echo 'var wpulivesearch_filters=' . json_encode($filters) . ';';
        echo 'var wpulivesearch_datas=' . json_encode($datas) . ';';
        echo '</script>';
        echo '<form id="form_wpulivesearch" action="#" method="post">';
        echo '<div>';
        echo '<label for="wpulivesearch">' . __('Search') . '</label>';
        echo '<input placeholder="' . __('Search') . '" class="wpulivesearch-search" id="wpulivesearch" type="text" name="search" value="" />';
        echo '</div>';
        foreach ($filters as $key => $value) {
            echo '<select class="wpulivesearch-filter" name="' . $key . '" id="' . $key . '">';
            echo '<option value="">' . $key . '</option>';
            foreach ($value['values'] as $_val_id => $_val_name) {
                echo '<option value="' . $_val_id . '">' . $_val_name . '</option>';
            }
            echo '</select>';
        }
        echo '<input type="reset" id="wpulivesearch-reset" name="wpulivesearch-reset" value="' . __('Reset') . '" />';
        echo '</form>';
        echo '<div id="wpulivesearch_results"></div>';
        $this->display_templates($templates);

    }

    public function display_templates($templates = array()) {
        if (!is_array($templates)) {
            $templates = array();
        }

        $default_templates = array(
            'counter' => '<div>{{count}} result(s)</div>',
            'before' => '<ul class="livesearch-list">',
            'after' => '</ul>',
            'item' => '<li>{{name}}</li>'
        );

        foreach ($default_templates as $key => $value) {
            $value = isset($templates[$key]) ? $templates[$key] : $value;
            echo '<script type="template/html" id="wpulivesearch_results_' . $key . '">' . $value . '</script>';
        }

    }
}

$WPULiveSearch = new WPULiveSearch();
