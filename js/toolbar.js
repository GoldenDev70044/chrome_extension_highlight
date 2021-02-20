; (function () {
  var highlightsArr = [];
  var highlightedDomElem = null;
  var tabUrl = '';
  var selectedRange = null;
  var isShowedUpdateToolbar = false;
  var options = {
    element: 'span',
    className: 'readermode-highlight',
    exclude: ['script', 'style', 'img', '#readermode_highlight', '#sidebar-sponsors-platinum-right', '#ad'],
    acrossElements: true,
    caseSensitive: true,
    separateWordSearch: false,
    accuracy: 'partially',
    diacritics: false,
    iframes: false,
    iframesTimeout: 5000,
    each: function (node, range) {
      node.title = range.comment;
      node.className = node.className + ` ${range.color}`;
      node.dataset.highlightId = range.id;
      node.onclick = function (e) {
        console.log(e);
        showUpdateToolbar(e, range.comment, range.color);
        highlightedDomElem = node;
      };

      // node is the marked DOM element
      // range is the corresponding range
    },
    filter: function (textNode, range, term, counter) {

      // textNode is the text node which contains the found term
      // range is the found range
      // term is the extracted term from the matching range
      // counter is a counter indicating the number of marks for the found term
      return true; // must return either true or false
    },
    noMatch: function (range) {
      // the not found range
    },
    done: function (counter) {

      // counter is a counter indicating the total number of all marks
    },
    debug: false,
    log: window.console
  };

  $(document).ready(function () {
    init();
  });

  $(document)
    .on('click', function (e) {
      e.stopPropagation();
      var readermodeHighlight = document.getElementById('readermode_highlight');

      if ($.contains(readermodeHighlight, e.target)) {
        return;
      }

      toggleToolbar(e);
      hideUpdateToolbar(e);
      $('#readermode_color_list').hide();
    })
    .on('dblclick', function (e) {
      e.stopPropagation();

      var readermodeHighlight = document.getElementById('readermode_highlight');

      if ($.contains(readermodeHighlight, e.target)) {
        return;
      }

      toggleToolbar(e);
      hideUpdateToolbar(e);
      $('#readermode_color_list').hide();
    });

  $(document).on('click', '#readermode_apply_highlight', function (e) {
    applyHighlight(e);
  });

  $(document).on('click', '#readermode_update_highlight', function (e) {
    updateHighlight(e);
  });

  $(document).on('click', '#readermode_clear_all', function (e) {
    removeAllHighlights(e);
  });

  $(document).on('click', '#readermode_clear', function (e) {
    removeSelectedHighlight(e);
  });

  $(document).on('click', '#readermode_selected_color', function (e) {
    toggleColorList();
  });

  $(document).on('click', '#readermode_color_list .readermode-color', function (e) {
    selectColor(e);
  });


  function init() {
    console.log('toolbar.js loaded');

    fetch(chrome.extension.getURL('/toolbar.html'))
      .then((response) => response.text())
      .then((data) => {
        // Initialize highlight
        $('body').prepend(data);
      })
      .then(() => {
        // Load saved highlights
        var url = window.location.search;
        var urlParams = new URLSearchParams(url);
        if (
          url.includes('chrome-extension://') == true &&
          urlParams.has('post') == true
        ) {
          tabUrl = urlParams.get('file');
        } else {
          tabUrl = window.location.href.toString();
        }

        loadHighlights();
      })
      .catch((err) => {
        // alert("Ops..something wrong, please try again: " + err)
      });
  }

  function toggleToolbar(e) {
    var isClickedCommentForm = e.target.id === 'readermode_comment';
    var isClickedHighlight = !!$(e.target).data('markjs');

    var selection = document.getSelection();
    var toolbar = document.getElementById('readermode_toolbar');

    if (
      selection.type.toLowerCase() === 'range' &&
      !isClickedHighlight &&
      !isShowedUpdateToolbar
    ) {

      selectedRange = selection.getRangeAt(0);

      // Move comment form to toolbar
      var commentForm = $('#readermode_comment_form');
      commentForm.show();
      commentForm.detach().prependTo(toolbar);

      // Move highlight color to toolbar
      var highlightColorForm = $('#readermode_highlight_color');
      highlightColorForm.show();
      highlightColorForm
        .detach()
        .prependTo($(toolbar).find('.readermode-controls'));

      var colorElem = $('#readermode_selected_color .readermode-color')[0];
      var oldColor = colorElem.classList[1];

      colorElem.classList.replace(oldColor, 'readermode-red');

      setToolbarPosition(e, 'readermode_toolbar');

      $('#readermode_comment').val('');
      $(toolbar).show();
    } else if (!isClickedCommentForm) {
      $(toolbar).hide();
    } else {
      return;
    }
  }

  function showUpdateToolbar(e, comment, color) {
    e.preventDefault();

    var toolbarUpdate = document.getElementById('readermode_toolbar_update');

    // Move commnet form to toolbar_update
    var commentForm = $('#readermode_comment_form');
    commentForm.detach().prependTo(toolbarUpdate);

    // Move highlight color to toolbar
    var highlightColorForm = $('#readermode_highlight_color');
    highlightColorForm.show();
    highlightColorForm.detach().prependTo($(toolbarUpdate).find('.readermode-controls'));

    var colorElem = $('#readermode_selected_color .readermode-color')[0];
    var oldColor = colorElem.classList[1];

    colorElem.classList.replace(oldColor, color);
    $('#readermode_comment').val(comment);

    setToolbarPosition(e, 'readermode_toolbar_update');

    commentForm.show();
    $(toolbarUpdate).show();
    isShowedUpdateToolbar = true;
  }

  function hideUpdateToolbar(e) {
    var target = e.target;
    var isClickedCommentForm = target.id === 'readermode_comment';
    var isClickedHighlight = target.classList.contains('readermode-highlight');

    if (isShowedUpdateToolbar && !isClickedCommentForm && !isClickedHighlight) {
      $('#readermode_toolbar_update').hide();
      isShowedUpdateToolbar = false;
    }
  }

  function loadHighlights() {
    chrome.storage.local.get(function (storage) {
      if (storage[tabUrl]) {
        highlightsArr = JSON.parse(storage[tabUrl]);
        $(document.body).markRanges(highlightsArr, options);
      }
    });
  }

  function saveHighlights() {
    chrome.storage.local.get(function (storage) {
      storage[tabUrl] = JSON.stringify(highlightsArr);

      chrome.storage.local.set(storage);
    });
  }

  function setToolbarPosition(e, id) {
    var h = parseInt($(`#${id}`).height());
    var w = parseInt($(`#${id}`).width());

    var toolbarTop =
      parseInt(e.clientY) - h - 30 + parseInt($(document).scrollTop());
    var toolbarLeft =
      parseInt(e.clientX) -
      parseInt(w / 2) +
      parseInt($(document).scrollLeft());

    if (e.clientY < h + 30) {
      toolbarTop = parseInt(e.clientY) + 10 + parseInt($(document).scrollTop());
    }

    if (e.clientX < w / 2 - 10) {
      toolbarLeft = 10 + parseInt($(document).scrollLeft());
    } else if (e.clientX > $('body').width() - 200) {
      toolbarLeft =
        parseInt($('body').width()) - 200 + parseInt($(document).scrollLeft());
    }

    $(`#${id}`).css({
      top: toolbarTop,
      left: toolbarLeft
    });
  }

  function applyHighlight() {
    var cloneDom = document.body.cloneNode(true);

    options.exclude.forEach(function (elem) {
      $(document.body).find(elem).remove();
    });

    var preSelectionRange = document.createRange();
    var start = 0;
    var end = 0;

    preSelectionRange.selectNodeContents(document.body);

    if (selectedRange) {
      preSelectionRange.setEnd(selectedRange.startContainer, selectedRange.startOffset);
      start = preSelectionRange.toString().length;
      end = start + selectedRange.toString().length;
    }
    document.body = cloneDom;

    var $commentElem = $('#readermode_comment');
    var comment = $commentElem.val().trim();
    var selectedColor = $('#readermode_selected_color .readermode-color')[0].classList[1];
    var id = new Date().getTime();
    var highlight = { start, length: end - start, id, comment, color: selectedColor };

    highlightsArr.push(highlight);

    $(document.body).unmark({
      ...options,
      done: function () {
        $(document.body).markRanges(highlightsArr, {
          ...options,
          done: function () {
            saveHighlights();
            $('#readermode_toolbar').hide();
          }
        });
      }
    });
  }

  function updateHighlight(e) {
    var selectedId = highlightedDomElem.dataset.highlightId;
    var comment = $('#readermode_comment').val();
    var colorElem = $('#readermode_selected_color .readermode-color')[0];
    var color = colorElem.classList[1];

    highlightsArr.forEach((item, i) => {
      if (parseInt(selectedId) === parseInt(item.id)) {
        item.comment = comment;
        item.color = color;
      }
    });

    var currentElems = $(`span[data-highlight-id=${selectedId}]`);

    for (var i = 0; i < currentElems.length; i++) {
      currentElems[i].className = `readermode-highlight ${color}`;
      currentElems[i].title = comment;
    }

    hideUpdateToolbar(e);
    saveHighlights();
  }

  function removeAllHighlights() {
    highlightsArr = [];
    saveHighlights();
    $('#readermode_toolbar').hide();
    $('body').unmark(options);
  }

  function removeSelectedHighlight() {
    var selectedId = highlightedDomElem.dataset.highlightId;
    var highlightIndex = -1;

    highlightIndex = highlightsArr.findIndex((item, i) => {
      return parseInt(selectedId) === parseInt(item.id);
    });

    $(highlightedDomElem).unmark({
      done: function () {
        $(`[data-highlight-id=${selectedId}]`).removeClass();
        $(`[data-highlight-id=${selectedId}]`).attr('title', '');
        $('#readermode_toolbar_update').hide();
        highlightsArr.splice(highlightIndex, 1);
        saveHighlights();
      }
    });
  }

  function toggleColorList() {
    $('#readermode_color_list').toggle();
  }

  function selectColor(e) {
    var elem = $('#readermode_selected_color .readermode-color')[0];
    var oldColor = elem.classList[1];
    var newColor = e.target.classList[1];

    elem.classList.replace(oldColor, newColor);
    $('#readermode_color_list').hide();
  }
})();