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
        contentScriptWhen: 'ready',
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
                prefSet.prefs.showallachievements,
                prefSet.prefs.showlanguagewarninglanguage,
                prefSet.prefs.showlanguagewarning,
                prefSet.prefs.showastats,
                prefSet.prefs.highlight_owned,
                prefSet.prefs.highlight_wishlist,
                prefSet.prefs.region1,
                prefSet.prefs.region2,
                prefSet.prefs.region3,
                prefSet.prefs.region4,
                prefSet.prefs.region5,
                prefSet.prefs.region6,
                prefSet.prefs.region7,
                prefSet.prefs.region8,
                prefSet.prefs.region9,
                prefSet.prefs.showACRTAG
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
            img_steamdb_store_black: data.url('img/steamdb_store_black.png'),
            img_world: data.url('img/world.png'),
            img_decline: data.url('img/decline.png'),
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
            img_ico_steamtrades_col: data.url('img/ico/steamtrades_col.png'),
            img_steamcardexchange_store: data.url('img/steamcardexchange_store.png'),
            img_wsgf_ws_gold: data.url('img/wsgf/ws-gold.png'),
            img_wsgf_ws_silver: data.url('img/wsgf/ws-silver.png'),
            img_wsgf_ws_limited: data.url('img/wsgf/ws-limited.png'),
            img_wsgf_ws_inc: data.url('img/wsgf/ws-incomplete.png'),
            img_wsgf_ws_uns: data.url('img/wsgf/ws-unsupported.png'),
            img_wsgf_mm_gold: data.url('img/wsgf/mm-gold.png'),
            img_wsgf_mm_silver: data.url('img/wsgf/mm-silver.png'),
            img_wsgf_mm_limited: data.url('img/wsgf/mm-limited.png'),
            img_wsgf_mm_inc: data.url('img/wsgf/mm-incomplete.png'),
            img_wsgf_mm_uns: data.url('img/wsgf/mm-unsupported.png'),
            img_wsgf_4k_gold: data.url('img/wsgf/4k-gold.png'),
            img_wsgf_4k_silver: data.url('img/wsgf/4k-silver.png'),
            img_wsgf_4k_limited: data.url('img/wsgf/4k-limited.png'),
            img_wsgf_4k_inc: data.url('img/wsgf/4k-incomplete.png'),
            img_wsgf_4k_uns: data.url('img/wsgf/4k-unsupported.png'),
            img_wsgf_uw_gold: data.url('img/wsgf/uw-gold.png'),
            img_wsgf_uw_silver: data.url('img/wsgf/uw-silver.png'),
            img_wsgf_uw_limited: data.url('img/wsgf/uw-limited.png'),
            img_wsgf_uw_inc: data.url('img/wsgf/uw-incomplete.png'),
            img_wsgf_uw_uns: data.url('img/wsgf/uw-unsupported.png'),
            img_trading: data.url('img/trading.png')
        }
    });
}