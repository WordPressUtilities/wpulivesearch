/* globals jQuery, wpulivesearch_datas, wpulivesearch_filters, wpulivesearch_settings */

jQuery(document).on('wpulivesearch_datas_ready', function() {

    'use strict';

    if (typeof wpulivesearch_datas === 'undefined') {
        return;
    }

    /* Clean datas */
    (function() {
        var i, len, ii, len2, _filter, _filter_id, _raw_data;
        for (i = 0, len = wpulivesearch_datas.length; i < len; i++) {

            /* Reimplement keys */
            _raw_data = wpulivesearch_datas[i];
            wpulivesearch_datas[i] = {};

            for (ii = 0, len2 = _raw_data.length; ii < len; ii++) {
                wpulivesearch_datas[i][wpulivesearch_datas_keys[ii]] = _raw_data[ii];
            }

            /* Load */
            wpulivesearch_datas[i].fulltext = {};
            wpulivesearch_datas[i].filters = {};

            /* Clean values */
            wpulivesearch_datas[i].fulltext.name = wpulivesearch_clean_value(wpulivesearch_datas[i].name);

            for (_filter in wpulivesearch_filters) {

                /* Store filters */
                wpulivesearch_datas[i].filters[_filter] = wpulivesearch_datas[i][_filter];

                /* Replace fulltext filters */
                if (!wpulivesearch_datas[i][_filter] || !wpulivesearch_filters[_filter].fulltext) {
                    continue;
                }
                for (_filter_id in wpulivesearch_filters[_filter].values) {
                    if (wpulivesearch_datas[i][_filter] == _filter_id) {
                        /* Replace value in item */
                        wpulivesearch_datas[i][_filter] = wpulivesearch_filters[_filter].values[_filter_id];
                        /* Replace value in fulltext */
                        wpulivesearch_datas[i].fulltext[_filter] = wpulivesearch_clean_value(wpulivesearch_filters[_filter].values[_filter_id]);
                    }
                }
            }
        }
    }());

    /* Extract elements */
    var $searchform = document.getElementById('form_wpulivesearch'),
        $searchbox = document.getElementById('wpulivesearch'),
        $filters = document.querySelectorAll('.wpulivesearch-filter'),
        $results_container = document.getElementById('wpulivesearch_results');

    /* Templates */
    var template__item = document.getElementById('wpulivesearch_results_item').innerHTML,
        template__counter = document.getElementById('wpulivesearch_results_counter').innerHTML,
        template__noresults = document.getElementById('wpulivesearch_results_noresults').innerHTML,
        template__before = document.getElementById('wpulivesearch_results_before').innerHTML,
        template__after = document.getElementById('wpulivesearch_results_after').innerHTML;

    /* Live Search event */
    $searchbox.addEventListener('keyup', live_search, 1);
    /* Selectors events */
    for (var i = 0, len = $filters.length; i < len; i++) {
        $filters[i].addEventListener('change', live_search, 1);
    }
    $searchbox.addEventListener('keyup', live_search, 1);

    /* Reset */
    $searchform.addEventListener('reset', clear_search, 1);

    function clear_search() {
        $results_container.innerHTML = '';
    }

    function live_search() {
        /* Clean value */
        var _fulltext_value = wpulivesearch_clean_value($searchbox.value),
            _minimal_fulltext_value = parseInt(wpulivesearch_settings.minimal_fulltext_value, 10);

        var _results = [],
            _hasFullTextValue = _fulltext_value.length > _minimal_fulltext_value,
            _hasFilterValue = false,
            _filtersValues = [],
            _hasFullText,
            _hasFilters;

        /* Extract filters values */
        for (i = 0, len = $filters.length; i < len; i++) {
            _filtersValues[i] = {
                value: $filters[i].options[$filters[i].selectedIndex].value,
                id: $filters[i].id
            };
            if (_filtersValues[i].value && _filtersValues[i].value != '') {
                _hasFilterValue = true;
            }
        }

        if (!_hasFilterValue && !_hasFullTextValue) {
            clear_search();
            return;
        }

        /* Check each item */
        for (var i = 0, len = wpulivesearch_datas.length; i < len; i++) {

            /* Full text search */
            _hasFullText = false;
            if (_hasFullTextValue && wpulivesearch_fulltext_search(_fulltext_value, wpulivesearch_datas[i])) {
                _results[i] = wpulivesearch_datas[i];
                _hasFullText = true;
            }

            /* Variable search */
            _hasFilters = false;
            if (wpulivesearch_filters_search(_filtersValues, wpulivesearch_datas[i])) {
                _results[i] = wpulivesearch_datas[i];
                _hasFilters = true;
            }

            if (wpulivesearch_settings.fulltext_and_filters && typeof _results[i] !== 'undefined') {

                /* Filters are filled but an invalid text is set */
                if (_hasFilters && _hasFullTextValue && !_hasFullText) {
                    delete _results[i];
                    continue;
                }

                /* Filters are not ok */
                if (!_hasFilters) {
                    delete _results[i];
                    continue;
                }
            }
        }

        /* Build response */
        var _html = '',
            _counter = 0;

        var _per_page = wpulivesearch_settings.results_per_page,
            _nb_pages = 0,
            _current_count = 0;

        if (_results.length) {
            _html += wpulivesearch_get_filled_template(template__before, {
                page_nb: 0
            });
            for (var _result in _results) {
                if (_counter > 0 && _current_count % _per_page === 0) {
                    _nb_pages++;
                    _current_count = 0;
                    _html += template__after;
                    _html += wpulivesearch_get_filled_template(template__before, {
                        page_nb: _nb_pages
                    });
                }
                _html += wpulivesearch_get_filled_template(template__item, _results[_result]);
                _counter++;
                _current_count++;
            }
            _html += template__after;
        }

        var _counter_html = wpulivesearch_get_filled_template(template__counter, {
            count: _counter
        });

        _html = _counter_html + _html;

        if (_counter === 0) {
            _html = template__noresults;
        }

        /* Build template */
        $results_container.innerHTML = _html;

        /* Set pager */
        if (_nb_pages > 0) {

            wpulivesearch_create_pager($results_container, _nb_pages);

            /* Create pages */
            wpulivesearch_lazyload_items($results_container, 0);

            /* Set page 1 */
        }
        else {
            /* Trigger lazyload on page 0 */
            wpulivesearch_lazyload_items($results_container, 0);
        }
    }
});

/* ----------------------------------------------------------
  Pager
---------------------------------------------------------- */

function wpulivesearch_create_pager($wrapper, _nb_pages) {
    'use strict';

    /* Build pager */
    var $pager = document.createElement('DIV'),
        $tmpPager;

    $pager.classList.add('wpulivesearch-pager');

    for (var i = 0; i <= _nb_pages; i++) {
        /* Create link */
        $tmpPager = document.createElement('A');
        $tmpPager.innerHTML = (i + 1);
        if (i === 0) {
            $tmpPager.classList.add('current');
        }
        $tmpPager.setAttribute('href', '#');
        $tmpPager.setAttribute('data-page', i);

        /* Set click event to item */
        $tmpPager.addEventListener('click', wpulivesearch_pager_clickevent, 1);

        /* Add pager item */
        $pager.appendChild($tmpPager);
    }

    $wrapper.appendChild($pager);

    /* Trigger lazyload */
    wpulivesearch_goto_page(0);

}

/* Events
-------------------------- */

function wpulivesearch_pager_clickevent(e) {
    e.preventDefault();
    wpulivesearch_set_pager_current(this);
    wpulivesearch_goto_page(this.getAttribute('data-page'));
}

function wpulivesearch_set_pager_current($item, page_nb) {
    'use strict';

    var $parent = $item.parentNode,
        $pages = $parent.children;

    /* Set current pager */
    for (var i = 0, len = $pages.length; i < len; i++) {
        if (i == page_nb) {
            $pages[i].classList.add('current');
        }
        else {
            $pages[i].classList.remove('current');
        }
    }
}

function wpulivesearch_goto_page(page_nb) {
    'use strict';

    var $page = document.querySelector('[data-livepagenb="' + page_nb + '"]'),
        $pages = document.querySelectorAll('[data-livepagenb]');

    for (var i = 0, len = $pages.length; i < len; i++) {
        $pages[i].style.display = 'none';
    }

    $page.setAttribute('style', '');

    wpulivesearch_lazyload_items($page.parentNode, page_nb);
}

/* Lazyload
-------------------------- */

function wpulivesearch_lazyload_item($item) {
    'use strict';

    if ($item.getAttribute('data-src')) {
        $item.setAttribute('src', $item.getAttribute('data-src'));
        $item.removeAttribute('data-src');
    }
    if ($item.getAttribute('data-bgsrc')) {
        $item.style.backgroundImage = 'url(' + $item.getAttribute('data-bgsrc') + ')';
        $item.removeAttribute('data-bgsrc');
    }
}

function wpulivesearch_lazyload_items($wrapper, page_nb) {
    'use strict';

    var $lazyLoadItems = $wrapper.querySelectorAll('[data-livepagenb="' + page_nb + '"] [data-src]');

    /* Load each item */
    for (var i = 0, len = $lazyLoadItems.length; i < len; i++) {
        wpulivesearch_lazyload_item($lazyLoadItems[i]);
    }
}

/* ----------------------------------------------------------
  Search methods
---------------------------------------------------------- */

/* Search fulltext */
function wpulivesearch_fulltext_search(_val, _item) {
    'use strict';
    for (var _key in _item.fulltext) {
        if (_item.fulltext[_key].indexOf(_val) > -1) {
            return true;
        }
    }
    return false;
}

/* Search filters */
function wpulivesearch_filters_search(_filtersValues, _item) {
    'use strict';
    var has_filter,
        tmp_value,
        tmp_key,
        i,
        len;

    /* Extract filter values */
    for (i = 0, len = _filtersValues.length; i < len; i++) {
        tmp_value = _filtersValues[i].value;
        if (!tmp_value || tmp_value == '') {
            continue;
        }
        tmp_key = _filtersValues[i].id;

        /* Item dont have the key : invalid / false */
        if (!_item.filters.hasOwnProperty(tmp_key)) {
            return false;
        }

        /* Value is different */
        if (tmp_value != _item.filters[tmp_key]) {
            return false;
        }

        has_filter = true;
    }

    /* No filter was used : treat value as ok */
    if (typeof has_filter !== 'boolean') {
        has_filter = true;
    }

    return has_filter;
}

/* ----------------------------------------------------------
  Templating
---------------------------------------------------------- */

function wpulivesearch_get_filled_template(tpl, values) {
    'use strict';
    var _tmp_result_html = tpl;
    for (var _value in values) {
        _tmp_result_html = _tmp_result_html.replace('{{' + _value + '}}', values[_value]);
    }
    return _tmp_result_html;
}

/* ----------------------------------------------------------
  Helpers
---------------------------------------------------------- */

function wpulivesearch_clean_value(_val) {
    'use strict';
    _val = _val.toLowerCase().trim();
    _val = _val.replace(new RegExp(/[àáâãäå]/g), "a");
    _val = _val.replace(new RegExp(/æ/g), "ae");
    _val = _val.replace(new RegExp(/ç/g), "c");
    _val = _val.replace(new RegExp(/[èéêë]/g), "e");
    _val = _val.replace(new RegExp(/[ìíîï]/g), "i");
    _val = _val.replace(new RegExp(/ñ/g), "n");
    _val = _val.replace(new RegExp(/[òóôõö]/g), "o");
    _val = _val.replace(new RegExp(/œ/g), "oe");
    _val = _val.replace(new RegExp(/[ùúûü]/g), "u");
    _val = _val.replace(new RegExp(/[ýÿ]/g), "y");
    return _val;
}

function wpulivesearch_async_load(src) {
    var d = document,
        t = 'script',
        o = d.createElement(t),
        s = d.getElementsByTagName(t)[0];

    o.onload = function() {
        jQuery(document).trigger('wpulivesearch_datas_ready');
    };
    o.src = src;
    s.parentNode.insertBefore(o, s);
}
