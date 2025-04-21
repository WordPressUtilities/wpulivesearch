<?php
defined('ABSPATH') || die;
/*
Plugin Name: WPU Live Search
Description: Live Search datas
Plugin URI: https://github.com/WordPressUtilities/wpulivesearch
Update URI: https://github.com/WordPressUtilities/wpulivesearch
Version: 0.28.1
Author: Darklg
Author URI: https://darklg.me/
Text Domain: wpulivesearch
Domain Path: /lang
Requires at least: 6.2
Requires PHP: 8.0
Network: Optional
License: MIT License
License URI: https://opensource.org/licenses/MIT
*/

class WPULiveSearch {
    private $plugin_version = '0.28.1';
    public $plugin_description;
    public $settings_update;
    private $settings = array(
        'load_all_default' => false,
        'view_selected_simple_replace_label' => false,
        'view_selected_multiple_values' => false,
        'view_selected_hide_values_label' => false,
        'view_selected__before' => '(',
        'view_selected__after' => ')',
        'fulltext_and_filters' => true,
        'fulltext_keys' => array('name'),
        'load_datas_in_file' => false,
        'inclusive_search' => false,
        'results_per_page' => 999,
        'nb_items_in_pager' => 9,
        'sort_results_callback' => false,
        'pager_load_more' => false,
        'dynamic_url' => true,
        'minimal_fulltext_value' => 1,
        'minimal_numeric_value' => 0,
        'search_form_order' => array(
            'search_form',
            'filters',
            'reset'
        )
    );

    public function __construct() {
        add_action('plugins_loaded', array(&$this, 'plugins_loaded'));
        add_action('init', array(&$this, 'load_translation'));
        add_action('wp', array(&$this, 'wp'));
        add_action('wp_enqueue_scripts', array(&$this, 'wp_enqueue_scripts'));
        add_action('wpulivesearch_form', array(&$this, 'display_form'), 10, 4);
    }

    public function load_translation() {
        $lang_dir = dirname(plugin_basename(__FILE__)) . '/lang/';
        if (strpos(__DIR__, 'mu-plugins') !== false) {
            load_muplugin_textdomain('wpulivesearch', $lang_dir);
        } else {
            load_plugin_textdomain('wpulivesearch', false, $lang_dir);
        }

        $this->plugin_description = __('Live Search datas', 'wpulivesearch');
    }

    public function plugins_loaded() {

        /* Updater */
        require_once __DIR__ . '/inc/WPUBaseUpdate/WPUBaseUpdate.php';
        $this->settings_update = new \wpulivesearch\WPUBaseUpdate(
            'WordPressUtilities',
            'wpulivesearch',
            $this->plugin_version);

    }

    public function wp() {
        /* Filter hook */
        $this->settings = apply_filters('wpulivesearch_settings', $this->settings);
    }

    public function wp_enqueue_scripts() {
        wp_register_style('wpulivesearch_front_css', plugins_url('assets/front.css', __FILE__), '', $this->plugin_version);
        wp_enqueue_style('wpulivesearch_front_css');
        wp_register_script('wpulivesearch_front_js', plugins_url('assets/front.js', __FILE__), '', $this->plugin_version, true);
        wp_localize_script('wpulivesearch_front_js', 'wpulivesearch_settings', array(
            'fulltext_and_filters' => $this->settings['fulltext_and_filters'] ? 1 : 0,
            'fulltext_keys' => $this->settings['fulltext_keys'],
            'sort_results_callback' => $this->settings['sort_results_callback'],
            'nb_items_in_pager' => $this->settings['nb_items_in_pager'],
            'load_all_default' => $this->settings['load_all_default'] ? 1 : 0,
            'pager_load_more' => $this->settings['pager_load_more'] ? 1 : 0,
            'dynamic_url' => $this->settings['dynamic_url'] ? 1 : 0,
            'results_per_page' => $this->settings['results_per_page'],
            'inclusive_search' => $this->settings['inclusive_search'],
            'view_selected_multiple_values' => $this->settings['view_selected_multiple_values'],
            'view_selected_hide_values_label' => $this->settings['view_selected_hide_values_label'],
            'view_selected_simple_replace_label' => $this->settings['view_selected_simple_replace_label'],
            'view_selected__before' => $this->settings['view_selected__before'],
            'view_selected__after' => $this->settings['view_selected__after'],
            'minimal_fulltext_value' => $this->settings['minimal_fulltext_value'],
            'minimal_numeric_value' => $this->settings['minimal_numeric_value'],
            'search_form_order' => $this->settings['search_form_order'],
            'plugin_version' => $this->plugin_version
        ));
        wp_enqueue_script('wpulivesearch_front_js');
    }

    public function display_form($datas = array(), $filters = array(), $templates = array(), $form_settings = array()) {

        if (!is_array($datas) && is_object($datas) && isset($datas->name)) {
            $datas = array($datas);
        }

        if (!is_array($datas) || !is_array($filters)) {
            return;
        }

        if (!is_array($form_settings)) {
            $form_settings = array();
        }
        if (!isset($form_settings['form_classname'])) {
            $form_settings['form_classname'] = '';
        }
        $filters = $this->build_filters($filters);
        $new_datas = $this->control_datas($datas);

        $wpulivesearch_datas = json_encode($new_datas['values']);

        $wpulivesearch_datas_js = 'window.wpulivesearch_datas=' . $wpulivesearch_datas . ';';

        /* Load datas from an external file */
        if ($this->settings['load_datas_in_file']) {
            $wpulivesearch_datas_id = md5($wpulivesearch_datas);
            $wpulivesearch_datas_file_url = $wpulivesearch_datas_id . '.js';
            $wp_upload_dir = wp_upload_dir();
            $file = $wp_upload_dir['path'] . '/' . $wpulivesearch_datas_file_url;
            if (!file_exists($file)) {
                file_put_contents($file, $wpulivesearch_datas_js);
            }
            echo '<script>document.addEventListener("DOMContentLoaded",function(){wpulivesearch_async_load("' . $wp_upload_dir['url'] . '/' . $wpulivesearch_datas_file_url . '")});</script>';
        } elseif (isset($form_settings['load_datas_manual']) && $form_settings['load_datas_manual']) {
            /* Do nothing */
        } else {
            /* Display datas */
            echo '<script>' . $wpulivesearch_datas_js . '</script>';
            echo '<script>document.addEventListener("DOMContentLoaded",function(){wpulivesearch_trigger_datas_ready()});</script>';
        }
        echo '<script>';
        echo 'window.wpulivesearch_filters=' . json_encode($filters) . ';';
        echo 'window.wpulivesearch_datas_keys=' . json_encode($new_datas['keys']) . ';';
        echo '</script>';
        echo '<div class="form-wpulivesearch__wrapper">';
        do_action('wpulivesearch_formwrapper_before_form');
        echo '<form class="' . trim(esc_html('form-wpulivesearch ' . $form_settings['form_classname'])) . '" id="form_wpulivesearch" action="#" method="post" onsubmit="return false">';
        do_action('wpulivesearch_form_before_content');
        if (!is_array($this->settings['search_form_order'])) {
            $this->settings['search_form_order'] = array();
        }
        $search_form_order = array_unique($this->settings['search_form_order']);
        foreach ($search_form_order as $item) {
            switch ($item) {
            case 'search_form':
                echo $this->display_search_form();
                break;
            case 'filters':
                echo $this->display_filters($filters);
                break;
            case 'reset':
                echo $this->display_reset();
                break;
            }
        }
        do_action('wpulivesearch_form_after_content');
        echo '</form>';
        do_action('wpulivesearch_formwrapper_after_form');
        echo '</div>';
        $default_html_template = '';
        if (isset($templates['default'])) {
            $default_html_template = $templates['default'];
        }

        echo apply_filters('wpulivesearch_results_base_html', '<div aria-live="polite" id="wpulivesearch_results">' . $default_html_template . '</div>');
        echo $this->display_templates($templates);
    }

    public function control_datas($_datas) {
        $keys = array();
        $datas = array();

        foreach ($_datas as $_data) {
            if (!is_array($_data)) {
                $_data = get_object_vars($_data);
            }
            /* Minify HTML if possible */
            if (isset($_data['html'])) {
                /* Useless spaces */
                $_data['html'] = trim($_data['html']);
                $_data['html'] = preg_replace('/\s+/', ' ', $_data['html']);

                /* Replace absolute URLs by relative URLs */
                $_data['html'] = str_replace(get_site_url() . '/', '/', $_data['html']);
            }
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

            /* HTML */
            if (!isset($filter['values_html_before'])) {
                $filter['values_html_before'] = '';
            }
            if (!isset($filter['values_html_after'])) {
                $filter['values_html_after'] = '';
            }

            /* View all */
            if (!isset($filter['view_all_label'])) {
                $filter['view_all_label'] = __('View all', 'wpulivesearch');
            }
            if (!isset($filter['has_view_all'])) {
                $filter['has_view_all'] = false;
            }
            $filter['has_view_all'] = !!$filter['has_view_all'];

            /* Visible in URL */
            if (!isset($filter['enabled_in_url'])) {
                $filter['enabled_in_url'] = true;
            }
            $filter['enabled_in_url'] = !!$filter['enabled_in_url'];

            /* Use term_id or slug */
            if (!isset($filter['value_field'])) {
                $filter['value_field'] = 'term_id';
            }

            if (!isset($filter['taxonomy'])) {
                continue;
            }
            $hide_empty = false;
            if (isset($filter['hide_empty'])) {
                $hide_empty = $filter['hide_empty'];
            }
            $values = get_terms($filter['taxonomy'], array(
                'hide_empty' => $hide_empty
            ));
            $filter['values'] = array();
            if (!is_wp_error($values)) {
                if (!isset($filter['label_callback'])) {
                    $filter['label_callback'] = 'name';
                }
                foreach ($values as $value) {
                    $value = get_object_vars($value);
                    $label = $value['name'];
                    if ($filter['label_callback'] != 'name' && function_exists($filter['label_callback'])) {
                        $label = call_user_func($filter['label_callback'], $value);
                    }
                    $filter['values'][] = array(
                        'value' => $value[$filter['value_field']],
                        'label' => $label
                    );
                }
            }

            unset($filter['type']);
            unset($filter['taxonomy']);
        }

        foreach ($filters as &$filter) {
            if (!isset($filter['sortby'])) {
                continue;
            }
            $callback_uasort = array(&$this, 'sort_alpha_label');
            if ($filter['sortby'] == 'labelinv') {
                $callback_uasort = array(&$this, 'sort_alpha_label_inv');
            }
            if ($filter['sortby'] == 'value') {
                $callback_uasort = array(&$this, 'sort_alpha_value');
            }
            if ($filter['sortby'] == 'valueinv') {
                $callback_uasort = array(&$this, 'sort_alpha_value_inv');
            }
            uasort($filter['values'], $callback_uasort);
            unset($filter['sortby']);
        }

        return $filters;
    }

    public function sort_alpha_label($a, $b) {
        $_a = remove_accents(strtolower($a['label']));
        $_b = remove_accents(strtolower($b['label']));
        return strcmp($_a, $_b);
    }

    public function sort_alpha_label_inv($a, $b) {
        $_a = remove_accents(strtolower($a['label']));
        $_b = remove_accents(strtolower($b['label']));
        return strcmp($_b, $_a);
    }

    public function sort_alpha_value($a, $b) {
        $_a = remove_accents(strtolower($a['value']));
        $_b = remove_accents(strtolower($b['value']));
        return strcmp($_a, $_b);
    }

    public function sort_alpha_value_inv($a, $b) {
        $_a = remove_accents(strtolower($a['value']));
        $_b = remove_accents(strtolower($b['value']));
        return strcmp($_b, $_a);
    }

    /* ----------------------------------------------------------
      Display
    ---------------------------------------------------------- */

    /* Reset
    -------------------------- */

    public function display_reset() {
        $return = '<div class="wpulivesearch-reset-wrapper">';
        $return .= apply_filters('wpulivesearch_reset_button_base_html', '<input type="reset" id="wpulivesearch-reset" name="wpulivesearch-reset" value="' . apply_filters('wpulivesearch_text_resetbutton_text', __('Reset', 'wpulivesearch')) . '" />', apply_filters('wpulivesearch_text_resetbutton_text', __('Reset', 'wpulivesearch')));
        $return .= '</div>';
        return $return;
    }

    /* Search
    -------------------------- */

    public function display_search_form() {
        $html = '<div class="wpulivesearch-search">';
        $html .= '<label for="wpulivesearch">' . apply_filters('wpulivesearch_text_search_label', __('Search', 'wpulivesearch')) . '</label>';
        $html .= '<input placeholder="' . apply_filters('wpulivesearch_text_search_placeholder', __('Search', 'wpulivesearch')) . '" class="wpulivesearch-search" id="wpulivesearch" type="text" name="search" value="" />';
        $html .= '</div>';
        return $html;
    }

    /* Filters
    -------------------------- */

    public function display_filters($filters = array()) {
        $html = '';
        $html .= apply_filters('wpulivesearch__display_filters__before_html', '');
        foreach ($filters as $key => $value) {
            $html .= $this->display_filter($key, $value);
        }
        $html .= apply_filters('wpulivesearch__display_filters__after_html', '');
        return '<div class="wpulivesearch-filters">' . $html . '</div>';
    }

    public function display_filter($key, $value) {
        $html = '';
        $_label = ucfirst($key);
        if (isset($value['label'])) {
            $_label = esc_attr($value['label']);
        }
        $is_multiple = isset($value['multiple']) && $value['multiple'];
        if (!isset($value['input_type'])) {
            $value['input_type'] = false;
        }

        $value['required'] = isset($value['required']) && $value['required'];

        $default_value = false;
        if (isset($value['values']) && is_array($value['values'])) {
            foreach ($value['values'] as $i => $_value) {
                if (isset($_value['selected']) && $_value['selected']) {
                    $default_value = $i;
                    continue;
                }
            }
        }

        if (!isset($value['compare'])) {
            $value['compare'] = '>';
        }
        if (!isset($value['default_value'])) {
            $value['default_value'] = 0;
        }

        $html .= '<div class="wpulivesearch-filter__item">';
        if ($is_multiple && $value['input_type'] != 'select') {
            $has_value_filter = isset($value['value_filter']) && $value['value_filter'];
            $value_filter_label = $value['value_filter_label'] ?? __('Filter values', 'wpulivesearch');
            $html .= '<div class="wpulivesearch-filter wpulivesearch-filter--multiple" data-multiple="1" data-label="' . esc_attr($_label) . '" data-key="' . $key . '">';
            $html .= '<label class="main-label">' . $_label . '</label>';
            if ($has_value_filter) {
                $html .= '<input type="text" placeholder="' . esc_attr($value_filter_label) . '" name="value_filter" value="" />';
            }
            $html .= '</div>';
        } else {
            switch ($value['input_type']) {
            case 'radio':
                $html .= '<div class="wpulivesearch-filter wpulivesearch-filter--radio" data-multiple="0" data-label="' . esc_attr($_label) . '"';
                if ($value['has_view_all']) {
                    $html .= ' data-view-all-label="' . esc_attr($value['view_all_label']) . '"';
                }
                $html .= ' data-key="' . $key . '">';
                $html .= '<label class="main-label">' . $_label . '</label>';
                $html .= '</div>';
                break;
            case 'number':
                $html .= '<div class="wpulivesearch-filter wpulivesearch-filter--number" data-compare="' . esc_attr($value['compare']) . '" data-initial-value="' . esc_attr($value['default_value']) . '" data-type="number" data-multiple="0" data-label="' . esc_attr($_label) . '"';
                $html .= ' data-key="' . $key . '">';
                $html .= '<label class="main-label">' . $_label . '</label>';
                $html .= '<input type="number" id="wpulivesearch_filter_' . $key . '" name="' . $key . '" data-key="' . $key . '" value="' . esc_attr($value['default_value']) . '" />';
                $html .= '</div>';
                break;
            default:
                $html .= '<label for="wpulivesearch_filter_' . $key . '" class="main-label">' . $_label . '</label>';
                $html .= '<div class="selector"><select data-label="' . esc_attr($_label) . '" ' . ($is_multiple ? 'multiple' : '') . ' ' . ($default_value !== false ? ' data-default="' . esc_attr($default_value) . '"' : '') . ' class="wpulivesearch-filter wpulivesearch-filter--select" id="wpulivesearch_filter_' . $key . '" name="' . $key . '' . ($is_multiple ? '[]' : '') . '" data-key="' . $key . '">';
                $html .= '<option ' . ($value['required'] ? 'disabled="disabled"' : '') . ' value="">' . $_label . '</option>';
                $html .= '</select></div>';
            }

        }
        $html .= '</div>';

        if (isset($value['before_filter_item'])) {
            $html = $value['before_filter_item'] . $html;
        }
        if (isset($value['after_filter_item'])) {
            $html .= $value['after_filter_item'];
        }

        $html = '<div class="wpulivesearch-filter__wrapper" data-key="' . esc_attr($key) . '" data-multiple="' . (isset($value['multiple']) && $value['multiple'] ? '1' : '0') . '">' . $html . '</div>';

        if (isset($value['before_filter_wrapper'])) {
            $html = $value['before_filter_wrapper'] . $html;
        }
        if (isset($value['after_filter_wrapper'])) {
            $html .= $value['after_filter_wrapper'];
        }

        return $html;

    }

    /* Templates
    -------------------------- */

    public function display_templates($templates = array()) {
        if (!is_array($templates)) {
            $templates = array();
        }
        $default_templates = array(
            'default' => array(
                'html' => ''
            ),
            'before_default' => array(
                'html' => ''
            ),
            'after_default' => array(
                'html' => ''
            ),
            'pager_load_more' => array(
                'html' => '<a href="#" data-page="1" data-loadmorebutton="1" class="load-more-button"><span>' . __('Load more', 'wpulivesearch') . '</span></a>',
                'attributes' => array(
                    'data-page="1"',
                    'data-loadmorebutton="1"'
                )
            ),
            'pager_item' => array(
                'html' => '<a href="#" class="{{class_name}}" data-page="{{page_nb}}"><span>{{content}}</span></a>',
                'attributes' => array(
                    'data-page="{{page_nb}}"'
                )
            ),
            'pager_before_items' => array(
                'html' => ''
            ),
            'pager_after_items' => array(
                'html' => ''
            ),
            'noresults' => array(
                'html' => '<div class="wpulivesearch-noresults">' . __('No results for this query, sorry', 'wpulivesearch') . '</div>'
            ),
            'counter' => array(
                'html' => '<div class="wpulivesearch-count"><span class="multiple">' . str_replace('%s', '{{count}}', __('%s results', 'wpulivesearch')) . '</span><span class="simple">' . str_replace('%s', '{{count}}', __('%s result', 'wpulivesearch')) . '</span></div>'
            ),
            'before' => array(
                'html' => '<ul data-livepagenb="{{page_nb}}" class="wpulivesearch-list">',
                'attributes' => array(
                    'data-livepagenb="{{page_nb}}"'
                )
            ),
            'after' => array(
                'html' => '</ul>'
            ),
            'item' => array(
                'html' => '<li class="wpulivesearch-item">{{name}}</li>'
            )
        );

        $html = 'window.wpulivesearch_tpl = {};';
        foreach ($default_templates as $key => $value) {
            $value = isset($templates[$key]) ? $templates[$key] : $value['html'];
            /* Check if templates have their required attributes */
            if (isset($default_templates[$key]['attributes'])) {
                foreach ($default_templates[$key]['attributes'] as $k => $required_attr) {
                    if (strpos($value, $required_attr) === false && preg_match('/^<([a-z]*)/', $value, $matches)) {
                        $value = str_replace($matches[0], $matches[0] . ' ' . $required_attr . ' ', $value);
                    }
                }
            }
            $html .= 'window.wpulivesearch_tpl.' . $key . '=' . wpulivesearch_get_html_as_js_content($value) . ';';
        }

        return '<script>' . $html . '</script>';
    }
}

$WPULiveSearch = new WPULiveSearch();

require_once __DIR__ . '/inc/helpers.php';
