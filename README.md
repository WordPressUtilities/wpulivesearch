# WPU Live Search

* Live Search datas

## Exemple : Search in a user list

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
    'after' => '</ul>',
);

/* Display Form */
do_action('wpulivesearch_form', $datas, $filters, $templates);
```

## TODO

* Disable filters option values without results.
* Multiple filters : display active values or number of selection in label.
* Don't show all results if filters & search have default values.
* Compress field name for filters.
* Relevance counter ( fulltext : full words ? )
* Relevance counter ( number of selectors )
* Sort results
* Moar filters & hooks.
* Add autoupdater.
* Add admin settings.
* Add default content for wrapper.
* Inclusive or exclusive filters ( filter1 && filter2 / filter1 || filter 2)
* Handle case where an item has multiple values for a key ( product_color: red&blue ).
