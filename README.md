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

/* Add filters */
$filters = array(
    /* Taxonomy : Text value will be used for fulltext search */
    'job' => array(
        'taxonomy' => 'job',
        'fulltext' => 1
    ),
    /* Taxonomy : Exact match will be required */
    'category' => array(
        'taxonomy' => 'category'
    ),
    /* Taxonomy : Same as previous, but with radio buttons */
    'category' => array(
        'input_type' => 'radio',
        'taxonomy' => 'category'
    ),
    /* Custom values */
    'week' => array(
        'multiple' => 1,
        'values' => array(
            array(
                'label' => 'My value',
                'value' => 'value'
            ),
            array(
                'label' => 'My other value',
                'value' => 'other-value'
            )
        )
    ),
    /* Radio with view all button */
    'month' => array(
        'input_type' => 'radio',
        'view_all_label' => 'View all',
        'has_view_all' => true,
        'enabled_in_url' => false,
        'values' => array(
            array(
                'label' => 'My value',
                'value' => 'value'
            ),
            array(
                'label' => 'My other value',
                'value' => 'other-value'
            )
        )
    )
);

/* Overrides some templates */
$templates = array(
    'before' => '<ul data-livepagenb="{{page_nb}}" class="my-custom-results">',
    'after' => '</ul>'
);

/* Display Form */
do_action('wpulivesearch_form', $datas, $filters, $templates);

```

## How to : Custom settings

```php
add_filter('wpulivesearch_settings', 'testtest_wpulivesearch_settings', 10, 1);
function testtest_wpulivesearch_settings($settings = array()) {
    /* Load all results by default */
    $settings['load_all_default'] = false;
    /* Fulltext and filters and linked */
    $settings['fulltext_and_filters'] = true;
    /* Load datas in a separate JS file : better performances if page is cached */
    $settings['load_datas_in_file'] = false;
    /* Use a load more button instead of a classic pager */
    $settings['pager_load_more'] = false;
    /* Paginate results */
    $settings['results_per_page'] = 999;
    /* Max number of page numbers visible at once in the pager */
    $settings['nb_items_in_pager'] = 9;
    /* Fulltext is not used if there is less characters than in this value */
    $settings['minimal_fulltext_value'] = 1;
    /* Fulltext is not used if there is less characters than in this value and search query is numbers-only */
    $settings['minimal_numeric_value'] = 1;
    /* Dynamic URL sets filter status in URL, allowing to go directly to a filtered view */
    $settings['dynamic_url'] = false;
    /* Inclusive search hide all filters values non relevant to the search */
    $settings['inclusive_search'] = false;
    /* Display selected values in multiple selectors label */
    $settings['view_selected_multiple_values'] = false;
    /* Hide all values (number of results or values) displayed in a main label */
    $settings['view_selected_hide_values_label'] = false;
    /* Display only value in simple selectors label */
    $settings['view_selected_simple_replace_label'] = false;
    return $settings;
}
```

## How to : show hidden filters (filters values non relevant) to the search

```css
.wpulivesearch-filter--multiple .value[data-hidden="1"] {
    opacity: 0.60;
}
```

## How to : sort results after a button change

```js
/* Sort by numerical value */
wpulivesearch_sort_results(function(a, b) {
    return a.id - b.id;
});
/* Sort by alphabetical value */
wpulivesearch_sort_results(function(a, b) {
    return a.name.localeCompare(b.name);
});
```

## TODO

* Moar filters & hooks.
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
