function main_set_basic_fields(){
  $("#osp-title").val(title);
  $("#osp-title").focus();
  forms_autogrow_textarea("osp-title");
  setTimeout(function(){
    $("#osp-title").blur();
    $("#osp-excerpt").focus();
  }, 10);
  forms_autogrow_textarea("osp-excerpt");
  setTimeout(function(){
    $("#osp-excerpt").blur();
  }, 10);
}

function main_start_menu_actions(){
  $("#ms-bookmark").click(function(){
    $("#main-start").hide();
    $("#main-bookmark").show();

    main_set_basic_fields();
  });
  $("#ms-read-annotate").click(function(){
    //startReader();
    //window.close();
  });
  $("#ms-annotate-pdf").click(function(){
    var optionsUrl = chrome.extension.getURL('pdf/web/viewer.html');
    
    chrome.tabs.getSelected(null, function (c) {
      //  c.url.substring(c.url.length - 4) == ".pdf" ? chrome.tabs.create({ url: "/pdf/viewer.html?file=" + c.url }) : chrome.tabs.create({ url: "/pdf/viewer.html" });
      window.open(optionsUrl+"?file="+c.url, '_blank');
    });
  });
}

function main_start_menu_bottom_toggle(){
  $("#msf-bottom-toggle").click(function(){
    $('#msf-bottom-toggle i').toggleClass('msf-bottom-toggle-rotate');
    $('#msf-bottom-toggle i').toggleClass('msf-bottom-toggle-rotate-none');
    $("#msf-seperator").toggle();
    $("#msf-bottom").toggle();
  });
}

function main_init(){
  main_start_menu_actions();
  main_start_menu_bottom_toggle();
}
main_init();
