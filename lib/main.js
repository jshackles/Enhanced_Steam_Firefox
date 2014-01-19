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
                prefSet.prefs.showregionalprice,
                prefSet.prefs.showprofilelinks_display,
                prefSet.prefs.showallachievements
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
            img_pcgw: data.url('img/pcgw.png'),
            img_red_banner: data.url('img/red_banner.png'),
            img_steamcardexchange: data.url('img/steamcardexchange.png'),
            img_steamdb: data.url('img/steamdb.png'),
            img_steamdb_store: data.url('img/steamdb_store.png'),
            img_world: data.url('img/world.png'),
            img_overlay_ea_sm_120: data.url('img/overlay/ea_sm_120.png'),
            img_overlay_ea_184x69: data.url('img/overlay/ea_184x69.png'),
            img_overlay_ea_231x87: data.url('img/overlay/ea_231x87.png'),
            img_overlay_ea_292x136: data.url('img/overlay/ea_292x136.png'),
            img_overlay_ea_467x181: data.url('img/overlay/ea_467x181.png'),
            img_ico_achievementstats: data.url('img/ico/achievementstats.png'),
            img_ico_astatsnl: data.url('img/ico/astatsnl.png'),
            img_ico_backpacktf: data.url('img/ico/backpacktf.png'),
            img_ico_steamdb: data.url('img/ico/steamdb.png'),
            img_ico_steamgifts: data.url('img/ico/steamgifts.png'),
            img_ico_steamrep: data.url('img/ico/steamrep.png'),
            img_ico_steamtrades: data.url('img/ico/steamtrades.png'),
            img_ico_achievementstats_col: data.url('img/ico/achievementstats_col.png'),
            img_ico_astatsnl_col: data.url('img/ico/astatsnl_col.png'),
            img_ico_backpacktf_col: data.url('img/ico/backpacktf_col.png'),
            img_ico_steamdb_col: data.url('img/ico/steamdb_col.png'),
            img_ico_steamgifts_col: data.url('img/ico/steamgifts_col.png'),
            img_ico_steamrep_col: data.url('img/ico/steamrep_col.png'),
            img_ico_steamtrades_col: data.url('img/ico/steamtrades_col.png')
        }
    });
}