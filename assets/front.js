/* globals jQuery, wpulivesearch_datas, wpulivesearch_filters, wpulivesearch_datas_keys, wpulivesearch_settings */

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
        $filters_multiples = document.querySelectorAll('.wpulivesearch-filter-multiple input[type="checkbox"]'),
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
    for (var i2 = 0, len2 = $filters_multiples.length; i2 < len2; i2++) {
        $filters_multiples[i2].addEventListener('change', live_search, 1);
    }
    $searchbox.addEventListener('keyup', live_search, 1);

    /* Reset */
    $searchform.addEventListener('reset', clear_search, 1);

    function clear_search() {
        $results_container.innerHTML = '';
        (function($filters) {
            setTimeout(function() {
                wpulivesearch_reset_active_filters($filters);
            }, 100);
        }($filters));
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
            _hasFilters,
            i,
            len;

        /* Extract filter values */
        _filtersValues = wpulivesearch_extract_values_from_filters($filters);

        /* _filtersValues - i */
        for (i = 0, len = _filtersValues.length; i < len; i++) {
            if (_filtersValues[i].value && _filtersValues[i].value.length > 0) {
                _hasFilterValue = true;
            }
        }

        if (!_hasFilterValue && !_hasFullTextValue) {
            clear_search();
            return;
        }

        /* Check each item */
        for (i = 0, len = wpulivesearch_datas.length; i < len; i++) {

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

        /* Extract filters available in results */
        wpulivesearch_extract_active_filters(_results, $filters, $filters_multiples);

        /* Build HTML display */
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
            /* Create pager */
            wpulivesearch_create_pager($results_container, _nb_pages);
        }

        /* Init lazyload on page 1 */
        wpulivesearch_lazyload_items($results_container, 0);
    }
});

/* ----------------------------------------------------------
  Active filters
---------------------------------------------------------- */

/* Sort
-------------------------- */

function wpulivesearch_extract_active_filters(_results, $filters, $filters_multiples) {
    var active_filters = {},
        _filter,
        _filter_key,
        i,
        tmp_result;
    for (_filter_key in wpulivesearch_filters) {
        active_filters[_filter_key] = [];
    }

    for (i in _results) {
        for (_filter in _results[i].filters) {
            tmp_result = _results[i].filters[_filter].trim();
            if (!tmp_result) {
                continue;
            }
            if (active_filters[_filter].indexOf(tmp_result) < 0) {
                active_filters[_filter].push(tmp_result);
            }
        }
    }
    wpulivesearch_set_active_filters(active_filters, $filters, $filters_multiples);
}

/* Reset
-------------------------- */

function wpulivesearch_reset_active_filters($filters) {
    'use strict';
    for (var i = 0, len = $filters.length; i < len; i++) {
        if ($filters[i].tagName == 'SELECT') {
            wpulivesearch_set_active_filters__select([], $filters[i], true);
        }
        else {
            wpulivesearch_set_active_filters__multiple([], $filters[i], true);
        }
    }
}

/* Parse
-------------------------- */

function wpulivesearch_set_active_filters(active_filters, $filters) {
    'use strict';
    var _active_filter = false;
    for (var i = 0, len = $filters.length; i < len; i++) {
        _active_filter = active_filters[$filters[i].getAttribute('data-key')];
        if (typeof _active_filter == 'undefined') {
            continue;
        }
        if ($filters[i].tagName == 'SELECT') {
            wpulivesearch_set_active_filters__select(_active_filter, $filters[i], false);
        }
        else {
            wpulivesearch_set_active_filters__multiple(_active_filter, $filters[i], false);
        }
    }
}

function wpulivesearch_set_active_filters__select(active_filters, $el, force) {
    'use strict';
    var op = $el.getElementsByTagName("option");
    for (var i = 0; i < op.length; i++) {
        if (wpulivesearch_settings.inclusive_search) {
            op[i].disabled = force ? false : active_filters.indexOf(op[i].value) < 0;
        }
    }
    if (force) {
        $el.selectedIndex = 0;
    }
}

function wpulivesearch_set_active_filters__multiple(active_filters, $el, force) {
    'use strict';
    var $opts = $el.getElementsByTagName("input"),
        _isHiddenValue,
        _nbEnabled = 0;
    for (var i = 0; i < $opts.length; i++) {
        _isHiddenValue = force ? 0 : active_filters.indexOf($opts[i].value) < 0 ? 1 : 0;
        $opts[i].parentNode.setAttribute('data-hidden', _isHiddenValue);
        if (wpulivesearch_settings.inclusive_search) {
            $opts[i].parentNode.setAttribute('data-disabled', _isHiddenValue);
        }
        if ($opts[i].checked) {
            _nbEnabled++;
        }
    }
    $el.querySelector('.main-label').innerHTML = $el.getAttribute('data-label') + (_nbEnabled > 0 ? ' (' + _nbEnabled + ')' : '');
}

/* ----------------------------------------------------------
  Pager
---------------------------------------------------------- */

function wpulivesearch_create_pager($wrapper, _nb_pages) {
    'use strict';

    /* Build pager */
    var $pager = document.createElement('DIV'),
        _tmpHTML = '',
        $tmpPager;

    $pager.classList.add('wpulivesearch-pager');

    for (var i = 0; i <= _nb_pages; i++) {
        /* Create link */
        _tmpHTML += '<a href="#" data-page="' + i + '" ' + (i === 0 ? 'class="current"' : '') + '>' + (i + 1) + '</a>';
    }

    $pager.innerHTML = _tmpHTML;

    $pager.addEventListener('click', wpulivesearch_pager_clickevent, 1);

    $wrapper.appendChild($pager);

    /* Trigger display page 1 */
    wpulivesearch_goto_page(0);

}

/* Events
-------------------------- */

function wpulivesearch_pager_clickevent(e) {
    'use strict';
    if(e.target.tagName != 'A'){
        return;
    }
    e.preventDefault();
    var page_nb = e.target.getAttribute('data-page');
    wpulivesearch_set_pager_current(e.target, page_nb);
    wpulivesearch_goto_page(page_nb);
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

    var $page = $wrapper.querySelector('[data-livepagenb="' + page_nb + '"]'),
        $lazyLoadItems = $page ? $page.querySelectorAll('[data-bgsrc],[data-src]') : [];

    /* Load each item */
    for (var i = 0, len = $lazyLoadItems.length; i < len; i++) {
        wpulivesearch_lazyload_item($lazyLoadItems[i]);
    }
}

/* ----------------------------------------------------------
  Extract values
---------------------------------------------------------- */

function wpulivesearch_extract_values_from_filters($filters) {
    'use strict';
    var i2, len2, _tmpValue, _checkList;

    var _filtersValues = [];

    for (var i = 0, len = $filters.length; i < len; i++) {
        _tmpValue = [];
        if ($filters[i].tagName == 'SELECT') {
            if ($filters[i].options[$filters[i].selectedIndex].value) {
                _tmpValue = [$filters[i].options[$filters[i].selectedIndex].value];
            }
        }
        else {
            _checkList = $filters[i].querySelectorAll('input[type="checkbox"]');
            for (i2 = 0, len2 = _checkList.length; i2 < len2; i2++) {
                if (_checkList[i2].checked) {
                    _tmpValue.push(_checkList[i2].value);
                }
            }
        }

        _filtersValues[i] = {
            value: _tmpValue,
            id: $filters[i].getAttribute('data-key')
        };

    }

    return _filtersValues;
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
        filter_values,
        filter_id,
        i,
        len;

    /* Extract filter values */
    for (i = 0, len = _filtersValues.length; i < len; i++) {
        filter_values = _filtersValues[i].value;
        if (!filter_values || filter_values.length < 1) {
            continue;
        }
        filter_id = _filtersValues[i].id;

        /* Item dont have the key : invalid / false */
        if (!_item.filters.hasOwnProperty(filter_id)) {
            return false;
        }

        /* Item value is not in the filter values */
        if (filter_values.indexOf(_item.filters[filter_id]) < 0) {
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

function wpulivesearch_get_filled_template(_tmp_result_html, values) {
    'use strict';
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
    'use strict';
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
