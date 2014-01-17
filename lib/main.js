var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var prefSet = require("sdk/simple-prefs");

prefSet.on("ownedColorDefault", function() {
    prefSet.prefs.ownedColor = "#5c7836";
})

prefSet.on("wishlistColorDefault", function() {
    prefSet.prefs.wishlistColor = "#496e93";
})

exports.main = function() {
    pageMod.PageMod({
        include: ["*.steampowered.com", "*.steamcommunity.com"], 
        contentScriptWhen: 'end',
        contentStyleFile: [data.url("enhancedsteam.css"), data.url("es_flags.css")],
        contentScriptFile: [data.url("jQuery.min.js"), data.url("localization.js"), data.url("enhancedsteam.js")],
        onAttach: function(worker) {
            worker.port.emit('get-prefs', [ 
                prefSet.prefs.ownedColor,
                prefSet.prefs.wishlistColor,
                prefSet.prefs.hideInstallSteam,
                prefSet.prefs.showDRM,
                prefSet.prefs.showmcus,
                prefSet.prefs.showdblinks,
                prefSet.prefs.showwsgf,
                prefSet.prefs.showpricehistory,
                prefSet.prefs.showappdesc,
                prefSet.prefs.showtotal,
                prefSet.prefs.showcustombg,
                prefSet.prefs.changegreenlightbanner,
                prefSet.prefs.showprofilelinks,
                prefSet.prefs.hideaboutmenu,
                prefSet.prefs.showmarkethistory,
                prefSet.prefs.showhltb,
                prefSet.prefs.showpcgw,
                prefSet.prefs.contscroll,
                prefSet.prefs.showsteamchartinfo,
                prefSet.prefs.showregionalprice
            ]);
        },
        contentScriptOptions: {
            img_arrows: data.url('img/arrows.png'),
            img_es_btn_browse: data.url('img/es_btn_browse.png'),
            img_check_sheet: data.url('img/check_sheet.png'),
            img_flags: data.url('img/flags.png'),
            img_game_area_warning: data.url('img/game_area_warning.png'),
            img_line_chart: data.url('img/line_chart.png'),
            img_metacritic_bg: data.url('img/metacritic_bg.png'),
            img_steamdb: data.url('img/steamdb.png'),
            img_steamdb_store: data.url('img/steamdb_store.png'),
            img_world: data.url('img/world.png')
        }
    });
}