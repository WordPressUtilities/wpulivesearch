/* globals wpulivesearch_datas, wpulivesearch_filters, wpulivesearch_datas_keys, wpulivesearch_settings */

document.addEventListener('wpulivesearch_datas_ready', function() {

    'use strict';

    if (typeof wpulivesearch_datas === 'undefined' || !document.getElementById('wpulivesearch_results')) {
        return;
    }

    /* Clean datas */
    (function() {
        var i, len, ii, len2, _filter, _filter_id, _raw_data;
        for (i = 0, len = wpulivesearch_datas.length; i < len; i++) {

            /* Reimplement keys */
            _raw_data = wpulivesearch_datas[i];
            wpulivesearch_datas[i] = {
                fulltext: {},
                filters: {}
            };

            for (ii = 0, len2 = _raw_data.length; ii < len2; ii++) {
                wpulivesearch_datas[i][wpulivesearch_datas_keys[ii]] = _raw_data[ii];
            }

            /* Clean values */
            wpulivesearch_datas[i] = set_fulltext_values(wpulivesearch_datas[i]);

            for (_filter in wpulivesearch_filters) {
                if (!wpulivesearch_datas[i][_filter]) {
                    console.error('The filter "' + _filter + '" should be defined in this data element.');
                    continue;
                }

                /* Store filters */
                wpulivesearch_datas[i].filters[_filter] = wpulivesearch_datas[i][_filter].toString().split(',');

                /* Replace fulltext filters */
                if (!wpulivesearch_datas[i][_filter] || !wpulivesearch_filters[_filter].fulltext) {
                    continue;
                }
                for (_filter_id in wpulivesearch_filters[_filter].values) {
                    replace_filters_values(_filter_id, wpulivesearch_filters[_filter].values);
                }
            }
        }

        (function() {
            var _existingFilters = [];

            /* Extract values */
            (function() {
                var i, len, filterItem;
                for (i = 0, len = wpulivesearch_datas.length; i < len; i++) {
                    for (filterItem in wpulivesearch_datas[i].filters) {
                        if (!_existingFilters[filterItem]) {
                            _existingFilters[filterItem] = [];
                        }
                        _existingFilters[filterItem] = _existingFilters[filterItem].concat(wpulivesearch_datas[i].filters[filterItem]);
                    }
                }
            }());

            /* Parse filters */
            (function() {
                var _filter, _filterVal;
                for (_filter in wpulivesearch_filters) {
                    for (_filterVal in wpulivesearch_filters[_filter].values) {
                        if (_existingFilters[_filter]) {
                            /* Find if there is at least one item with this filter value */
                            wpulivesearch_filters[_filter].values[_filterVal].hasitems = _existingFilters[_filter].indexOf(wpulivesearch_filters[_filter].values[_filterVal].value.toString()) != -1;
                        }
                    }
                }
            }());
        }());

        /* Add manual fulltext keys */
        function set_fulltext_values(wpulivesearch_datas_item) {
            var _key = '';
            for (var i = 0, len = wpulivesearch_settings.fulltext_keys.length; i < len; i++) {
                _key = wpulivesearch_settings.fulltext_keys[i];
                if (wpulivesearch_datas_item[_key]) {
                    wpulivesearch_datas_item.fulltext[_key] = wpulivesearch_clean_value(wpulivesearch_datas_item[_key]);
                }
            }
            return wpulivesearch_datas_item;
        }

        /* Ensure values are correct in the search arrays */
        function replace_filters_values(_id, _values) {
            var _filter_item = _values[_id];
            var _filter_key = _filter_item.value;
            if (wpulivesearch_datas[i][_filter] == _filter_key) {
                /* Replace value in item */
                wpulivesearch_datas[i][_filter] = _filter_item.label;
                /* Replace value in fulltext */
                wpulivesearch_datas[i].fulltext[_filter] = wpulivesearch_clean_value(_filter_item.label);
            }
        }
    }());

    /* Extract elements */
    var $searchform = document.getElementById('form_wpulivesearch'),
        $searchbox = document.getElementById('wpulivesearch'),
        $filters = document.querySelectorAll('.wpulivesearch-filter'),
        $filters_multiples = document.querySelectorAll('.wpulivesearch-filter-multiple input[type="checkbox"]'),
        $results_container = document.getElementById('wpulivesearch_results');

    /* Build filters */
    (function() {
        var _i = 0;
        for (var i in wpulivesearch_filters) {
            $filters[_i].innerHTML = $filters[_i].innerHTML + wpulivesearch_get_filter_html(i, wpulivesearch_filters[i]);
            _i++;
        }
    }());

    /* GLOBALS */
    var _pause_hash = false;
    var _pause_livesearch = false;
    var _hash_pageNb = false;

    /* Live Search event */
    $searchform.addEventListener('reload_live_search', live_search, 1);

    /* Selectors events */
    for (var i = 0, len = $filters.length; i < len; i++) {
        $filters[i].addEventListener('change', live_search, 1);
    }
    for (var i2 = 0, len2 = $filters_multiples.length; i2 < len2; i2++) {
        $filters_multiples[i2].addEventListener('change', live_search, 1);
    }
    $searchbox.addEventListener('keyup', live_search, 1);
    $searchbox.addEventListener('keydown', function(e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            var _ev = new Event('wpulivesearch_searchbox_enter');
            $searchbox.dispatchEvent(_ev);
            document.dispatchEvent(_ev);
        }
    }, 1);

    /* Reset */
    $searchform.addEventListener('reset', clear_search, 1);
    var initial_form = '1';
    $searchform.setAttribute('data-changed', '0');

    /* Hash change */
    window.addEventListener('hashchange', function() {
        if (_pause_hash) {
            _pause_hash = false;
            return;
        }
        check_hash();
    });

    function check_hash() {
        if (!wpulivesearch_settings.dynamic_url || wpulivesearch_settings.dynamic_url == '0') {
            return;
        }
        var _hash = window.location.hash;
        _hash = _hash.replace('\#', '');
        if (!_hash) {
            return;
        }
        var _hash_parts = _hash.split('/'),
            _hash_filter_tmp;

        _pause_livesearch = true;
        var _pageNb = false;

        /* _hash_parts - i */
        for (var i = 0, len = _hash_parts.length; i < len; i++) {
            _hash_filter_tmp = _hash_parts[i].split(':');
            if (!_hash_filter_tmp[1]) {
                continue;
            }
            if (_hash_filter_tmp[0] == 'page') {
                _pageNb = _hash_filter_tmp[1];
                continue;
            }
            (function() {
                var _id = _hash_filter_tmp[0];
                var _values = _hash_filter_tmp[1].split(',');
                var _tmp_post;
                for (var i = 0, len = _values.length; i < len; i++) {
                    _tmp_post = document.getElementById('filter-' + _id + _values[i]);
                    if (_tmp_post) {
                        _tmp_post.checked = true;
                    }
                }
            }());
        }
        _pause_livesearch = false;
        live_search();

        if (_pageNb !== false) {
            _hash_pageNb = _pageNb - 1;
        }
    }

    /* Check hash when starting */
    check_hash();

    /* Default content */
    update_results_container();

    $results_container.dispatchEvent(new Event('wpulivesearch_results_ready'));

    live_search();

    if (_hash_pageNb) {
        wpulivesearch_set_page(_hash_pageNb);
        update_hash();
        _hash_pageNb = false;
    }

    function clear_search() {
        $searchform.setAttribute('data-changed', '0');
        $results_container.dispatchEvent(new Event('wpulivesearch_clear_search'));
        update_results_container();
        (function($filters) {
            setTimeout(function() {
                var _reset = wpulivesearch_reset_active_filters($filters);
                /* A field has a default value */
                if (_reset || wpulivesearch_settings.load_all_default == '1') {
                    /* Reset the form and trigger live search again */
                    initial_form = '1';
                    $searchform.setAttribute('data-changed', '0');
                    live_search();
                }
                else {
                    history.replaceState(null, null, ' ');
                }
            }, 50);
        }($filters));
    }

    function live_search() {
        if (_pause_livesearch) {
            return;
        }
        /* Clean value */
        var _fulltext_value = wpulivesearch_clean_value($searchbox.value),
            _minimal_numeric_value = parseInt(wpulivesearch_settings.minimal_numeric_value, 10),
            _minimal_fulltext_value = parseInt(wpulivesearch_settings.minimal_fulltext_value, 10);

        var _results = [],
            _isNumericSearch = _fulltext_value.match(/^([0-9]+)$/),
            _hasFullTextValue = (_fulltext_value.length > _minimal_fulltext_value) || (_isNumericSearch && _fulltext_value.length > _minimal_numeric_value),
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

        if (!_hasFilterValue && !_hasFullTextValue && wpulivesearch_settings.load_all_default != '1') {
            clear_search();
            return;
        }

        /* Check each item */
        for (i = 0, len = wpulivesearch_datas.length; i < len; i++) {

            if (wpulivesearch_settings.load_all_default) {
                _results[i] = wpulivesearch_datas[i];
            }

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

            /* Custom hook function  */
            if (typeof wpulivesearch_delete_result == 'function') {
                if (wpulivesearch_delete_result(_results[i], _fulltext_value, wpulivesearch_settings)) {
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

        /* Hook before items loading */
        if (typeof wpulivesearch_get_filled_template__before_items == 'function') {
            wpulivesearch_get_filled_template__before_items(_results);
        }

        /* Sort results */
        if (typeof wpulivesearch_settings.sort_results_callback == "function") {
            _results.sort(wpulivesearch_settings.sort_results_callback);
        }

        /* Build HTML display */
        if (_results.length) {
            _html += wpulivesearch_get_filled_template('before', {
                page_nb: 0
            });
            for (var _result in _results) {
                if (_counter > 0 && _current_count % _per_page === 0) {
                    _nb_pages++;
                    _current_count = 0;
                    _html += wpulivesearch_tpl.after;
                    _html += wpulivesearch_get_filled_template('before', {
                        page_nb: _nb_pages
                    });
                }
                if (typeof wpulivesearch_get_filled_template__before_item == "function") {
                    _html += wpulivesearch_get_filled_template__before_item(_nb_pages, _current_count);
                }
                _html += wpulivesearch_get_filled_template('item', _results[_result]);
                if (typeof wpulivesearch_get_filled_template__after_item == "function") {
                    _html += wpulivesearch_get_filled_template__after_item(_nb_pages, _current_count);
                }
                _counter++;
                _current_count++;
            }
            _html += wpulivesearch_tpl.after;
        }

        /* Hook after items loading */
        if (typeof wpulivesearch_get_filled_template__after_items == 'function') {
            wpulivesearch_get_filled_template__after_items(_results);
        }

        /* Counter */
        if (_counter === 0) {
            _html = wpulivesearch_tpl.noresults;
        }
        else {
            var _counter_html = wpulivesearch_get_filled_template('counter', {
                count: _counter
            });
            if (_counter <= 1) {
                _counter_html = _counter_html.replace(/<span class="multiple">([^<]*)<\/span>/, '');
            }
            else {
                _counter_html = _counter_html.replace(/<span class="simple">([^<]*)<\/span>/, '');
            }
            _html = _counter_html + _html;
        }

        /* Build template */
        if (!_html) {
            _html = wpulivesearch_tpl.default;
        }

        if (initial_form == '1') {
            _html = wpulivesearch_tpl.before_default + _html + wpulivesearch_tpl.after_default;
        }

        update_results_container(_html);

        var event = new Event('wpulivesearch_results');
        event.wpulivesearch = {
            filters: _filtersValues,
            counter: _counter,
            results: _results
        };
        $results_container.dispatchEvent(event);

        var hasFilter = false;
        for (var _filterItem in _filtersValues) {
            if (_filtersValues[_filterItem].value.length > 0) {
                hasFilter = true;
            }
        }
        $searchform.setAttribute('data-hasfilter', hasFilter ? '1' : '0');

        if (initial_form != '1') {
            $searchform.setAttribute('data-changed', '1');
        }
        initial_form = '0';

        /* Set pager */
        if (_nb_pages > 0) {
            /* Create pager */
            wpulivesearch_create_pager($results_container, _nb_pages);
        }

        /* Init lazyload on page 1 */
        wpulivesearch_lazyload_items($results_container, 0);

        /* Set dynamic URL */
        update_hash(_filtersValues);
    }

    function update_results_container(_content) {
        if (!_content) {
            _content = wpulivesearch_tpl.default;
        }
        $results_container.innerHTML = _content;

        /* Trigger an event */
        window.dispatchEvent(new Event('wpulivesearch_updated_content'));
    }

    function update_hash(_filtersValues) {
        if (!wpulivesearch_settings.dynamic_url || wpulivesearch_settings.dynamic_url == '0') {
            return;
        }

        if (!_filtersValues) {
            _filtersValues = wpulivesearch_extract_values_from_filters(document.querySelectorAll('.wpulivesearch-filter'));
        }

        var _hash = '',
            tmp_values;

        /* Pager */
        var currentPageNb = wpulivesearch_get_current_page();
        if (currentPageNb >= 1) {
            _hash = 'page:' + (parseInt(currentPageNb, 10) + 1);
        }

        /* Filters */
        var originalFilter;
        for (var i = 0, len = _filtersValues.length; i < len; i++) {
            if (!_filtersValues[i].value.length) {
                continue;
            }
            originalFilter = wpulivesearch_filters[_filtersValues[i].id];
            if (!originalFilter.enabled_in_url) {
                continue;
            }
            if (_hash) {
                _hash += '/';
            }
            tmp_values = _filtersValues[i].value;
            if (typeof tmp_values != 'string') {
                tmp_values = tmp_values.join(',');
            }
            _hash += _filtersValues[i].id + ':' + tmp_values;
        }
        history.replaceState(null, null, _hash ? '#' + _hash : ' ');
        _pause_hash = true;
    }

    $searchform.addEventListener('update_hash', function() {
        update_hash();
    }, 1);

    document.dispatchEvent(new Event('wpulivesearch_results_loaded'));

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
        ii,
        i,
        tmp_result;
    for (_filter_key in wpulivesearch_filters) {
        active_filters[_filter_key] = [];
    }
    for (i in _results) {
        for (_filter in _results[i].filters) {
            tmp_result = _results[i].filters[_filter];
            tmp_result = typeof tmp_result == 'string' ? tmp_result.trim() : tmp_result;
            if (!tmp_result) {
                continue;
            }
            for (ii = 0, len = tmp_result.length; ii < len; ii++) {
                if (active_filters[_filter].indexOf(tmp_result[ii]) < 0) {
                    active_filters[_filter].push(tmp_result[ii]);
                }
            }
        }
    }
    wpulivesearch_set_active_filters(active_filters, $filters, $filters_multiples);
}

/* Reset
-------------------------- */

function wpulivesearch_reset_active_filters($filters) {
    'use strict';
    var _hasDefault = false;
    for (var i = 0, len = $filters.length; i < len; i++) {
        if ($filters[i].tagName == 'SELECT') {
            if ($filters[i].hasAttribute('data-default')) {
                _hasDefault = true;
            }
            wpulivesearch_set_active_filters__select([], $filters[i], true);
        }
        else {
            wpulivesearch_set_active_filters__multiple([], $filters[i], true);
        }
    }
    return _hasDefault;
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
        var _index = 0;
        /* Default value exists */
        if ($el.hasAttribute('data-default')) {
            /* Selected index is after the placeholder label */
            _index = parseInt($el.getAttribute('data-default'), 10) + 1;
        }
        $el.selectedIndex = _index;
    }
}

function wpulivesearch_set_active_filters__multiple(active_filters, $el, force) {
    'use strict';
    var $opts = $el.querySelectorAll('input[type="checkbox"]'),
        $mainLabel = $el.querySelector('.main-label'),
        _isHiddenValue,
        _itemParent,
        _visibleValues = [],
        _nbEnabled = 0;
    for (var i = 0; i < $opts.length; i++) {
        _itemParent = $opts[i].parentNode;
        _isHiddenValue = force ? 0 : active_filters.indexOf($opts[i].value) < 0 ? 1 : 0;
        $opts[i].setAttribute('data-hidden', _isHiddenValue);
        $el.setAttribute('aria-disabled', _isHiddenValue ? 'true' : 'false');
        if (wpulivesearch_settings.inclusive_search) {
            _itemParent.setAttribute('data-disabled', _isHiddenValue);
        }
        if ($opts[i].checked) {
            _nbEnabled++;
            if (wpulivesearch_settings.view_selected_multiple_values) {
                _visibleValues.push(_itemParent.querySelector('label').innerHTML);
            }
        }
    }
    var _beforeLabel = wpulivesearch_settings.view_selected__before;
    var _afterLabel = wpulivesearch_settings.view_selected__after;
    var _displayLabel = (_nbEnabled > 0 ? _beforeLabel + _nbEnabled + _afterLabel : '');
    if (wpulivesearch_settings.view_selected_multiple_values && _nbEnabled) {
        _displayLabel = _beforeLabel + _visibleValues.join(',') + _afterLabel;
    }
    $mainLabel.innerHTML = $el.getAttribute('data-label') + ' ' + _displayLabel;
    $mainLabel.setAttribute('data-enabled', _nbEnabled);

    /* Default label change to radio value if not a multiple filter */
    if (wpulivesearch_settings.view_selected_simple_replace_label && $el.getAttribute('data-multiple') == '0') {
        var _check = $el.querySelectorAll('input[type="radio"]:checked');

        if (_check[0]) {
            $mainLabel.setAttribute('data-enabled', 1);
            $mainLabel.innerHTML = _check[0].parentNode.querySelector('label').innerHTML;
        }
        else {
            $mainLabel.innerHTML = $el.getAttribute('data-label');
        }
    }
}
/* ----------------------------------------------------------
  Pager
---------------------------------------------------------- */

function wpulivesearch_create_pager($wrapper, _nb_pages) {
    'use strict';

    /* Build pager */
    var $pager = document.createElement('DIV'),
        $tmpPager;

    $pager.classList.add('wpulivesearch-pager');
    $pager.setAttribute('data-nbpages', _nb_pages);

    if (wpulivesearch_settings.pager_load_more != '1') {
        wpulivesearch_set_pager_content($pager, 0);
    }
    else {
        $pager.classList.add('wpulivesearch-pager--load-more');
        $pager.innerHTML = wpulivesearch_tpl.pager_load_more;
    }

    $pager.addEventListener('click', wpulivesearch_pager_clickevent, 1);

    $wrapper.appendChild($pager);

    /* Trigger display page 1 */
    wpulivesearch_goto_page(0);

}

function wpulivesearch_set_load_more_content($pager, _current) {
    var $button = $pager.querySelector('[data-loadmorebutton="1"]'),
        _nb_pages = parseInt($pager.getAttribute('data-nbpages'), 10);
    if (!$button) {
        return;
    }
    /* Last page : delete pager */
    if (_current == _nb_pages) {
        $pager.parentNode.removeChild($pager);
        return;
    }
    /* Set next page */
    $button.setAttribute('data-page', _current + 1);
}

function wpulivesearch_set_pager_content($pager, _current) {
    var _tmpHTML = '',
        _nb_pages = parseInt($pager.getAttribute('data-nbpages'), 10),
        _tmpHTMLBefore = '',
        _tmpHTMLAfter = '',
        _nb_start = 0,
        _nb_max = parseInt(wpulivesearch_settings.nb_items_in_pager, 10),
        _nb_end = _nb_pages + 1;

    var _nb_display_before = Math.floor((_nb_max - 1) / 2);
    if (_nb_max <= _nb_pages) {
        _nb_start = Math.max(0, _current - _nb_display_before);
        _nb_end = Math.min(_nb_end, _nb_start + _nb_max);
        if (_nb_start >= 1) {
            _tmpHTMLBefore += wpulivesearch_get_filled_template('pager_item', {
                class_name: 'first',
                page_nb: 0,
                content: '&lt;&lt;'
            });
        }
        if (_current > 0) {
            _tmpHTMLBefore += wpulivesearch_get_filled_template('pager_item', {
                class_name: 'prev',
                page_nb: 'prev',
                content: '&lt;'
            });
        }
        if (_current < _nb_pages) {
            _tmpHTMLAfter += wpulivesearch_get_filled_template('pager_item', {
                class_name: 'next',
                page_nb: 'next',
                content: '&gt;'
            });
        }
        if (_nb_end < _nb_pages + 1) {
            _tmpHTMLAfter += wpulivesearch_get_filled_template('pager_item', {
                class_name: 'last',
                page_nb: _nb_pages,
                content: '&gt;&gt;'
            });
        }
    }

    for (var i = _nb_start; i < _nb_end; i++) {
        /* Create link */
        _tmpHTML += wpulivesearch_get_filled_template('pager_item', {
            class_name: 'item ' + (i === _current ? ' current' : ''),
            page_nb: i,
            content: (i + 1)
        });
    }

    $pager.innerHTML = wpulivesearch_tpl.pager_before_items + _tmpHTMLBefore + _tmpHTML + _tmpHTMLAfter + wpulivesearch_tpl.pager_after_items;
}

/* Events
-------------------------- */

function wpulivesearch_pager_clickevent(e) {
    'use strict';
    var $target = e.target;
    if ($target.tagName == 'SPAN') {
        $target = $target.parentNode;
    }
    else if ($target.tagName != 'A') {
        return;
    }
    e.preventDefault();
    wpulivesearch_pager_clickevent_target($target);
}

function wpulivesearch_pager_clickevent_target($target) {
    if (!$target) {
        $target = document.querySelector('.wpulivesearch-pager--load-more a');
    }
    if (!$target) {
        return;
    }

    wpulivesearch_set_page($target.getAttribute('data-page'), $target.parentNode);
}

function wpulivesearch_get_current_page() {
    var $pages = document.querySelectorAll('[data-livepagenb]');

    /* Extract current pager */
    var currentPageNb = 0;
    (function() {
        for (var i = 0, len = $pages.length; i < len; i++) {
            if ($pages[i].getAttribute('data-current') == '1') {
                currentPageNb = parseInt($pages[i].getAttribute('data-livepagenb'), 10);
            }
        }
    }());

    return currentPageNb;
}

function wpulivesearch_set_page(page_nb, $pager) {
    if (!$pager) {
        $pager = document.querySelector('.wpulivesearch-pager');
    }

    var _nb_pages = parseInt($pager.getAttribute('data-nbpages'), 10);
    if (page_nb == 'next' || page_nb == 'prev') {
        var currentPageNb = wpulivesearch_get_current_page();

        if (page_nb == 'next') {
            page_nb = currentPageNb + 1;
        }
        if (page_nb == 'prev') {
            page_nb = currentPageNb - 1;
        }
        if (page_nb < 0) {
            page_nb = _nb_pages;
        }
        if (page_nb > _nb_pages) {
            page_nb = 0;
        }
    }

    page_nb = parseInt(page_nb, 10);
    if (wpulivesearch_settings.pager_load_more == '1') {
        wpulivesearch_set_load_more_content($pager, page_nb);
    }
    else {
        wpulivesearch_set_pager_content($pager, page_nb);
    }
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

    var $pages = document.querySelectorAll('[data-livepagenb]'),
        $page = document.querySelector('[data-livepagenb="' + page_nb + '"]');

    if (!$page) {
        console.error('The page #' + page_nb + ' has not been found. Maybe check the "before" template ?');
        return;
    }

    for (var i = 0, len = $pages.length; i < len; i++) {
        if (wpulivesearch_settings.pager_load_more == '1' && i < page_nb) {
            $pages[i].style.display = '';
            $pages[i].setAttribute('data-current', '1');
            continue;
        }
        $pages[i].setAttribute('data-current', '0');
        $pages[i].style.display = 'none';
    }

    $page.setAttribute('data-current', '1');
    $page.style.display = '';

    document.getElementById('form_wpulivesearch').dispatchEvent(new Event('update_hash'));

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
            if (_checkList.length) {
                for (i2 = 0, len2 = _checkList.length; i2 < len2; i2++) {
                    if (_checkList[i2].checked) {
                        _tmpValue.push(_checkList[i2].value);
                    }
                }
            }
            else {
                _checkList = $filters[i].querySelectorAll('input[type="radio"]');
                for (i2 = 0, len2 = _checkList.length; i2 < len2; i2++) {
                    if (_checkList[i2].checked) {
                        _tmpValue = _checkList[i2].value;
                    }
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
        filter_intersect,
        filter_value_arr,
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
        filter_intersect = _item.filters[filter_id].filter(function(n) {
            return filter_values.indexOf(n) > -1;
        });

        if (filter_intersect.length < 1) {
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

function wpulivesearch_get_filled_template(_tpl_id, values) {
    'use strict';
    var _tmp_result_html = wpulivesearch_tpl[_tpl_id];
    for (var _value in values) {
        if (!values[_value] && values[_value] !== '0' && values[_value] !== 0) {
            values[_value] = '';
        }
        _tmp_result_html = _tmp_result_html.replace(new RegExp('{{' + _value + '}}', 'g'), values[_value]);
    }
    return _tmp_result_html;
}

/* ----------------------------------------------------------
  Build filter HTML content
---------------------------------------------------------- */

function wpulivesearch_get_filter_html(_key, _value) {
    'use strict';
    var _html = '';
    var is_multiple = (_value.multiple == '1'),
        is_radio = _value.input_type && _value.input_type == 'radio',
        _has_default_checked = true,
        _tmpValue,
        _extra_attr,
        _selected,
        _item_id,
        _val;

    var _initial = [];
    if (typeof _value.selected !== 'undefined') {
        _initial = _value.selected;
    }

    if (is_multiple || is_radio) {
        _html += '<div class="values">';
    }

    /* Add "view all" option */
    if (is_radio && _value.has_view_all && _value.view_all_label) {
        _item_id = 'default-filter-view-all-' + _key;
        /* Check only if no other option is selected */
        for (_val in _value.values) {
            if (!!_value.values[_val].selected || _initial.indexOf(_value.values[_val].value) >= 0) {
                _has_default_checked = false;
            }
        }
        _html += '<div class="viewall"><input id="' + _item_id + '" ' + (_has_default_checked ? 'checked="checked"' : '') + ' type="radio" name="' + _key + '" value="" /><label for="' + _item_id + '">' + _value.view_all_label + '</label></div>';
    }

    /* Parse values */
    for (_val in _value.values) {
        _item_id = 'filter-' + _key + _value.values[_val].value;
        _selected = !!_value.values[_val].selected || _initial.indexOf(_value.values[_val].value) >= 0;
        _extra_attr = _value.values[_val].extra ? ' data-extra="' + encodeURI(_value.values[_val].extra) + '"' : '';
        if (is_multiple) {
            _html += '<div data-hasitems="' + _value.values[_val].hasitems + '" class="value"><input' + _extra_attr + ' id="' + _item_id + '" ' + (_selected ? 'checked="checked"' : '') + ' type="checkbox" name="' + _key + '[]" value="' + _value.values[_val].value + '" /><label for="' + _item_id + '">' + _value.values[_val].label + '</label></div>';
        }
        else {
            if (is_radio) {
                _html += '<div data-hasitems="' + _value.values[_val].hasitems + '" class="value"><input' + _extra_attr + ' id="' + _item_id + '" ' + (_selected ? 'checked="checked"' : '') + ' type="radio" name="' + _key + '" value="' + _value.values[_val].value + '" /><label for="' + _item_id + '">' + _value.values[_val].label + '</label></div>';
            }
            else {
                _html += '<option' + _extra_attr + ' ' + (_selected ? 'selected="selected"' : '') + ' value="' + _value.values[_val].value + '" data-hasitems="' + _value.values[_val].hasitems + '">' + _value.values[_val].label + '</option>';
            }
        }
    }

    if (is_multiple || is_radio) {
        _html += '</div>';
    }

    /* Return full content */
    return _html;
}

/* ----------------------------------------------------------
  Helpers
---------------------------------------------------------- */

function wpulivesearch_clean_value(_val) {
    'use strict';
    _val = _val.toLowerCase().trim();
    _val = wpulivesearch_decode_html(_val);
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
    _val = _val.replace(new RegExp(/([^a-z0-9 ]+)/g), '');
    return _val;
}

function wpulivesearch_decode_html(html) {
    var txt, _val;
    txt = document.createElement("textarea");
    txt.innerHTML = html;
    _val = txt.value;
    txt.remove();
    return _val;
}

function wpulivesearch_async_load(src) {
    'use strict';
    var d = document,
        t = 'script',
        o = d.createElement(t),
        s = d.getElementsByTagName(t)[0];

    o.onload = function() {
        wpulivesearch_trigger_datas_ready();
    };
    o.src = src;
    s.parentNode.insertBefore(o, s);
}

/* ----------------------------------------------------------
  Sort
---------------------------------------------------------- */

function wpulivesearch_sort_results(callback_func) {
    /* Update sort method */
    wpulivesearch_settings.sort_results_callback = callback_func;
    /* Trigger reload */
    document.getElementById('form_wpulivesearch').dispatchEvent(new Event('reload_live_search'));
}

/* ----------------------------------------------------------
  Trigger
---------------------------------------------------------- */

function wpulivesearch_trigger_datas_ready() {
    document.dispatchEvent(new Event('wpulivesearch_datas_ready'));
}
