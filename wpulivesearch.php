<?php
/*
Plugin Name: WPU Live Search
Description: Live Search datas
Plugin URI: https://github.com/WordPressUtilities/wpulivesearch
Version: 0.3.4
Author: Darklg
Author URI: http://darklg.me/
License: MIT License
License URI: http://opensource.org/licenses/MIT
*/

class WPULiveSearch {
    private $plugin_version = '0.3.4';
    private $settings = array(
        'fulltext_and_filters' => true,
        'load_datas_in_file' => false,
        'results_per_page' => 999,
        'minimal_fulltext_value' => 1
    );

    public function __construct() {
        add_action('plugins_loaded', array(&$this, 'plugins_loaded'));
        add_action('wp_enqueue_scripts', array(&$this, 'wp_enqueue_scripts'));
        add_action('wpulivesearch_form', array(&$this, 'display_form'), 10, 3);
    }

    public function plugins_loaded() {
        /* Translation */
        load_plugin_textdomain('wpulivesearch', false, dirname(plugin_basename(__FILE__)) . '/lang/');

        /* Filter hook */
        $this->settings = apply_filters('wpulivesearch_settings', $this->settings);
    }

    public function wp_enqueue_scripts() {
        wp_register_script('wpulivesearch_front', plugins_url('assets/front.js', __FILE__), 'jquery', $this->plugin_version, true);
        wp_localize_script('wpulivesearch_front', 'wpulivesearch_settings', array(
            'fulltext_and_filters' => $this->settings['fulltext_and_filters'] ? 1 : 0,
            'results_per_page' => $this->settings['results_per_page'],
            'minimal_fulltext_value' => $this->settings['minimal_fulltext_value'],
            'plugin_version' => $this->plugin_version
        ));
        wp_enqueue_script('wpulivesearch_front');
    }

    public function display_form($datas = array(), $filters = array(), $templates = array()) {
        if (!is_array($datas) || !is_array($filters)) {
            return;
        }

        $filters = $this->build_filters($filters);
        $new_datas = $this->control_datas($datas);

        $wpulivesearch_datas = json_encode($new_datas['values']);

        $wpulivesearch_datas_js = 'var wpulivesearch_datas=' . $wpulivesearch_datas . ';';

        /* Load datas from an external file */
        if ($this->settings['load_datas_in_file']) {
            $wpulivesearch_datas_id = md5($wpulivesearch_datas);
            $wpulivesearch_datas_file_url = $wpulivesearch_datas_id . '.js';
            $wp_upload_dir = wp_upload_dir();
            $file = $wp_upload_dir['path'] . '/' . $wpulivesearch_datas_file_url;
            if (!file_exists($file)) {
                file_put_contents($file, $wpulivesearch_datas_js);
            }
            echo '<script>jQuery(document).ready(function($) {wpulivesearch_async_load("' . $wp_upload_dir['url'] . '/' . $wpulivesearch_datas_file_url . '")});</script>';
        } else {
            /* Display datas */
            echo '<script>' . $wpulivesearch_datas_js . '</script>';
            echo '<script>jQuery(document).ready(function(){jQuery(document).trigger("wpulivesearch_datas_ready");});</script>';
        }

        echo '<script>';
        echo 'var wpulivesearch_filters=' . json_encode($filters) . ';';
        echo 'var wpulivesearch_datas_keys=' . json_encode($new_datas['keys']) . ';';
        echo '</script>';
        echo '<form id="form_wpulivesearch" action="#" method="post">';
        echo '<div>';
        echo '<label for="wpulivesearch">' . __('Search', 'wpulivesearch') . '</label>';
        echo '<input placeholder="' . __('Search', 'wpulivesearch') . '" class="wpulivesearch-search" id="wpulivesearch" type="text" name="search" value="" />';
        echo '</div>';
        foreach ($filters as $key => $value) {
            echo '<select class="wpulivesearch-filter" name="' . $key . '" id="' . $key . '">';
            echo '<option value="">' . $key . '</option>';
            foreach ($value['values'] as $_val_id => $_val_name) {
                echo '<option value="' . $_val_id . '">' . $_val_name . '</option>';
            }
            echo '</select>';
        }
        echo '<input type="reset" id="wpulivesearch-reset" name="wpulivesearch-reset" value="' . __('Reset', 'wpulivesearch') . '" />';
        echo '</form>';
        echo '<div id="wpulivesearch_results"></div>';
        $this->display_templates($templates);

    }

    public function control_datas($_datas) {
        $keys = array();
        $datas = array();

        foreach ($_datas as $_data) {
            $_data = get_object_vars($_data);
            if (empty($_keys)) {
                $keys = array_keys($_data);
            }
            $_tmp_data = array();
            foreach ($_data as $key => $var) {
                $_tmp_data[] = $var;
            }
            $datas[] = $_tmp_data;
        }

        return array(
            'keys' => $keys,
            'values' => $datas
        );
    }

    public function build_filters($filters) {
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

        return $filters;
    }

    public function display_templates($templates = array()) {
        if (!is_array($templates)) {
            $templates = array();
        }

        $default_templates = array(
            'noresults' => '<div class="wpulivesearch-noresults">' . __('No results for this query, sorry', 'wpulivesearch') . '</div>',
            'counter' => '<div class="wpulivesearch-count">' . str_replace('%s', '{{count}}', __('%s result(s)', 'wpulivesearch')) . '</div>',
            'before' => '<ul data-livepagenb="{{page_nb}}" class="wpulivesearch-list">',
            'after' => '</ul>',
            'item' => '<li class="wpulivesearch-item">{{name}}</li>'
        );

        foreach ($default_templates as $key => $value) {
            $value = isset($templates[$key]) ? $templates[$key] : $value;
            echo '<script type="template/html" id="wpulivesearch_results_' . $key . '">' . $value . '</script>';
        }

    }
}

$WPULiveSearch = new WPULiveSearch();
