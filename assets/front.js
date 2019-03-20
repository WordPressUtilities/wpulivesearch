/* globals jQuery, wpulivesearch_datas, wpulivesearch_filters */

jQuery(document).ready(function() {

    'use strict';

    /* Clean datas */
    (function() {
        var i, len, _filter, _filter_id;
        for (i = 0, len = wpulivesearch_datas.length; i < len; i++) {
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
    $searchform.addEventListener('reset', function(e) {
        $results_container.innerHTML = '';
    }, 1);

    function live_search(e) {
        /* Clean value */
        var _fulltext_value = wpulivesearch_clean_value($searchbox.value),
            _minimal_fulltext_value = parseInt(wpulivesearch_settings.minimal_fulltext_value, 10);

        /* Check each item */
        var _results = [],
            _hasFullTextValue = false,
            _hasFullText,
            _hasFilters;

        _hasFullTextValue = _fulltext_value.length > _minimal_fulltext_value;

        for (var i = 0, len = wpulivesearch_datas.length; i < len; i++) {

            /* Full text search */
            _hasFullText = false;
            if (_hasFullTextValue && wpulivesearch_fulltext_search(_fulltext_value, wpulivesearch_datas[i])) {
                _results[i] = wpulivesearch_datas[i];
                _hasFullText = true;
            }

            /* Variable search */
            _hasFilters = false;
            if (wpulivesearch_filters_search($filters, wpulivesearch_datas[i])) {
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
        for (var _result in _results) {
            _counter++;
            _html += wpulivesearch_get_filled_template(template__item, _results[_result]);
        }

        var _counter_html = wpulivesearch_get_filled_template(template__counter, {
            count: _counter
        });

        _html = _counter_html + template__before + _html + template__after;

        if (_counter == 0) {
            _html = template__noresults;
        }

        /* Build template */
        $results_container.innerHTML = _html;
    }
});

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
function wpulivesearch_filters_search($filters, _item) {
    'use strict';
    var has_filter,
        tmp_value,
        tmp_key,
        i,
        len;

    /* Extract filter values */

    for (i = 0, len = $filters.length; i < len; i++) {
        tmp_value = $filters[i].options[$filters[i].selectedIndex].value;
        if (!tmp_value || tmp_value == '') {
            continue;
        }
        tmp_key = $filters[i].id;

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
