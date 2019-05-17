# WPU Live Search

* Live Search datas

## Example : Search in a user list

```php
<?php

/* Build Datas */
$datas = get_users(array(
    'number' => -1,
    'fields' => array('ID', 'display_name')
));

/* Setup values */
foreach ($datas as &$var) {
    $var->name = $var->display_name;
}

/* Add taxonomies filters */
$filters = array(
    'job' => array(
        'taxonomy' => 'job',
        /* Text value will be used for fulltext search */
        'fulltext' => 1
    ),
    /* Exact match will be required */
    'category' => array(
        'taxonomy' => 'category'
    )
);

/* Overrides some templates */
$templates = array(
    'before' => '<ul class="my-custom-results">',
    'after' => '</ul>'
);

/* Display Form */
do_action('wpulivesearch_form', $datas, $filters, $templates);

```

## How to : Custom settings

```php
add_filter('wpulivesearch_settings', 'testtest_wpulivesearch_settings', 10, 1);
function testtest_wpulivesearch_settings($settings = array()) {
    /* Fulltext and filters and linked */
    $settings['fulltext_and_filters'] = true;
    /* Load datas in a separate JS file : better performances if page is cached */
    $settings['load_datas_in_file'] = false;
    /* Paginate results */
    $settings['results_per_page'] = 999;
    /* Max number of page numbers visible at once in pager */
    $settings['nb_items_in_pager'] = 9;
    /* Fulltext is not used if there is less characters than this value */
    $settings['minimal_fulltext_value'] = 1;
    /* Inclusive search hide all filters values non relevant to the search */
    $settings['inclusive_search'] = false;
    /* Display selected values in multiple selectors label */
    $settings['view_selected_multiple_values'] = false;
    return $settings;
}
```

## How to : show hidden filters (filters values non relevant) to the search

```css
.wpulivesearch-filter--multiple .value[data-hidden="1"] {
    opacity: 0.60;
}
```

## TODO

* Moar filters & hooks.
* Add autoupdater.
* Add admin settings.
* Pager : config for display (text, classname)
* Handle multiple livesearch on the same page.

### Results

* Don't show all results if filters & search have default values.
* Handle case where an item has multiple values for a key ( product_color: red&blue ).
* Relevance counter ( fulltext : full words ? ).
* Relevance counter ( number of selectors ).
* Sort results.

#### Fulltext relevance :

- 10 points : name contains string.
- 5 points : filter name contains string.

#### Filters relevance

- 2 points : filter is active.

### Filters

* Compress field name for filters.
* Inclusive or exclusive filters ( filter1 && filter2 / filter1 || filter 2).
* Keep filter value in URL.
* Initial values from URL.
