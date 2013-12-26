var data = require("self").data;
var pageMod = require("page-mod");
var prefSet = require("simple-prefs");

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
        contentScriptFile: [data.url("jQuery.min.js"), data.url("localization.js"), data.url("contentScript.js")],
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
            }
    });
}