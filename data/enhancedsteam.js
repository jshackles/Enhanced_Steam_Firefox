// Enhanced Steam
var apps;
var language;
var appid_promises = {};
var ownedColor,
    wishlistColor,
    hideInstallSteam,
    showDRM,
    showmcus,
    showdblinks,
    showwsgf,
    showpricehistory,
    showappdesc,
    showtotal,
    showcustombg,
    changegreenlightbanner,
    showprofilelinks,
    hideaboutmenu,
    showmarkethistory,
    showhltb,
    showpcgw,
    contscroll,
    showsteamchartinfo,
    showregionalprice;
    
var search_threshhold = $(window).height() - 80;

var cookie = document.cookie;
if (cookie.match(/language=([a-z]{3})/i)) {
    language = cookie.match(/language=([a-z]{3})/i)[1];
}
if (localized_strings[language] === undefined) { language = "eng"; }

// get preference values here   
self.port.on("get-prefs", function(data) {
    ownedColor = data[0];
    wishlistColor = data[1];
    hideInstallSteam = data[2];
    showDRM = data[3];
    showmcus = data[4];
    showdblinks = data[5];
    showwsgf = data[6];
    showpricehistory = data[7];
    showappdesc = data[8];
    showtotal = data[9];
    showcustombg = data[10];
    changegreenlightbanner = data[11];
    showprofilelinks = data[12];
    hideaboutmenu = data[13];
    showmarkethistory = data[14];
    showhltb = data[15];
    showpcgw = data[16];
    contscroll = data[17];
    showsteamchartinfo = data[18];
    showregionalprice = data[19];
});

// Session storage functions.
function setValue(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
}

function getValue(key) {
	var v = sessionStorage.getItem(key);
	if (v === undefined) return v;
	return JSON.parse(v);
}

// Helper prototypes
function startWith(str, prefix) {
    return str.lastIndexOf(prefix, 0) === 0;
}

function formatMoney(number, places, symbol, thousand, decimal, right) {
	places = !isNaN(places = Math.abs(places)) ? places : 2;
	symbol = symbol !== undefined ? symbol : "$";
	thousand = thousand || ",";
	decimal = decimal || ".";
	var negative = number < 0 ? "-" : "",
		i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
		j = (j = i.length) > 3 ? j % 3 : 0;    
	if (right) {
		return negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) + symbol: "");
	} else {
		return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
	}
};

function escapeHTML(str) str.replace(/[&"<>]/g, function (m) escapeHTML.replacements[m]);
escapeHTML.replacements = { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" };


function getCookie(name) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
}

// DOM helpers
function xpath_each(xpath, callback) {
	var res = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	var node;
	for (var i = 0; i < res.snapshotLength; ++i) {
		node = res.snapshotItem(i);
		callback(node);
	}
}

function get_http(url, callback) {
    var http = new XMLHttpRequest();
	http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			callback(this.responseText);
		}
	};
	http.open('GET', url, true);
	http.send(null);
}

function get_appid(t) {
	if (t && t.match(/(?:store\.steampowered|steamcommunity)\.com\/app\/(\d+)\/?/)) return RegExp.$1;
	else return null;
}

function get_subid(t) {
	if (t && t.match(/(?:store\.steampowered|steamcommunity)\.com\/sub\/(\d+)\/?/)) return RegExp.$1;
	else return null;
}

function get_appid_wishlist(t) {
	if (t && t.match(/game_(\d+)/)) return RegExp.$1;
	else return null;
}

function get_gamecard(t) {
    if (t && t.match(/(?:id|profiles)\/.+\/gamecards\/(\d+)/)) return RegExp.$1;
	else return null;
}

function ensure_appid_deferred(appid) {
    if (!appid_promises[appid]) {
		var deferred = new $.Deferred();
		appid_promises[appid] = {
			"resolve": deferred.resolve,
			"promise": deferred.promise()
		};
	}
}

// check if the user is signed in
function is_signed_in() {
    var isSignedIn, signedInChecked;
	if (!signedInChecked) {
		var steamLogin = getCookie("steamLogin");
		if (steamLogin) isSignedIn = steamLogin.replace(/%.*/, "");
		signedInChecked = true;
	}
	return isSignedIn;
}

// colors the tile for owned games
function highlight_owned(node) {
    highlight_node(node, ownedColor);  
}

// colors the tile for wishlist games
function highlight_wishlist(node) {
	highlight_node(node, wishlistColor);
}

function highlight_node(node, color) {
    var $node = $(node);
	// Carousel item
	if (node.classList.contains("cluster_capsule")) {
		$node = $(node).find(".main_cap_content");
	}

	// Genre Carousel items
	if (node.classList.contains("large_cap")) {
		$node = $(node).find(".large_cap_content");
	}

	if (node.classList.contains("insert_season_here_sale_dailydeal_ctn")) {
		$node = $(node).find(".dailydeal_footer");
	}
    
    if (node.classList.contains("wintersale_dailydeal_ctn")) {
    	$node = $(node).find(".dailydeal_footer");
	}
    
    // App and community hub page headers
    if (node.classList.contains("apphub_HeaderTop") || node.classList.contains("apphub_HeaderStandardTop")) {
		$node = $(node).find(".apphub_AppName");
		$node.css("color", color);
		return;
	}

	// Blotter activity
    if ($node.parent().parent()[0].classList.contains("blotter_daily_rollup_line") || $node.parent().parent()[0].classList.contains("blotter_author_block") || $node.parent().parent()[0].classList.contains("blotter_gamepurchase") || $node.parent().parent()[0].classList.contains("blotter_recommendation")) {
		$node.css("color", color);
		return;
	}

	$node.css("backgroundImage", "none");
	$node.css("backgroundColor", color);

	// Set text colour to not conflict with highlight.
	if (node.classList.contains("tab_row")) $node.find(".tab_desc").css("color", "lightgrey");
	if (node.classList.contains("search_result_row")) $node.find(".search_name").css("color", "lightgrey");
}

function hide_node(node) {
    if (node.classList.contains("search_result_row") || node.classList.contains("tab_row") || node.classList.contains("game_area_dlc_row")) {
		$(node).css("display", "none");
        search_threshhold = search_threshhold - 58;
	}
}

function load_inventory() {
    if ($(".user_avatar").length > 0) { var profileurl = $(".user_avatar")[0].href || $(".user_avatar a")[0].href; }     
	var gift_deferred = new $.Deferred();
	var coupon_deferred = new $.Deferred();
	var card_deferred = new $.Deferred();

	var handle_inv_ctx1 = function (txt) {
		if (txt.charAt(0) != "<") {

			localStorage.setItem("inventory_1", txt);
			var data = JSON.parse(txt);
			if (data.success) {
				$.each(data.rgDescriptions, function(i, obj) {
					if (obj.actions) {
						var appid = get_appid(obj.actions[0].link);
						setValue(appid + (obj.type === "Gift" ? "gift" : "guestpass"), true);
					}
				});
			}
			gift_deferred.resolve();
		}
	};

	var handle_inv_ctx6 = function (txt) {
		if (txt) {
			if (txt.charAt(0) != "<") {
				localStorage.setItem("inventory_6", txt);
				var data = JSON.parse(txt);
				if (data.success) {
					$.each(data.rgDescriptions, function(i, obj) {
						if (obj.market_hash_name) {
							setValue("card:" + obj.market_hash_name, true);
						}
					});
				}
				card_deferred.resolve();
			}
		}
	};

	var handle_inv_ctx3 = function (txt) {
        if (txt.charAt(0) != "<") {
			localStorage.setItem("inventory_3", txt);
			var data = JSON.parse(txt);
			if (data.success) {
				$.each(data.rgDescriptions, function(i, obj) {
					var appid;
					if (obj.type === "Coupon") {
						if (obj.actions) {
							var packageids = [];
							for (var j = 0; j < obj.actions.length; j++) {
								//obj.actions[j]
								var link = obj.actions[j].link;
								var packageid = /http:\/\/store.steampowered.com\/search\/\?list_of_subs=([0-9]+)/.exec(link)[1];

								if (!getValue("sub" + packageid)) packageids.push(packageid);
							}
							if (packageids.length > 0){
								get_http("http://store.steampowered.com/api/packagedetails/?packageids=" + packageids.join(","), function(txt) {
									var package_data = JSON.parse(txt);
									$.each(package_data, function(package_id, _package) {
										if (_package.success) {
											setValue("sub" + package_id, true);
											$.each(_package.data.apps, function(i, app) {
												setValue(app.id + "coupon", true);
												setValue(app.id + "coupon_sub", package_id);
												setValue(app.id + "coupon_imageurl", obj.icon_url);
												setValue(app.id + "coupon_title", obj.name);
												setValue(app.id + "coupon_discount", obj.name.match(/([1-9][0-9])%/)[1]);
												for (var i = 0; i < obj.descriptions.length; i++) {
													if (obj.descriptions[i].value.startsWith("Can't be applied with other discounts.")) {
														setValue(app.id + "coupon_discount_note", obj.descriptions[i].value);
														setValue(app.id + "coupon_discount_doesnt_stack", true);
													}
													else if (obj.descriptions[i].value.startsWith("(Valid")) {
														setValue(app.id + "coupon_valid", obj.descriptions[i].value);
													}
												};
											});
										}
									});
									coupon_deferred.resolve();
								});
							}
							else {
								coupon_deferred.resolve();
							}
						}
					}
				});
			}
		}
	}

	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem("inventory_time") || expire_time - 1;
	if (last_updated < expire_time || !localStorage.getItem("inventory_1") || !localStorage.getItem("inventory_3")) {		
        localStorage.setItem("inventory_time", parseInt(Date.now() / 1000, 10))
		if (profileurl) {
            get_http(profileurl + '/inventory/json/753/1/', handle_inv_ctx1);
    		get_http(profileurl + '/inventory/json/753/3/', handle_inv_ctx3);        
    		get_http(profileurl + '/inventory/json/753/6/', handle_inv_ctx6);
		}
	}
	else {		
		handle_inv_ctx1(localStorage.getItem("inventory_1"));
		handle_inv_ctx3(localStorage.getItem("inventory_3"));
		handle_inv_ctx6(localStorage.getItem("inventory_6"));

		gift_deferred.resolve();
		coupon_deferred.resolve();
		card_deferred.resolve();
	}

	var deferred = new $.Deferred();
    
	$.when.apply(null, [gift_deferred.promise(), card_deferred.promise(), coupon_deferred.promise()]).done(function (){
		deferred.resolve();
	});
	return deferred.promise();
}

function add_empty_wishlist_button() {
    var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");	
	if (window.location.pathname.startsWith(profile)) {
		var empty_button = $("<div class='btn_save es_empty_wishlist' style='border-color:red; width: auto;'>&nbsp;&nbsp;<a>" + localized_strings[language].empty_wishlist + "</a>&nbsp;&nbsp;</div>");
		empty_button.on('click', null, { empty_owned_only: false }, empty_wishlist);
		$("#games_list_container").after(empty_button);
	}
}

function add_empty_owned_wishlist_button() {
	var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");	
	if (window.location.pathname.startsWith(profile)) {
		var empty_button = $("<div class='btn_save es_empty_owned_wishlist' style='border-color:red; width: auto; margin-right: 10px;'>&nbsp;&nbsp;<a>Remove All Owned From Wishlist</a>&nbsp;&nbsp;</div>");
		$("#mainContents").on("click", ".es_empty_owned_wishlist", { empty_owned_only: true }, empty_wishlist);
		$("#games_list_container").after(empty_button);
	}
}

function add_remove_from_wishlist_button(appid) {
    if (is_signed_in()) {
        $(".demo_area_button").find("p").append(" (<span id='es_remove_from_wishlist' style='text-decoration: underline; cursor: pointer;'>Remove</span>)");		
        $("#es_remove_from_wishlist").click(function() { remove_from_wishlist(appid); });
    }
}

function empty_wishlist(e) {
    var conf_text = (e.data.empty_owned_only) ? "Are you sure you want to remove games you own from your wishlist?\n\nThis action cannot be undone!" : "Are you sure you want to empty your wishlist?\n\nThis action cannot be undone!"
	var conf = confirm(conf_text);
	if (conf) {
		var wishlist_class = (e.data.empty_owned_only) ? ".wishlistRow.es_highlight_owned" : ".wishlistRow"
		var deferreds = $(wishlist_class).map(function(i, $obj) {
			var deferred = new $.Deferred();
			var appid = get_appid_wishlist($obj.id),
				http = new XMLHttpRequest(),
				profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com/", "");

			http.onreadystatechange = function () {
				if (this.readyState == 4 && this.status == 200) {
					deferred.resolve();
				}
			};
			http.open('POST', "http://steamcommunity.com/" + profile + "/wishlist/", true);
			http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			http.send("action=remove&appid=" + encodeURIComponent(appid));

			return deferred.promise();
		});

		$.when.apply(null, deferreds).done(function(){
			location.reload();
		});
	}
}

function remove_from_wishlist(appid) {
    var http = new XMLHttpRequest(),
		profile = $(".user_avatar")[0].href.replace("http://steamcommunity.com/", "");

	http.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			location.reload();
		}
	};
	
	http.open('POST', "http://steamcommunity.com/" + profile + "/wishlist/", true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.send("action=remove&appid=" + encodeURIComponent(appid));
}

function add_wishlist_filter() {
    var html  = "<span>" + localized_strings[language].show + ": </span>";
		html += "<label class='es_sort' id='es_wl_all'><input type='radio' name='es_wl_sort' checked><span><a>" + localized_strings[language].games_all + "</a></span></label>";
		html += "<label class='es_sort' id='es_wl_sale'><input type='radio' name='es_wl_sort'><span><a>" + localized_strings[language].games_discount + "</a></span></label>";
    	//html += "<label class='es_sort' id='es_wl_coupon'><input type='radio' name='es_wl_sort'><span><a>" + localized_strings[language].games_coupon + "</a></span></label>";
		html += "</div>";

	$('#wishlist_sort_options').append("<p>" + html);
	
	$('#es_wl_all').on('click', function() {
		$('.wishlistRow').css('display', 'block');
	});
	
	$('#es_wl_sale').on('click', function() {
		$('.wishlistRow').each(function () {
			if (!$(this).html().match(/discount_block_inline/)) {
				$(this).css('display', 'none');
			}
		});
	});
    
    $('#es_wl_coupon').on('click', function() {
    	$('.wishlistRow').each(function () {
			if (!$(this)[0].outerHTML.match(/es_highlight_coupon/)) {
				$(this).css('display', 'none');
			}
		});
	});
}

function add_wishlist_discount_sort() {
    if ($("#wishlist_sort_options").find("a[href$='price']").length > 0) {
		$("#wishlist_sort_options").find("a[href$='price']").after("&nbsp;&nbsp;<label id='es_wl_sort_discount'><a>Discount</a></label>");
	} else {
		$("#wishlist_sort_options").find("span[class='selected_sort']").after("&nbsp;&nbsp;<label id='es_wl_sort_discount'><a>Discount</a></label>");
	}
	
	$("#es_wl_sort_discount").on("click", function() {
		var wishlistRows = [];
		$('.wishlistRow').each(function () {
			var push = new Array();
			if ($(this).html().match(/discount_block_inline/)) {				
				push[0] = this.outerHTML;
				push[1] = $(this).find("div[class='discount_pct']").html();				
			} else {
				push[0] = this.outerHTML;
				push[1] = "0";
			}
			wishlistRows.push(push);
			this.parentNode.removeChild(this);
		});
		
		wishlistRows.sort(function(a,b) { return parseInt(a[1],10) - parseInt(b[1],10);	});
		
		$('.wishlistRow').each(function () { $(this).css("display", "none"); });
		
		$(wishlistRows).each(function() {
			$("#wishlist_items").append(this[0]);
		});
		
		$(this).html("<span style='color: #B0AEAC;'>Discount</span>");
		var html = $("#wishlist_sort_options").find("span[class='selected_sort']").html();
		html = "<a onclick='location.reload()'>" + html + "</a>";
		$("#wishlist_sort_options").find("span[class='selected_sort']").html(html);
	});
}

function pack_split(node, ways) {
    var price_text = $(node).find(".discount_final_price").html();
	var at_end, comma, places = 2;
	if (price_text == null) { price_text = $(node).find(".game_purchase_price").html(); }
	if (price_text.match(",")) {
		at_end = true;
		comma = true;
		price_text = price_text.replace(",", ".");
	}
	var currency_symbol = price_text.match(/(?:R\$|\$|€|£|pуб)/)[0];
	if (currency_symbol.match(/R\$/)) { at_end = false; }
	if (currency_symbol.match(/pуб/)) { at_end = true; places = 0}
	var price = (Number(price_text.replace(/[^0-9\.]+/g,""))) / ways;
	price = (Math.ceil(price * 100) / 100);
	price_text = formatMoney(price, places, currency_symbol, ",", comma ? "," : ".", at_end);
	$(node).find(".btn_addtocart").last().before(
		"<div class='es_each_box'><div class='es_each_price'>" + escapeHTML(price_text) + "</div><div class='es_each'>" + localized_strings[language].each + "</div></div>"
	);
}

function add_4pack_breakdown() {
	$(".game_area_purchase_game_wrapper").each(function() {
		var title = $(this).find("h1").text().trim();
		title = title.toLowerCase().replace(/-/g, ' ');
		if (!title || !title.contains('pack')) return;

		if (title.contains(' 2 pack')) { pack_split(this, 2); }
		else if (title.contains(' two pack')) { pack_split(this, 2); }
		else if (title.contains('tower wars friend pack')) { pack_split(this, 2); }

		else if (title.contains(' 3 pack')) { pack_split(this, 3); }
		else if (title.contains(' three pack')) { pack_split(this, 3); }
		else if (title.contains('tower wars team pack')) { pack_split(this, 3); }

		else if (title.contains(' 4 pack')) { pack_split(this, 4); }
		else if (title.contains(' four pack')) { pack_split(this, 4); }
		else if (title.contains(' clan pack')) { pack_split(this, 4); }

		else if (title.contains(' 5 pack')) { pack_split(this, 5); }
		else if (title.contains(' five pack')) { pack_split(this, 5); }

		else if (title.contains(' 6 pack')) { pack_split(this, 6); }
		else if (title.contains(' six pack')) { pack_split(this, 6); }
	});
}

function send_age_verification() {
    document.getElementsByName("ageYear")[0].value="1955";
	document.getElementsByClassName("btn_checkout_green")[0].click();
}

function add_steamchart_info(appid) {
    if ($(".game_area_dlc_bubble").length == 0) {
		if (showsteamchartinfo === true) {
			get_http("http://api.enhancedsteam.com/charts/?appid=" + appid, function (txt) {
				if (txt.length > 0) {
					var data = JSON.parse(txt);
					if (data["chart"]) {
						var html = '<div id="steam-charts" class="game_area_description"><h2>' + localized_strings[language].charts.current + '</h2>';
						html += '<div id="chart-heading" class="chart-content"><div id="chart-image"><img src="http://cdn4.steampowered.com/v/gfx/apps/' + appid + '/capsule_184x69.jpg" width="184" height="69"></div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["current"]) + '</span><br>' + localized_strings[language].charts.playing_now + '</div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["peaktoday"]) + '</span><br>' + localized_strings[language].charts.peaktoday + '</div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["peakall"]) + '</span><br>' + localized_strings[language].charts.peakall + '</div><span class="chart-footer">Powered by <a href="http://steamcharts.com/app/' + appid + '" target="_blank">SteamCharts.com</a></span></div></div>';
						
						$("#game_area_sys_req").before(html);
					}
				}
			});
		}
	}
}

function add_wallet_balance_to_header() {
	$("#global_action_menu").append("<div id='es_wallet' style='text-align:right; padding-right:12px; line-height: normal;'>");
	$("#es_wallet").load('http://store.steampowered.com #header_wallet_ctn');
}

// Adds Enhanced Steam menu
function add_enhanced_steam_options() {
    $dropdown = $("<span class=\"pulldown global_action_link\" id=\"enhanced_pulldown\">Enhanced Steam</span>");
	$dropdown_options_container = $("<div class=\"popup_block\"><div class=\"popup_body popup_menu\"></div></div>");
	$dropdown_options = $dropdown_options_container.find(".popup_body");
	$dropdown_options.css("display", "none");

	// remove menu if click anywhere but on "Enhanced Steam". Commented out bit is for clicking on menu won't make it disappear either.
	$('body').bind('click', function(e) {
		if(/*$(e.target).closest(".popup_body").length == 0 && */$(e.target).closest("#enhanced_pulldown").length == 0) {
			if ($dropdown_options.css("display") == "block" || $dropdown_options.css("display") == "") {
				$dropdown_options.css("display", "none");
			}
		}
	});

	$dropdown.click(function(){
		$dropdown_options.toggle();
	});

	$website_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"http://www.enhancedsteam.com\">" + localized_strings[language].website + "</a>");
	$contribute_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam\">" + localized_strings[language].contribute + "</a>");
	$bug_feature_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam/issues\">" + localized_strings[language].bug_feature + "</a>");
	$donation_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//enhancedsteam.com/donate.php\">" + localized_strings[language].donate + "</a>");
	$group_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//" + localized_strings[language].official_group_url + "\">" + localized_strings[language].official_group + "</a>");

	$clear_cache_link = $("<a class=\"popup_menu_item\" href=\"\">" + localized_strings[language].clear_cache + "</a>");
	$clear_cache_link.click(function(){
		localStorage.clear();
		sessionStorage.clear();
		location.reload();
	});

	$spacer = $("<div class=\"hr\"></div>");

	$dropdown_options.append($clear_cache_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($contribute_link);
	$dropdown_options.append($bug_feature_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($website_link);
	$dropdown_options.append($group_link);
	$dropdown_options.append($donation_link);

	$("#global_action_menu")
		.before($dropdown)
		.before($dropdown_options_container);
}

function add_header_links() {
	var supernav_content = document.querySelectorAll("#supernav .supernav_content");
	if ($("#supernav").length > 0) {
		$("a[href='http://steamcommunity.com/workshop/'][class$='submenuitem']").after('<a class="submenuitem" href="http://forums.steampowered.com/forums/" target="_blank">' + localized_strings[language].forums + '</a>');
		$("a[href$='/friends/'][class$='submenuitem']").before('<a class="submenuitem" href="http://steamcommunity.com/my/games/">' + localized_strings[language].games + '</a>');
		$("a[href$='/inventory/'][class$='submenuitem']").after('<a class="submenuitem" href="http://steamcommunity.com/my/recommended/">' + localized_strings[language].reviews + '</a>');
	}
}

function add_fake_country_code_warning() {
	var LKGBillingCountry = getCookie("LKGBillingCountry");
	var fakeCC = getCookie("fakeCC");

	if (fakeCC && LKGBillingCountry && LKGBillingCountry.length == 2 && LKGBillingCountry != fakeCC) {
		$("#global_header").after('<div class=content style="background-image: url( http://www.enhancedsteam.com/firefox/img/red_banner.png ); height: 21px; text-align: center; padding-top: 8px;">' + localized_strings[language].using_store.replace("__current__", escapeHTML(fakeCC)) + '  <a href="#" id="reset_fake_country_code">' + localized_strings[language].using_store_return.replace("__base__", escapeHTML(LKGBillingCountry)) + '</a></div>');
		$("#page_background_holder").css("top", "135px");
		$("#reset_fake_country_code").click(function(e) {
			e.preventDefault();
			document.cookie = 'fakeCC=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
			window.location.replace(window.location.href.replace(/[?&]cc=.{2}/, ""));
		})
	}
}

// Removes the "Install Steam" button at the top of each page
function remove_install_steam_button() {
    if (hideInstallSteam == true) {
        $('div.header_installsteam_btn').remove();
    }
}

// Removes the About menu item at the top of each page
function remove_about_menu() {
    if (hideaboutmenu == true) {
        $('a[href$="http://store.steampowered.com/about/"]').replaceWith('');
    }
}

// User profile pages
function add_community_profile_links() {
    if (showprofilelinks == true) {
        if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
        if (steamID === undefined) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }
    
    	var htmlstr = '';
    	htmlstr += '<div class="profile_count_link"><a href="http://www.steamgifts.com/user/id/' + steamID + '" target="_blank"><span class="count_link_label">SteamGifts</span>&nbsp;<img src="http://www.enhancedsteam.com/firefox/ico/steamgifts.ico" width="24" height="24" border="0" /></a></div>';
    	htmlstr += '<div class="profile_count_link"><a href="http://www.steamtrades.com/user/id/' + steamID + '" target="_blank"><span class="count_link_label">SteamTrades</span>&nbsp;<img src="http://www.enhancedsteam.com/firefox/ico/steamtrades.ico" width="24" height="24" border="0" /></a></div>';
    	htmlstr += '<div class="profile_count_link"><a href="http://steamrep.com/profiles/' + steamID + '" target="_blank"><span class="count_link_label">SteamRep</span>&nbsp;<img src="http://www.enhancedsteam.com/firefox/ico/steamrep.ico" width="24" height="24" border="0" /></a></div>';
    	htmlstr += '<div class="profile_count_link"><a href="http://wastedonsteam.com/id/' + steamID + '" target="_blank"><span class="count_link_label">Wasted On Steam</span>&nbsp;<img src="http://www.enhancedsteam.com/firefox/ico/wastedonsteam.ico" width="24" height="24" border="0" /></a></div>';
    	htmlstr += '<div class="profile_count_link"><a href="http://sapi.techieanalyst.net/?page=profile&id=' + steamID + '" target="_blank"><span class="count_link_label">sAPI</span>&nbsp;<img src="http://www.enhancedsteam.com/firefox/ico/sapi.ico" width="24" height="24" border="0" /></a></div>';
    	htmlstr += '<div class="profile_count_link"><a href="http://backpack.tf/profiles/' + steamID + '" target="_blank"><span class="count_link_label">backpack.tf</span>&nbsp;<img src="http://www.enhancedsteam.com/firefox/ico/backpacktf.ico" width="24" height="24" border="0" /></a></div>';
    	htmlstr += '<div class="profile_count_link"><a href="http://www.achievementstats.com/index.php?action=profile&playerId=' + steamID + '" target="_blank"><span class="count_link_label">Achievement Stats</span>&nbsp;<img src="http://www.enhancedsteam.com/firefox/ico/achievementstats.ico" width="24" height="24" border="0" /></a></div>';
    
    	if (htmlstr != '') { $(".profile_item_links").append(htmlstr); }
    }
}

// fixes "Image not found" in wishlist
function fix_wishlist_image_not_found() {
    var items = document.getElementById("wishlist_items");
    if (items) {
        imgs = items.getElementsByTagName("img");
        for (var i = 0; i < imgs.length; i++)
        if (imgs[i].src == "http://media.steampowered.com/steamcommunity/public/images/avatars/33/338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif") {
            var gameurl = imgs[i].parentNode.href;
            imgs[i].src = "http://cdn.steampowered.com/v/gfx/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
        }
    }
}

function fix_profile_image_not_found() {
    var items = $(".recent_game");
	if (items) {
		imgs = $(items).find("img");
		for (var i = 0; i < imgs.length; i++)
		if (imgs[i].src == "http://media.steampowered.com/steamcommunity/public/images/avatars/33/338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif") {
			var gameurl = imgs[i].parentNode.href;
			imgs[i].src = "http://cdn.steampowered.com/v/gfx/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
			imgs[i].width = 184;
			imgs[i].height = 69;
		}
	}	
}

function appdata_on_wishlist() {
    xpath_each("//a[contains(@class,'btn_visit_store')]", function (node) {		
        var app = get_appid(node.href);		
        get_http('http://store.steampowered.com/api/appdetails/?appids=' + app, function (data) {    		            
            var storefront_data = JSON.parse(data);
            $.each(storefront_data, function(appid, app_data) {
				if (app_data.success) {
					if (app_data.data.packages && app_data.data.packages[0]) {
						var htmlstring = '<form name="add_to_cart_' + escapeHTML(app_data.data.packages[0]) + '" action="http://store.steampowered.com/cart/" method="POST">';
						htmlstring += '<input type="hidden" name="snr" value="1_5_9__403">';
						htmlstring += '<input type="hidden" name="action" value="add_to_cart">';
						htmlstring += '<input type="hidden" name="subid" value="' + escapeHTML(app_data.data.packages[0]) + '">';
						htmlstring += '</form>';
						$(node).before('</form>' + htmlstring + '<a href="#" onclick="document.forms[\'add_to_cart_' + escapeHTML(app_data.data.packages[0]) + '\'].submit();" class="btn_visit_store">' + localized_strings[language].add_to_cart + '</a>  ');
					}
					
					if (app_data.data.platforms) {
						var htmlstring = "";
						var platforms = 0;
						if (app_data.data.platforms.windows) { htmlstring += "<span class='platform_img win'></span>"; platforms += 1; }
						if (app_data.data.platforms.mac) { htmlstring += "<span class='platform_img mac'></span>"; platforms += 1; }
						if (app_data.data.platforms.linux) { htmlstring += "<span class='platform_img linux'></span>"; platforms += 1; }
						
						if (platforms > 1) { htmlstring = "<span class='platform_img steamplay'></span>" + htmlstring; }
                        
						$(node).parent().parent().parent().find(".bottom_controls").append(htmlstring);
					}
				}
			});
		});
        
        if ($(node).parent().parent().parent().html().match(/discount_block_inline/)) {
    		$(node).before("<div id='es_sale_type_" + app + "' style='margin-top: -10px; margin-bottom: -10px; color: #7cb8e4; display: none;'></div>");
			$("#es_sale_type_" + app).load("http://store.steampowered.com/app/" + app + " .game_purchase_discount_countdown:first", function() {
				if ($("#es_sale_type_" + app).html() != "") {
					$("#es_sale_type_" + app).css("display", "block");
				}
			});
		};
	});
}

// If app has a coupon, display message
function display_coupon_message(appid) {

	var coupon_date = getValue(appid + "coupon_valid");
	var coupon_date2 = coupon_date.match(/\[date](.+)\[\/date]/);
	coupon_date = new Date(coupon_date2[1] * 1000);
	
	var coupon_discount_note = getValue(appid + "coupon_discount_note");
	if (coupon_discount_note === null) { coupon_discount_note = ""; }

	$('#game_area_purchase').before($(""+
	"<div class=\"early_access_header\">" +
	"    <div class=\"heading\">" +
	"        <h1 class=\"inset\">" + localized_strings[language].coupon_available + "</h1>" +
    "        <h2 class=\"inset\">" + localized_strings[language].coupon_application_note + "</h2>" +
	"        <p>" + localized_strings[language].coupon_learn_more + "</p>" +
	"    </div>" +
	"    <div class=\"devnotes\">" +
	"        <table border=0>" +
	"            <tr>" +
	"                <td rowspan=3>" +
	"                    <img src=\"http://cdn.steamcommunity.com/economy/image/" + getValue(appid + "coupon_imageurl") + "\"/>" +
	"                </td>" +
	"                <td valign=center>" +
	"                    <h1>" + getValue(appid + "coupon_title") + "</h1>" +
	"                </td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" + coupon_discount_note + "</td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" +
	"                    <font style=\"color:#A75124;\">" + coupon_date + "</font>" +
	"                </td>" +
	"            </tr>" +
	"        </table>" +
	"    </div>" +
	"</div>"));

    var price_div = $("[itemtype=\"http://schema.org/Offer\"]");
	var	cart_id = $(document).find("[name=\"subid\"]")[0].value;
    var actual_price_container = $(price_div).find("[itemprop=\"price\"]").text().trim();
    var original_price = parseFloat(actual_price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1].replace(",", "."));
    var currency_symbol = actual_price_container.match(/(?:R\$|\$|€|£|p??)/)[0];
    var comma = (actual_price_container.indexOf(",") > -1);
    var discounted_price = (original_price - (original_price * getValue(appid + "coupon_discount") / 100).toFixed(2)).toFixed(2);
    
    if (!($(price_div).find(".game_purchase_discount").length > 0 && getValue(appid + "coupon_discount_doesnt_stack"))) {
    	
		if (comma) {
    		currency_symbol = currency_symbol.replace(".", ",");
			discounted_price = discounted_price.replace(".", ",");
		}
        
        var original_price_with_symbol;
    	var discounted_price_with_symbol;
        
        switch (currency_symbol) {
    		case "€":
				original_price_with_symbol = original_price + currency_symbol;
				discounted_price_with_symbol = discounted_price + currency_symbol;
				break;

			case "p??":
				original_price_with_symbol = parseFloat(original_price).toFixed(0) + " " + currency_symbol;
				discounted_price_with_symbol = parseFloat(discounted_price).toFixed(0) + " " + currency_symbol;
				break;

			default:
				original_price_with_symbol = currency_symbol + original_price;
				discounted_price_with_symbol = currency_symbol + discounted_price;
				break;
		}
        
        $(price_div).html("<div class=\"game_purchase_action_bg\">" +
			"    <div class=\"discount_block game_purchase_discount\">" +
			"        <div class=\"discount_pct\">-" + getValue(appid + "coupon_discount") + "%</div>" +
			"        <div class=\"discount_prices\">" +
			"            <div class=\"discount_original_price\">" + escapeHTML(original_price_with_symbol) + "</div>" +
			"            <div class=\"discount_final_price\" itemprop=\"price\">" + escapeHTML(discounted_price_with_symbol) + "</div>" +
			"        </div>" +
			"    </div>" +
			"<div class=\"btn_addtocart\">" +
			"    <div class=\"btn_addtocart_left\"></div>" +
			"        <a class=\"btn_addtocart_content\" href=\"javascript:addToCart( " + escapeHTML(cart_id) + ");\">" + localized_strings[language].add_to_cart + "</a>" +
			"        <div class=\"btn_addtocart_right\"></div>" +
			"    </div>" +
			"</div>");
	}

}

function show_pricing_history(appid, type) {
    if (showpricehistory == true) {
        storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,desura,gog,dotemu,beamdog,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,indiegamestand";

    	// Get country code from Steam cookie
    	var cookies = document.cookie;
    	var matched = cookies.match(/fakeCC=([a-z]{2})/i);
    	var cc = "us";
    	if (matched != null && matched.length == 2) {
    		cc = matched[1];
    	} else {
    		matched = cookies.match(/steamCC(?:_\d+){4}=([a-z]{2})/i);
    		if (matched != null && matched.length == 2) {
    			cc = matched[1];
    		}
    	}
    			
    	get_http("http://api.enhancedsteam.com/pricev2/?search=" + escapeHTML(type) + "/" + escapeHTML(appid) + "&stores=" + storestring + "&cc=" + cc, function (txt) {
            var data = JSON.parse(txt);
            if (data) {
                var activates = "", line1 = "", line2 = "", line3 = "", html, recorded, currency_symbol, comma = false, at_end = false;
					
				switch (data[".meta"]["currency"]) {
    				case "GBP":
						currency_symbol = "£";
						break;
					case "EUR":
						currency_symbol = "€";
						comma = true;
						at_end = true;
						break;
                    case "BRL":
						currency_symbol = "R$ ";
						comma = true;
						break;
					default:
						currency_symbol = "$";
				}
				
                // "Lowest Price"
				if (data["price"]) {
                    if (data["price"]["drm"] == "steam") {
                    	activates = "(<b>Activates on Steam</b>)";
                		if (data["price"]["store"] == "Steam") {
                			activates = "";
                		}
                	}
					
                    line1 = localized_strings[language].lowest_price + ': ' + formatMoney(escapeHTML(data["price"]["price"].toString()), 2, currency_symbol, ",", comma ? "," : ".", at_end) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">Info</a>)';                        
                }
                
                // "Historical Low"
				if (data["lowest"]) {
                    recorded = new Date(data["lowest"]["recorded"]*1000);
                    line2 = localized_strings[language].historical_low + ': ' + formatMoney(escapeHTML(data["lowest"]["price"].toString()), 2, currency_symbol, ",", comma ? "," : ".", at_end) + ' at ' + escapeHTML(data["lowest"]["store"].toString()) + ' on ' + recorded.toDateString() + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">Info</a>)';
                }

                var html = "<div class='game_purchase_area_friends_want' style='padding-top: 5px; height: 35px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -9px;'><img src='http://www.enhancedsteam.com/firefox/line_chart.png'></div>";

    			// "Number of times this game has been in a bundle"
				if (data["bundles"]["count"] > 0) {
					line3 = "<br>" + localized_strings[language].bundle.bundle_count + ": " + data["bundles"]["count"] + ' (<a href="' + escapeHTML(data["urls"]["bundle_history"].toString()) + '" target="_blank">Info</a>)';					
					html = "<div class='game_purchase_area_friends_want' style='padding-top: 5px; height: 50px; border-top: 1px solid #4d4b49; border-left: 1px solid #4d4b49; border-right: 1px solid #4d4b49;' id='enhancedsteam_lowest_price'><div class='gift_icon' style='margin-top: -4px;'><img src='http://www.enhancedsteam.com/firefox/line_chart.png'></div>";
				}
                
                if (line1 && line2) {
                    $("#game_area_purchase").before(html + line1 + "<br>" + line2 + line3);
                }    
                
                if (data["bundles"]["active"].length > 0) {
					var length = data["bundles"]["active"].length;
					for (var i = 0; i < length; i++) {
						var enddate = new Date(data["bundles"]["active"][i]["expiry"]*1000);
						var currentdate = new Date().getTime();
						if (currentdate < enddate) {
							purchase = '<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings[language].buy + ' ' + escapeHTML(data["bundles"]["active"][i]["page"]) + ' ' + escapeHTML(data["bundles"]["active"][i]["title"]) + '</h1>';
							purchase += '<p class="game_purchase_discount_countdown">' + localized_strings[language].bundle.offer_ends + ' ' + enddate + '</p>';							
							purchase += '<p class="package_contents"><b>' + localized_strings[language].bundle.includes.replace("(__num__)", data["bundles"]["active"][i]["games"].length) + ':</b> '
							data["bundles"]["active"][i]["games"].forEach(function(entry) {
								purchase += entry + ", ";
							});
							purchase = purchase.replace(/, $/, "");
							purchase += '</p><div class="game_purchase_action"><div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="' + escapeHTML(data["bundles"]["active"][i]["details"]) + '" target="_blank">' + localized_strings[language].bundle.info + '</a><div class="btn_addtocart_right"></div></div></div><div class="game_purchase_action_bg">';
							if (data["bundles"]["active"][i]["pwyw"] == 0) { if (data["bundles"]["active"][i]["price"] > 0) { purchase += '<div class="game_purchase_price price" itemprop="price">' + formatMoney(escapeHTML(data["bundles"]["active"][i]["price"].toString()), 2, currency_symbol, ",", comma ? "," : ".", at_end) + '</div>'; } }
							purchase += '<div class="btn_addtocart"><div class="btn_addtocart_left"></div>';
							purchase += '<a class="btn_addtocart_content" href="' + escapeHTML(data["bundles"]["active"][i]["url"]) + '" target="_blank">';
							if (data["bundles"]["active"][i]["pwyw"] == 1) {
								purchase += localized_strings[language].bundle.pwyw;
							} else {
								purchase += localized_strings[language].buy;
							}	
							purchase += '</a><div class="btn_addtocart_right"></div></div></div></div></div></div>';
							$("#game_area_purchase").after(purchase);
						}
					}
					$("#game_area_purchase").after("<h2 class='gradientbg'>" + localized_strings[language].bundle.header + " <img src='http://cdn3.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>");
				}
            }
    	});
    }
}

function add_hltb_info(appid) {
    if (showhltb == true) {
    	get_http("http://api.enhancedsteam.com/hltb/?appid=" + appid, function (txt) {
    		if (txt.length > 0) {
    			var data = JSON.parse(txt);
    			if (data["hltb"]) {
    				xpath_each("//div[contains(@class,'game_details')]", function (node) {					
    						$(node).after("<div class='block game_details underlined_links'>"
									+ "<div class='block_header'><h4>How Long to Beat</h4></div>"
									+ "<div class='block_content'><div class='block_content_inner'><div class='details_block'>"
									+ "<b>Main Story:</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_story']) + "</span><br>"
									+ "<b>Main+Extras:</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_extras']) + "</span><br>"
									+ "<b>Completionist:</b><span style='float: right;'>" + escapeHTML(data['hltb']['comp']) + "</span><br>"
									+ "</div>"
									+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['url']) + "' target='_blank'><div class='rightblock'><img src='http://cdn2.store.steampowered.com/public/images/ico/link_web.gif' width='16' height='16' border='0' align='top' /></div>More Information <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
									+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['submit_url']) + "' target='_blank'><div class='rightblock'><img src='http://cdn3.store.steampowered.com/public/images/ico/link_news.gif' width='16' height='16' border='0' align='top' /></div>Submit Your Time <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
									+ "</div></div></div>");
    				});
    			}
    		}
    	});	
    }
}

function add_pcgamingwiki_link(appid) {
	if (showpcgw == true) {
        get_http("http://api.enhancedsteam.com/pcgw/?appid=" + appid, function (txt) {
    		if (txt.length > 0) {
    			var gamename = txt.match(/results":{"(.+)":{/)[1];
    			var data = JSON.parse(txt);
    			var url = escapeHTML(data["results"][gamename]["fullurl"]);
    			$('#demo_block').find('.block_content_inner').prepend('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="' + url + '" style="background-image:url( http://www.enhancedsteam.com/firefox/pcgw.png )">' + localized_strings[language].wiki_article.replace("__pcgw__","PC Gaming Wiki") + '</a></div>');
    		}
    	});
	}
}

function add_widescreen_certification(appid) {
    if (showwsgf == true) {
        if (document.URL.indexOf("store.steampowered.com/app/") >= 0) {    
        	if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) { 
        		// check to see if game data exists
                get_http("http://api.enhancedsteam.com/wsgf/?appid=" + appid, function (txt) {
        			found = 0;
        			xpath_each("//div[contains(@class,'game_details')]", function (node) {
        				if (found == 0) {						
        					var data = JSON.parse(txt);
                            if (data["node"]) {
                        		var path = data["node"]["Path"];
    							var wsg = data["node"]["WideScreenGrade"];
								var mmg = data["node"]["MultiMonitorGrade"];
								var fkg = data["node"]["FourKGrade"];
								var uws = data["node"]["UltraWideScreenGrade"];
								var wsg_icon = "", wsg_text = "", mmg_icon = "", mmg_text = "";
								var fkg_icon = "", fkg_text = "", uws_icon = "", uws_text = "";
                                
                                switch (wsg) {
    								case "A":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-gold.png";
										wsg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Widescreen");
										break;
									case "B":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-silver.png";
										wsg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Widescreen");
										break;
									case "C":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-limited.png";
										wsg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Widescreen");
										break;
									case "Incomplete":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-incomplete.png";
										wsg_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										wsg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_ws-unsupported.png";
										wsg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Widescreen");
										break;
								}

								switch (mmg) {
									case "A":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-gold.png";
										mmg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Multi-Monitor"); 
										break;
									case "B":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-silver.png";
										mmg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Multi-Monitor");
										break;
									case "C":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-limited.png";
										mmg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Multi-Monitor");
										break;
									case "Incomplete":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-incomplete.png";
										mmg_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										mmg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_mm-unsupported.png";
										mmg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Multi-Monitor");
										break;
								}
								
								switch (uws) {
									case "A":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-gold.png";
										uws_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "Ultra-Widescreen");
										break;
									case "B":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-silver.png";
										uws_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "Ultra-Widescreen");
										break;
									case "C":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-limited.png";
										uws_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "Ultra-Widescreen");
										break;
									case "Incomplete":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-incomplete.png";
										uws_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										uws_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_uw-unsupported.png";
										uws_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen");
										break;
								}
								
								switch (fkg) {
									case "A":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-gold.png";
										fkg_text = localized_strings[language].wsgf.gold.replace(/__type__/g, "4k UHD");
										break;
									case "B":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-silver.png";
										fkg_text = localized_strings[language].wsgf.silver.replace(/__type__/g, "4k UHD");
										break;
									case "C":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-limited.png";
										fkg_text = localized_strings[language].wsgf.limited.replace(/__type__/g, "4k UHD");
										break;
									case "Incomplete":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-incomplete.png";
										fkg_text = localized_strings[language].wsgf.incomplete;
										break;
									case "Unsupported":
										fkg_icon = "http://www.enhancedsteam.com/gamedata/icons/wsgf_4k-unsupported.png";
										fkg_text = localized_strings[language].wsgf.unsupported.replace(/__type__/g, "4k UHD");
										break;
								}
                                
                                var html = "<div class='block underlined_links'><div class='block_header'><h4>WSGF Widescreen Certifications</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'><center>";
    							
								if (wsg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(wsg_icon) + "' height='120' title='" + escapeHTML(wsg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (mmg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(mmg_icon) + "' height='120' title='" + escapeHTML(mmg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (uws != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(uws_icon) + "' height='120' title='" + escapeHTML(uws_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (fkg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(fkg_icon) + "' height='120' title='" + escapeHTML(fkg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
								if (path) { html += "</center><br><a class='linkbar' target='_blank' href='" + escapeHTML(path) + "'><div class='rightblock'><img src='http://cdn2.store.steampowered.com/public/images/ico/link_web.gif' width='16' height='16' border='0' align='top'></div>" + localized_strings[language].rating_details + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"; }
								html += "</div></div></div></div>";
								$(node).after(html);
                            }
        					found = 1;
        				}
        			});
        		});	
        	}	
        }
    }
}

function add_dlc_page_link(appid) {    
	if ($(".game_area_dlc_section").length > 0) {
		var html = $(".game_area_dlc_section").html();
		title = html.match(/<h2 class=\"gradientbg">(.+)<\/h2>/)[1];
		html = html.replace(title, "<a href='http://store.steampowered.com/dlc/" + escapeHTML(appid) + "'>" + escapeHTML(title) + "</a>");		
		$(".game_area_dlc_section").html(html);
	}
}

function dlc_data_for_dlc_page() {    
	var appid_deferred = [];
	var totalunowned = 0;
	var addunowned = "<form name=\"add_all_unowned_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\"><input type=\"hidden\" name=\"action\" value=\"add_to_cart\">";
	
	$.each($("div.dlc_page_purchase_dlc"), function(j, node){
		var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
		get_http("http://api.enhancedsteam.com/gamedata/?appid=" + appid, function (txt) {
    		var data;
			if (txt != "{\"dlc\":}}") {
				data = JSON.parse(txt);
			}
            var html = "<div style='width: 250px; margin-left: 310px;'>";

            if (data) {
                $.each(data["dlc"], function(index, value) {
                    html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><div class='name'><span title='" + escapeHTML(value['text']) + "'>" + escapeHTML(index) + "</span></div></div>";
                });
			}

			html += "</div>";
			
			$(node).css("height", "144px");
			$(node).append(html);
    	});	
	});
}

function add_app_badge_progress(appid) {
	if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
		$(".communitylink .block_content:last").append("<div class='rule'></div><div class='block_content_inner'><link rel='stylesheet' type='text/css' href='http://cdn.steamcommunity.com/public/css/skin_1/badges.css'><div class='es_badge_progress'></div><div class='es_foil_badge_progress'></div></div><div style=\"clear: both\"></div>");
		$(".es_badge_progress").load("http://steamcommunity.com/my/gamecards/" + appid + "/ .badge_current", function(responseText) {
			if ($(responseText).find(".friendPlayerLevelNum").length != 1) {
				var card_num_owned = $(responseText).find(".badge_detail_tasks .owned").length;
				var card_num_total = $(responseText).find(".badge_detail_tasks .badge_card_set_card").length;
				var progress_text_length = $(responseText).find(".gamecard_badge_progress").text().trim().length;
				var next_level_empty_badge = $(responseText).find(".gamecard_badge_progress .badge_info").length;
				var show_card_num;
				var badge_completed;
				if(progress_text_length>0&&next_level_empty_badge==0){
					badge_completed=true;
				}
				if((card_num_owned>0&&progress_text_length==0)||(card_num_owned>0&&!badge_completed)){
					show_card_num=true;
				}
				if (badge_completed){
					$(".es_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + escapeHTML(appid) + "/'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].view_badge + "</a>");
				} else {
					$(".es_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + escapeHTML(appid) + "/'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].badge_progress + "</a>");
				}
				if(show_card_num){
					$(".es_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 2px; color: #5491cf;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
				}
				$(".es_badge_progress").after("<div style='padding-top: 10px; padding-bottom: 2px; color: #5491cf;'>" + escapeHTML($(responseText).find(".progress_info_bold").text()) + "</div>");
				$(".es_badge_progress").after("<div style=\"clear: both\"></div>");
				$(".es_badge_progress .badge_info_description").css({"width":"275px"});
				$(".es_badge_progress .badge_empty_circle").css({"margin":"0px 46px 14px 8px","border-radius":"46px"});
				$(".es_badge_progress .badge_empty_right div:last-child").remove();
				$(".es_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + localized_strings[language].badge_not_unlocked + "</div>").append("<div style=\"clear: both\"></div>");
			} else {
				$(".es_badge_progress").remove();
				$(".communitylink .rule:last").remove();
			}
		});
		$(".es_foil_badge_progress").load("http://steamcommunity.com/my/gamecards/" + appid + "/?border=1 .badge_current", function(responseText) {
			if ($(responseText).find(".friendPlayerLevelNum").length != 1) {
				var card_num_owned = $(responseText).find(".badge_detail_tasks .owned").length;
				var card_num_total = $(responseText).find(".badge_detail_tasks .badge_card_set_card").length;
				var progress_text_length = $(responseText).find(".gamecard_badge_progress").text().trim().length;
				var next_level_empty_badge = $(responseText).find(".gamecard_badge_progress .badge_info").length;
				var show_card_num;
				var badge_completed;
				if(progress_text_length>0&&next_level_empty_badge==0){
					badge_completed=true;
				}
				if((card_num_owned>0&&progress_text_length==0)||(card_num_owned>0&&!badge_completed)){
					show_card_num=true;
				}
				if ($(responseText).find(".badge_empty_circle").length != 1||card_num_owned>0) {
					$(".es_foil_badge_progress .badge_info_description").css({"width":"275px"});
					$(".es_foil_badge_progress .badge_empty_circle").css({"margin":"0px 46px 14px 8px","border-radius":"46px"});
					$(".es_foil_badge_progress .badge_empty_right div:last-child").remove();
					$(".es_foil_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + localized_strings[language].badge_not_unlocked + "</div>")
					if (badge_completed){
						$(".es_foil_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + escapeHTML(appid) + "/?border=1'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].view_badge_foil + "</a>");
					}
					else {
						$(".es_foil_badge_progress").after("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + escapeHTML(appid) + "/?border=1'><div class='rightblock'><img src='http://cdn4.store.steampowered.com/public/images/ico/ico_cards.png' width=24 height=16 border=0 align=top></div>" + localized_strings[language].badge_foil_progress + "</a>");
					}
					if(show_card_num){
						$(".es_foil_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 2px; color: #5491cf;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
					}
					$(".es_foil_badge_progress").after("<div style=\"clear: both\"></div>");
				} else {
					$(".es_foil_badge_progress").remove();
				}
			} else {
				$(".es_foil_badge_progress").remove();
			}
		});
	}
}

// adds metacritic user score
function add_metracritic_userscore() {
    if (showmcus === true) {
        var metahtml = document.getElementById("game_area_metascore");
        var metauserscore = 0;
        if (metahtml) {
        	var metalink = document.getElementById("game_area_metalink");
        	meta = metalink.getElementsByTagName("a");
        	for (var i = 0; i < meta.length; i++)
        	var meta_real_link = meta[i].href;
        	get_http("http://api.enhancedsteam.com/metacritic/?mcurl=" + meta_real_link, function (txt) {
        		metauserscore = escapeHTML(txt);
        		metauserscore = metauserscore.replace(".","");		
        		var newmeta = '<div id="game_area_metascore" style="background-image: url(http://www.enhancedsteam.com/firefox/metacritic_user_bg.png);"><div id="metapage">' + escapeHTML(metauserscore) + '</div></div>';
        		$("#game_area_metascore").after(newmeta);
        	});
        }
    }
}

function subscription_savings_check() {
    var not_owned_games_prices = 0,
		appid_info_deferreds = [],
		sub_apps = [],
		sub_app_prices = {},
		comma,
		currency_symbol,
		symbol_right;

	// For each app, load its info.
	$.each($(".tab_row"), function (i, node) {
		var appid = get_appid(node.querySelector("a").href),
			// Remove children, leaving only text (price or only discounted price, if there are discounts)
			price_container = $(node).find(".tab_price").children().remove().end().text().trim();

		if (price_container !== "N/A") {
			if (price_container) {
				if (price_container !== "Free") {
					itemPrice = parseFloat(price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1].replace(",", "."));
					if (!currency_symbol) currency_symbol = price_container.match(/(?:R\$|\$|€|£|pуб)/)[0];
				}	

				switch (currency_symbol) {
					case "€":
						symbol_right = true;
						break;
					case "pуб":
						symbol_right = true;
						break;
				}

				if (!comma) comma = (price_container.indexOf(",") > -1);
			} else {
				itemPrice = 0;
			}
		} else {
			itemPrice = 0;
		}        

		// Batch app ids, checking for existing promises, then do this.
		ensure_appid_deferred(appid);

		appid_info_deferreds.push(appid_promises[appid].promise);

		sub_apps.push(appid);
		sub_app_prices[appid] = itemPrice;

	});

	// When we have all the app info
	$.when.apply(null, appid_info_deferreds).done(function() {
		for (var i = 0; i < sub_apps.length; i++) {
			if (!getValue(sub_apps[i] + "owned")) not_owned_games_prices += sub_app_prices[sub_apps[i]];
		}
		var $bundle_price = $(".discount_final_price");
		if ($bundle_price.length === 0) $bundle_price = $(".game_purchase_price");

        var bundle_price = $($bundle_price).html();
        bundle_price = bundle_price.replace(/[^0-9\.]+/g,"");
        bundle_price = parseFloat(bundle_price);        
		if (comma) { not_owned_games_prices = not_owned_games_prices * 100; }
                
		var corrected_price = not_owned_games_prices - bundle_price;
		
		if (symbol_right) {
			var $message = $('<div class="savings">' + formatMoney((comma ? corrected_price / 100 : corrected_price), 2, currency_symbol, ",", comma ? "," : ".", true) + '</div>');
		} else {
			var $message = $('<div class="savings">' + formatMoney((comma ? corrected_price / 100 : corrected_price), 2, currency_symbol, ",", comma ? "," : ".") + '</div>');
		}
		if (corrected_price < 0) $message[0].style.color = "red";

		$('.savings').replaceWith($message);
	});
}

// pull DLC gamedata from enhancedsteam.com
function dlc_data_from_site(appid) {
    if ($("div.game_area_dlc_bubble").length > 0) {
        var appname = $(".apphub_AppName").html();
		appname = appname.replace("&amp;", "and");
		appname = appname.replace("\"", "");
		appname = appname.replace("“", "");		
		get_http("http://www.enhancedsteam.com/gamedata/gamedata-firefox.php?appid=" + appid + "&appname=" + appname, function (txt) {
    		var data = JSON.parse(txt);
            var html = "<div class='block'><div class='block_header'><h4>Downloadable Content Details</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'>";
            
            if (data) {
                $.each(data["dlc"], function(index, value) {
                    html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><div class='name'><span title='" + escapeHTML(value['text']) + "'>" + escapeHTML(index) + "</span></div></div>";
                });
                
                html += "</div><a class='linkbar' href='http://www.enhancedsteam.com/gamedata/dlc_category_suggest.php?appid=" + escapeHTML(appid) + "&appname=" + escapeHTML(appname) + "' target='_blank'>Suggest a new category</a></div></div></div>";
                
                $("#demo_block").after(html);
            }    
    	});
    }
}

function add_market_total() {
    if (showmarkethistory === true) {
        if (window.location.pathname.match(/^\/market\/$/)) {
        	$("#moreInfo").before('<div id="es_summary"><div class="market_search_sidebar_contents"><h2 class="market_section_title">Market Transactions</h2><div class="market_search_game_button_group" id="es_market_summary" style="width: 238px"><img src="http://cdn.steamcommunity.com/public/images/login/throbber.gif">Loading...</div></div></div>');
        	
        	// Get market transactions
        	get_http("http://steamcommunity.com/market/myhistory/render/?query=&start=0&count=9999999999", function (txt) {
        		var data = JSON.parse(txt);
        		market = data['results_html'];		
        		var currency_symbol = "";
        		
        		totaler = function (p, i) {			
        			var priceContainer = $(p).find(".market_listing_price");
        			if (priceContainer.length > 0) {
        				if (p.innerHTML.match(/\+.+<\/div>/)) {
        					var priceText = $(priceContainer).text().trim();
        					priceText = escapeHTML(priceText);
        					
        					currency_symbol = priceText.match(/(?:R\$|\$|€|£|pуб)/)[0];
        					
        					var regex = /(\d+[.,]\d\d+)/,
        						price = regex.exec(priceText);
        					
        					if (price !== null && price !== "Total") {
        						var tempprice = price[0].toString();
        						tempprice = tempprice.replace(",", ".");
        						return parseFloat(tempprice);
        					}
        				}
        			}			
        		};
        		
        		usd_totaler = function (p, i) {			
        			var priceContainer = $(p).find(".market_listing_price");
        			if (priceContainer.length > 0) {
        				if (p.innerHTML.match(/-.+<\/div>/)) {
        					var priceText = $(priceContainer).text().trim();
        					var regex = /(\d+[.,]\d\d+)/,
        						price = regex.exec(priceText);

        					priceText = escapeHTML(priceText);
        					
        					if (priceText.match(/^\$/)) {
        						if (price !== null && price !== "Total") {
        							var tempprice = price[0].toString();
        							tempprice = tempprice.replace(",", ".");
        							return parseFloat(tempprice);
        						}
        					}
        				}
        			}
        		};
        		
        		gbp_totaler = function (p, i) {			
        			var priceContainer = $(p).find(".market_listing_price");
        			if (priceContainer.length > 0) {
        				if (p.innerHTML.match(/-.+<\/div>/)) {
        					var priceText = $(priceContainer).text().trim();
        					var regex = /(\d+[.,]\d\d+)/,
        						price = regex.exec(priceText);

        					priceText = escapeHTML(priceText);
        					
        					if (priceText.match(/^£/)) {
        						if (price !== null && price !== "Total") {
        							var tempprice = price[0].toString();
        							tempprice = tempprice.replace(",", ".");
        							return parseFloat(tempprice);
        						}
        					}
        				}
        			}
        		};
        		
        		eur_totaler = function (p, i) {			
        			var priceContainer = $(p).find(".market_listing_price");
        			if (priceContainer.length > 0) {
        				if (p.innerHTML.match(/-.+<\/div>/)) {
        					var priceText = $(priceContainer).text().trim();
        					var regex = /(\d+[.,]\d\d+)/,
        						price = regex.exec(priceText);

        					priceText = escapeHTML(priceText);
        					
        					if (priceText.match(/€/)) {
        						if (price !== null && price !== "Total") {
        							var tempprice = price[0].toString();
        							tempprice = tempprice.replace(",", ".");
        							return parseFloat(tempprice);
        						}
        					}
        				}
        			}
        		};
        		
        		rub_totaler = function (p, i) {			
        			var priceContainer = $(p).find(".market_listing_price");
        			if (priceContainer.length > 0) {
        				if (p.innerHTML.match(/-.+<\/div>/)) {
        					var priceText = $(priceContainer).text().trim();
        					var regex = /(\d+[.,]\d\d+)/,
        						price = regex.exec(priceText);

        					priceText = escapeHTML(priceText);
        					
        					if (priceText.match(/pуб/)) {
        						if (price !== null && price !== "Total") {
        							var tempprice = price[0].toString();
        							tempprice = tempprice.replace(",", ".");
        							return parseFloat(tempprice);
        						}
        					}
        				}
        			}
        		};
        		
        		brl_totaler = function (p, i) {			
        			var priceContainer = $(p).find(".market_listing_price");
        			if (priceContainer.length > 0) {
        				if (p.innerHTML.match(/-.+<\/div>/)) {
        					var priceText = $(priceContainer).text().trim();
        					var regex = /(\d+[.,]\d\d+)/,
        						price = regex.exec(priceText);
        					
        					priceText = escapeHTML(priceText);

        					if (priceText.match(/^R\$/)) {
        						if (price !== null && price !== "Total") {
        							var tempprice = price[0].toString();
        							tempprice = tempprice.replace(",", ".");
        							return parseFloat(tempprice);
        						}
        					}
        				}
        			}
        		};
        		
        		pur_prices = jQuery.map($(market), totaler);
        		usd_prices = jQuery.map($(market), usd_totaler);
        		gbp_prices = jQuery.map($(market), gbp_totaler);
        		eur_prices = jQuery.map($(market), eur_totaler);
        		rub_prices = jQuery.map($(market), rub_totaler);
        		brl_prices = jQuery.map($(market), brl_totaler);
        		
        		var pur_total = 0.0;
        		var usd_total = 0.0;
        		var gbp_total = 0.0;
        		var eur_total = 0.0;
        		var rub_total = 0.0;
        		var brl_total = 0.0;		
        		
        		jQuery.map(pur_prices, function (p, i) { pur_total += p; });
        		jQuery.map(usd_prices, function (p, i) { usd_total += p; });
        		jQuery.map(gbp_prices, function (p, i) { gbp_total += p; });
        		jQuery.map(eur_prices, function (p, i) { eur_total += p; });
        		jQuery.map(rub_prices, function (p, i) { rub_total += p; });
        		jQuery.map(brl_prices, function (p, i) { brl_total += p; });
        		
        		switch (currency_symbol) {
        			case "€":
        				get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=eur", function (txt) {
        					txt = escapeHTML(txt);
                            var net = txt - pur_total;
        					
        					var html = "Purchase total:<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ".", ",", true) + "</span><br>";
        					html += "Sales total:<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ".", ",", true) + "</span><br>";
        					if (net > 0) {
        						html += "Net gain:<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
        					} else {
        						html += "Net spent:<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
        					}
        					
        					$("#es_market_summary").html(html);
        				});
        				break;
        
        			case "pуб":
        				get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=rub", function (txt) {
        					txt = escapeHTML(txt);
        					var net = txt - pur_total;
        					
        					var html = "Purchase total:<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ".", ",", true) + "</span><br>";
        					html += "Sales total:<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ".", ",", true) + "</span><br>";
        					if (net > 0) {
        						html += "Net gain:<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
        					} else {
        						html += "Net spent:<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ".", ",", true) + "</span>";
        					}
        					
        					$("#es_market_summary").html(html);
        				});
        				break;
        
        			case "£":
        				get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=gbp", function (txt) {
        					txt = escapeHTML(txt);
        					var net = txt - pur_total;
        					
        					var html = "Purchase total:<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ",", ".", false) + "</span><br>";
        					html += "Sales total:<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ",", ".", false) + "</span><br>";
        					if (net > 0) {
        						html += "Net gain:<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
        					} else {
        						html += "Net spent:<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
        					}
        					
        					$("#es_market_summary").html(html);
        				});
        				break;				
        
        			case "R$":
        				get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=brl", function (txt) {
        					txt = escapeHTML(txt);
        					var net = txt - pur_total;
        					
        					var html = "Purchase total:<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ",", ".", false) + "</span><br>";
        					html += "Sales total:<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ",", ".", false) + "</span><br>";
        					if (net > 0) {
        						html += "Net gain:<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
        					} else {
        						html += "Net spent:<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
        					}
        					
        					$("#es_market_summary").html(html);
        				});
        				break;
        				
        			default:
        				get_http("http://api.enhancedsteam.com/currency/?usd=" + usd_total + "&gbp=" + gbp_total + "&eur=" + eur_total + "&rub=" + rub_total + "$brl=" + brl_total + "&local=usd", function (txt) {
        					txt = escapeHTML(txt);
        					var net = txt - pur_total;
        					
        					var html = "Purchase total:<span style='float: right;'>" + formatMoney(parseFloat(pur_total), 2, currency_symbol, ",", ".", false) + "</span><br>";
        					html += "Sales total:<span style='float: right;'>" + formatMoney(parseFloat(txt), 2, currency_symbol, ",", ".", false) + "</span><br>";
        					if (net > 0) {
        						html += "Net gain:<span style='float: right; color: green;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
        					} else {
        						html += "Net spent:<span style='float: right; color: red;'>" + formatMoney(parseFloat(net), 2, currency_symbol, ",", ".", false) + "</span>";
        					}
        					
        					$("#es_market_summary").html(html);
        				});
        				break;
        		}
    	    });
        }
    }
}

function add_active_total() {
    if (window.location.pathname.match(/^\/market\/$/)) {
		if ($(".market_listing_table_message").length == 0) {
			var total = 0;
			
			$(".market_listing_row").find(".market_listing_my_price").each(function() {
				total += Number($(this).find(".market_listing_price").text().trim().replace(/[^0-9\.]+/g,""));
				currency_symbol = $(this).find(".market_listing_price").text().trim().match(/(?:R\$|\$|€|£|pуб)/)[0];
			});
			
			switch (currency_symbol) {
				case "pуб":
				case "€":
					total = formatMoney(parseFloat(total), 2, escapeHTML(currency_symbol), ".", ",", true);
					break;
				default:
					total = formatMoney(parseFloat(total), 2, escapeHTML(currency_symbol), ",", ".", false);
					break;
			}
			
			$(".my_listing_section").append("<div class='market_listing_row market_recent_listing_row'><div class='market_listing_right_cell market_listing_edit_buttons'></div><div class='market_listing_right_cell market_listing_my_price'><span><span class='market_listing_price'><b>" + escapeHTML(total) + "</b></span><br><span class='market_listing_item_name'>" + localized_strings[language].sales_total + "</span></span></div></div>");
		}
	}
}

function account_total_spent() {
    if (showtotal === true) {
        if ($('.transactionRow').length !== 0) {
    		var currency_symbol = $(".accountBalance").html();
    		currency_symbol = currency_symbol.match(/(?:R\$|\$|€|£|pуб)/)[0];
    
    		totaler = function (p, i) {
    			if (p.innerHTML.indexOf("class=\"transactionRowEvent walletcredit\">") < 0) {
    				var priceContainer = $(p).find(".transactionRowPrice");
    				if (priceContainer.length > 0) {
    					var priceText = $(priceContainer).text();
    					var regex = /(\d+[.,]\d\d+)/,
    						price = regex.exec(priceText);
    
    					if (price !== null && price !== "Total") {
    						var tempprice = price[0].toString();
    						tempprice = tempprice.replace(",", ".");
    						return parseFloat(tempprice);
    					}
    				}
    			}
    		};
    
    		game_prices = jQuery.map($('#store_transactions .transactionRow'), totaler);
    		ingame_prices = jQuery.map($('#ingame_transactions .transactionRow'), totaler);
    		market_prices = jQuery.map($('#market_transactions .transactionRow'), totaler);
    
    		var game_total = 0.0;
    		var ingame_total = 0.0;
    		var market_total = 0.0;
    		jQuery.map(game_prices, function (p, i) { game_total += p; });
    		jQuery.map(ingame_prices, function (p, i) { ingame_total += p; });
    		jQuery.map(market_prices, function (p, i) { market_total += p; });
    
    		total_total = game_total + ingame_total + market_total;
    
    		if (currency_symbol) {
    			switch (currency_symbol) {
    				case "€":
    					game_total = formatMoney(parseFloat(game_total), 2, currency_symbol, ",", ",", true)
    					ingame_total = formatMoney(parseFloat(ingame_total), 2, currency_symbol, ",", ",", true)
    					market_total = formatMoney(parseFloat(market_total), 2, currency_symbol, ",", ",", true)
    					total_total = formatMoney(parseFloat(total_total), 2, currency_symbol, ",", ",", true)
    					break;
    
    				case "pуб":
    					currency_symbol = " " + currency_symbol;
    					game_total = formatMoney(parseFloat(game_total), 2, currency_symbol, ",", ",", true)
    					ingame_total = formatMoney(parseFloat(ingame_total), 2, currency_symbol, ",", ",", true)
    					market_total = formatMoney(parseFloat(market_total), 2, currency_symbol, ",", ",", true)
    					total_total = formatMoney(parseFloat(total_total), 2, currency_symbol, ",", ",", true)
    					break;
    
    				default:
    					game_total = formatMoney(parseFloat(game_total), 2, currency_symbol, ",", ".", false)
    					ingame_total = formatMoney(parseFloat(ingame_total), 2, currency_symbol, ",", ".", false)
    					market_total = formatMoney(parseFloat(market_total), 2, currency_symbol, ",", ".", false)
    					total_total = formatMoney(parseFloat(total_total), 2, currency_symbol, ",", ".", false)
    					break;
    			}
    
    			var html = '<div class="accountRow accountBalance accountSpent">';
    			html += '<div class="accountData price">' + escapeHTML(game_total) + '</div>';
    			html += '<div class="accountLabel">Store Transactions:</div></div>';
    			html += '<div class="accountRow accountBalance accountSpent">';
    			html += '<div class="accountData price">' + escapeHTML(ingame_total) + '</div>';
    			html += '<div class="accountLabel">Game Transactions:</div></div>';
    			html += '<div class="accountRow accountBalance accountSpent">';
    			html += '<div class="accountData price">' + escapeHTML(market_total) + '</div>';
    			html += '<div class="accountLabel">Market Transactions:</div></div>';
    			html += '<div class="inner_rule"></div>';
    			html += '<div class="accountRow accountBalance accountSpent">';
    			html += '<div class="accountData price">' + escapeHTML(total_total) + '</div>';
    			html += '<div class="accountLabel">Total Spent:</div></div>';
    			html += '<div class="inner_rule"></div>';
    
    			$('.accountInfoBlock .block_content_inner .accountBalance').before(html);
    		}
    	}
    }
}

function load_inventory_market_prices(appid, item, item_name, global_id) {
    var url;
	function html_characters(str){
		return str.replace(/ /g,"%20").replace(/#/g,"%23").replace(/&/g,"&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
	}
	if (global_id == 753) {
		url = "http://steamcommunity.com/market/listings/" + global_id + "/" + appid + "-" + html_characters(item_name);
	} else {
		url = "http://steamcommunity.com/market/listings/" + global_id + "/" + html_characters(item_name);
	}
	get_http(url, function (txt) {
		var item_price = txt.match(/<span class="market_listing_price market_listing_price_with_fee">\r\n(.+)<\/span>/);
		switch (item) {
			case 0:
				if (item_price) { $("#es_item0").html(localized_strings[language].lowest_price + " for " + item_name + ": " + item_price[1].trim() + "<br><a href='" + url + "' target='_blank' class='btn_grey_grey btn_medium'><span>" + localized_strings[language].view_marketplace + "</span></a>");
				} else { $("#es_item0").html(localized_strings[language].no_results_found); }
				break;
			case 1:
				if (item_price) { $("#es_item1").html(localized_strings[language].lowest_price + " for " + item_name + ": " + item_price[1].trim() + "<br><a href='" + url + "' target='_blank' class='btn_grey_grey btn_medium'><span>" + localized_strings[language].view_marketplace + "</span></a>");
				} else { $("#es_item1").html(localized_strings[language].no_results_found); }
				break;
		}
	});
}

function inventory_market_prepare() {
	$(".itemHolder").bind("click", function() {
		window.setTimeout(function() {
		    if ($('#es_item0').length == 0) { $("#iteminfo0_item_market_actions").after("<div class=item_market_actions id=es_item0 height=10></div>"); }
			if ($('#es_item1').length == 0) { $("#iteminfo1_item_market_actions").after("<div class=item_market_actions id=es_item1 height=10></div>"); }
			$('#es_item0').html("");
			$('#es_item1').html("");

			var desc, appid, item, item_name, game_name, global_id;

			if($('#iteminfo0').css("display") == "block") {	desc = $('#iteminfo0_item_tags_content').html(); item = 0; }
			else { desc = $('#iteminfo1_item_tags_content').html();	item = 1; }

			if (desc.match(/Not Marketable/)) {	$('#es_item0').remove(); $('#es_item1').remove(); return; }

			global_id = $(".games_list_tab.active")[0].outerHTML.match(/href="\#(\d+)"/)[1];

			switch (item) {
				case 0:
					$("#es_item0").html("<img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'>"+ localized_strings[language].loading);
					item_name = $("#iteminfo0_item_name").html();
					game_name = $("#iteminfo0_item_tags_content").text().split(",")[1];
					switch (global_id) {
						case "753":
							if ($('#iteminfo0_item_owner_actions').html() != "") {
								appid = $('#iteminfo0_item_owner_actions').html().match(/(steamcommunity.com\/my\/gamecards\/|OpenBooster\( )(\d+)(, '|\/)/)[2];
								load_inventory_market_prices(appid, item, item_name, global_id);
							} else {
								get_http("http://store.steampowered.com/search/?term=" + game_name, function (txt) {
									appid = (get_appid(txt.match(/<a href="(.+)" class="search_result_row/)[1]));
									load_inventory_market_prices(appid, item, item_name, global_id);
								});
							}
							break;
						case "730":
							var condition = $("#iteminfo0_item_descriptors .descriptor:contains('Exterior')").text().replace(/Exterior\: /, "");
							if (condition) item_name += " (" + condition + ")";
						default:
							load_inventory_market_prices("0", item, item_name, global_id);
							break;
					}
					break;
				case 1:
					$("#es_item1").html("<img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'>"+ localized_strings[language].loading);
					item_name = $("#iteminfo1_item_name").html();
					game_name = $("#iteminfo1_item_tags_content").text().split(",")[1];
					switch (global_id) {
						case "753":
							if ($('#iteminfo1_item_owner_actions').html() != "") {
								appid = $('#iteminfo1_item_owner_actions').html().match(/(steamcommunity.com\/my\/gamecards\/|OpenBooster\( )(\d+)(, '|\/)/)[2];
								load_inventory_market_prices(appid, item, item_name, global_id);
							} else {
								get_http("http://store.steampowered.com/search/?term=" + game_name, function (txt) {
									appid = (get_appid(txt.match(/<a href="(.+)" class="search_result_row/)[1]));
									load_inventory_market_prices(appid, item, item_name, global_id);
								});
							}
							break;
						case "730":
							var condition = $("#iteminfo1_item_descriptors .descriptor:contains('Exterior')").text().replace(/Exterior\: /, "");
							if (condition) item_name += " (" + condition + ")";
						default:
							load_inventory_market_prices("0", item, item_name, global_id);
							break;
					}
					break;
			}
		}, 500);
	})
}

// Add SteamDB links to pages
function add_steamdb_links(appid, type) {
    if (showdblinks === true) {
    	switch (type) {
    		case "gamehub":
    			$(".apphub_OtherSiteInfo").append('<a href="http://steamdb.info/app/' + escapeHTML(appid) + '/" class="btn_darkblue_white_innerfade btn_medium" target="_blank"><span>Steam Database</span>');
    			break;
    		case "gamegroup":
    			$('#rightActionBlock' ).append('<div class="actionItemIcon"><img src="http://www.enhancedsteam.com/firefox/steamdb.png" width="16" height="16" alt=""></div><a class="linkActionMinor" target="_blank" href="http://steamdb.info/app/' + escapeHTML(appid) + '/">View In Steam Database</a>');
    			break;
    		case "app":
    			$('#demo_block').find('.block_content_inner').find('.share').before('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="http://steamdb.info/app/' + escapeHTML(appid) + '/" style="background-image:url(http://www.enhancedsteam.com/firefox/steamdb_store.png)">View In Steam Database</a></div>');
    			break;
    		case "sub":	
    			$(".share").before('<a class="game_area_wishlist_btn" target="_blank" href="http://steamdb.info/sub/' + escapeHTML(appid) + '/" style="background-image:url(http://www.enhancedsteam.com/firefox/steamdb_store.png)">View In Steam Database</a>');
    			break;
    	}
    }
}

// Adds red warnings for 3rd party DRM
function drm_warnings() {
    if (showDRM === true) {
        var gfwl;
        var uplay;
        var securom;
        var tages;
        var stardock;
        var rockstar;
        var kalypso;
        var otherdrm;
        
        // Games for Windows Live detection
        if (document.body.innerHTML.indexOf("Games for Windows LIVE") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("Games for Windows Live") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("Games for Windows - Live") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("Games For Windows - Live") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("Games for Windows - LIVE") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("Games For Windows - LIVE") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("Online play requires log-in to Games For Windows") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("INSTALLATION OF THE GAMES FOR WINDOWS LIVE SOFTWARE") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("Multiplayer play and other LIVE features included at no charge") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }
        if (document.body.innerHTML.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }
        
        // Ubisoft Uplay detection
        if (document.body.innerHTML.indexOf("Uplay Account") > 0) { uplay = true; }
        if (document.body.innerHTML.indexOf("UPLAY ACCOUNT") > 0) { uplay = true; }
        if (document.body.innerHTML.indexOf("UPlay account") > 0) { uplay = true; }
        if (document.body.innerHTML.indexOf("HIGH SPEED INTERNET CONNECTION AND CREATION OF A UBISOFT ACCOUNT ARE REQUIRED") > 0) { uplay = true; }
        if (document.body.innerHTML.indexOf("HIGH SPEED INTERNET ACCESS AND CREATION OF A UBISOFT ACCOUNT ARE REQUIRED") > 0) { uplay = true; }
        if (document.body.innerHTML.indexOf("CREATION OF A UBISOFT ACCOUNT") > 0) { uplay = true; }
        
        // Securom detection
        if (document.body.innerHTML.indexOf("SecuROM") > 0) { securom = true; }
        if (document.body.innerHTML.indexOf("SECUROM") > 0) { securom = true; }
        
        // Tages detection
        if (document.body.innerHTML.indexOf("Tages") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("Angebote des Tages") > 0) { tages = false; }
		if (document.body.innerHTML.indexOf("Tagesangebote") > 0) { tages = false; }
		if (document.body.innerHTML.indexOf("TAGES") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("ANGEBOT DES TAGES") > 0) { tages = false; }
		if (document.body.innerHTML.indexOf("SOLIDSHIELD") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("Solidshield Tages") > 0) { tages = true; }
		if (document.body.innerHTML.indexOf("Tages Solidshield") > 0) { tages = true; }
        
        // Stardock account detection
        if (document.body.innerHTML.indexOf("Stardock account") > 0) { stardock = true; }
        
        // Rockstar social club detection
        if (document.body.innerHTML.indexOf("Rockstar Social Club") > 0) { rockstar = true; }
        if (document.body.innerHTML.indexOf("Rockstar Games Social Club") > 0) { rockstar = true; }
        
        // Kalypso Launcher detection
        if (document.body.innerHTML.indexOf("Requires a Kalypso account") > 0) { kalypso = true; }
        
        // Detect other DRM
        if (document.body.innerHTML.indexOf("3rd-party DRM") > 0) { otherdrm = true; }
        if (document.body.innerHTML.indexOf("No 3rd Party DRM") > 0) { otherdrm = false; }
        
        if (gfwl) {            	
        	$("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM (Games for Windows Live)")));
            otherdrm = false;
        }
        
        if (uplay) {
            $("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM (Ubisoft Uplay)")));
        	otherdrm = false;
        }
        
        if (securom) {            	
        	$("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM (SecuROM)")));
            otherdrm = false;
        }
        
        if (tages) {            	
        	$("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM (Tages)")));
            otherdrm = false;
        }
        
        if (stardock) {            	
        	$("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM (Stardock Account Required)")));
            otherdrm = false;
        }
        
        if (rockstar) {            	
        	$("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM (Rockstar Social Club)")));
            otherdrm = false;
        }
        
        if (kalypso) {            	
        	$("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM (Kalypso Launcher)")));
            otherdrm = false;
        }
        
        if (otherdrm) {            	
            $("#game_area_purchase").before($("<div>", { class: "game_area_already_owned", style: "background-image: url( http://www.enhancedsteam.com/firefox/game_area_warning.png );" }).append($("<span>").text("Warning: This title uses 3rd party DRM")));
        }
    }
}

function add_carousel_descriptions() {
    if (showappdesc == true) {
    	if ($(".main_cluster_content").length > 0) {
            var description_height_to_add = 62;		
            $(".main_cluster_content").css("height", parseInt($(".main_cluster_content").css("height").replace("px", ""), 10) + description_height_to_add + "px");    		
    		
    		$.each($(".cluster_capsule"), function(i, _obj) {
    			var appid = get_appid(_obj.href),
    				$desc = $(_obj).find(".main_cap_content"),
    				$desc_content = $("<p></p>");
    			
    			$desc.css("height", parseInt($desc.css("height").replace("px", ""), 10) + description_height_to_add + "px");
    			$desc.parent().css("height", parseInt($desc.parent().css("height").replace("px", ""), 10) + description_height_to_add + "px");
    			
    			get_http('http://store.steampowered.com/app/' + appid, function(txt) {
    				var desc = txt.match(/textarea name="w_text" placeholder="(.+)" maxlength/);
    				if (desc) {
    					var description = escapeHTML(desc[1]);
    					$desc.append(description);
    				}
    			});
    		});
		}
    }
}

function add_affordable_button() {
    if ($("#header_wallet_ctn").length > 0) {
        var balance_text = $("#header_wallet_ctn").text().trim();        
    	var currency_symbol = balance_text.match(/(?:R\$|\$|€|£|pуб)/)[0];
    	var balance = balance_text.replace(currency_symbol, "");
    	if(currency_symbol == "$") balance = balance.replace(" USD", "");
    	balance = balance.replace(",", ".");
    	if (balance > 0) {
    		var link = "http://store.steampowered.com/search/?sort_by=Price&sort_order=DESC&price=0%2C" + escapeHTML(balance);
    		$(".btn_browse").each(function(index) {
    			if (index == 1) {
    				switch (currency_symbol) {
    					case "€":
    						$(this).after("<a class='btn_browse' style='width: 308px; background-image: url( http://www.enhancedsteam.com/firefox/es_btn_browse.png );' href='" + escapeHTML(link) + "'><h3 style='width: 120px;'>" + escapeHTML(balance) + "<span class='currency'>" + escapeHTML(currency_symbol) + "</span></h3><h5><span id='es_results'></span> games under " + escapeHTML(balance_text) + "</h5></a>");
    						break;
    					case "pуб":
    						$(this).after("<a class='btn_browse' style='width: 308px; background-image: url( http://www.enhancedsteam.com/firefox/es_btn_browse.png );' href='" + escapeHTML(link) + "'><h3 style='width: 120px;'>" + escapeHTML(balance) + "</h3><h5><span id='es_results'></span> games under " + escapeHTML(balance_text) + "</h5></a>");
    						break;
    					default:
    						$(this).after("<a class='btn_browse' style='width: 308px; background-image: url( http://www.enhancedsteam.com/firefox/es_btn_browse.png );' href='" + escapeHTML(link) + "'><h3 style='width: 120px;'><span class='currency'>" + escapeHTML(currency_symbol) + "</span>" + escapeHTML(balance) + "</h3><h5><span id='es_results'></span> games under " + escapeHTML(balance_text) + "</h5></a>");
    				}		
    				get_http(link, function(txt) {
    					var results = txt.match(/search_pagination_left(.+)\r\n(.+)/)[2];
    					results = results.match(/(\d+)(?!.*\d)/)[0];
    					$("#es_results").text(results);
    				});	
    			}	
    		});
    	}
    }
}

var processing = false;
var search_page = 2;

function load_search_results () {
    if (!processing) {
		processing = true;
		var search = document.URL.match(/(.+)\/(.+)/)[2].replace(/\&page=./, "").replace(/\#/g, "&");
		get_http('http://store.steampowered.com/search/results' + search + '&page=' + search_page + '&snr=es', function (txt) {
			var html = $.parseHTML(txt);
			html = $(html).find("a.search_result_row");
			$(".search_result_row").last().after(html);
			search_threshhold = search_threshhold + 1450; //each result is 58px height * 25 results per page = 1450
			search_page = search_page + 1;
			processing = false;
			remove_non_specials();
			add_overlay();
		});
	}
}

function endless_scrolling() {
	if (contscroll == true) {		
		$(".search_pagination_right").css("display", "none");
		$(".search_pagination_left").text($(".search_pagination_left").text().trim().match(/(\d+)$/)[0] + " Results");

		$(window).scroll(function() {
			if ($(window).scrollTop() > search_threshhold) {
				load_search_results();
			}
		});
	}
}

function remove_non_specials() {
    if (window.location.search.match(/specials=1/)) {
		$(".search_result_row").each(function(index) {
			if (!($(this).html().match(/<strike>/))) {
				hide_node($(this)[0]);
				if ($(document).height() <= $(window).height()) {
					load_search_results();
				}
			}
		});
	}
}

function hide_greenlight_banner() {
    if (changegreenlightbanner === true) {
        var banner = $("#ig_top_workshop");
		var breadcrumbs = $(".breadcrumbs");

		var greenlight_info = '<div class="apphub_HeaderTop es_greenlight"><div class="apphub_AppName ellipsis">Greenlight</div><div style="clear: both"></div>'
		greenlight_info += '<div class="apphub_sectionTabs">';
		greenlight_info += '<a class="apphub_sectionTab" id="games_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=items"><span>Games</a>';
		greenlight_info += '<a class="apphub_sectionTab" id="software_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=software"><span>Software</a>';
		greenlight_info += '<a class="apphub_sectionTab" id="concepts_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=concepts"><span>Concepts</a>';
		greenlight_info += '<a class="apphub_sectionTab" id="collections_apphub_sectionTab" href="http://steamcommunity.com/workshop/browse/?appid=765&section=collections"><span>Collections</a>';
		greenlight_info += '<a class="apphub_sectionTab" href="http://steamcommunity.com/workshop/discussions/?appid=765"><span>Discussions</a>';
		greenlight_info += '<a class="apphub_sectionTab" href="http://steamcommunity.com/workshop/about/?appid=765&section=faq"><span>About Greenlight</a>';
		greenlight_info += '<a class="apphub_sectionTab" href="http://steamcommunity.com/workshop/news/?appid=765"><span>News</a>';
		greenlight_info += '</div><div style="top: 28px;position: relative;"><div class="apphub_sectionTabsHR"><img src="http://cdn.steamcommunity.com/public/images/trans.gif"></div></div>';
		if(breadcrumbs.find("a:first").text().trim()=="Greenlight"){
			banner.before(greenlight_info);
			var collection_header = $("#ig_collection_header");
			collection_header.css("height","auto");
			collection_header.find("img").hide();
			if(banner.hasClass("blue")) {
				banner.hide();
			}
			else if(banner.hasClass("green")) {
				$(".es_greenlight").toggleClass("es_greenlit");
			}else if(banner.hasClass("greenFlash")) {
				$(".es_greenlight").toggleClass("es_released");
			}
			var second_breadcrumb = breadcrumbs.find("a:nth-child(2)").text().trim();
			switch (second_breadcrumb) {
				case "Games":
					$("#games_apphub_sectionTab").toggleClass("active");
					break;
				case "Software":
					$("#software_apphub_sectionTab").toggleClass("active");
					break;
				case "Concepts":
					$("#concepts_apphub_sectionTab").toggleClass("active");
					break;
				case "Collections":
					breadcrumbs.before(greenlight_info);
					$("#collections_apphub_sectionTab").toggleClass("active");
					break;
			}
		}
    }
}

function fix_community_hub_links() {
    element = document.querySelector( '.apphub_OtherSiteInfo a' );
			
	if( element && element.href.charAt( 26 ) === '/' ) {
		element.href = element.href.replace( /\/\/app\//, '/app/' ) + '/';
	}
}

function display_purchase_date() {
    if ($(".game_area_already_owned").length > 0) {
        var appname = $(".apphub_AppName").text();

        get_http('https://store.steampowered.com/account/', function (txt) {
    		var earliestPurchase = $(txt).find("#store_transactions .transactionRowTitle:contains(" + appname + ")").closest(".transactionRow").last(),
    			purchaseDate = $(earliestPurchase).find(".transactionRowDate").text();
    
    		var found = 0;
    		xpath_each("//div[contains(@class,'game_area_already_owned')]", function (node) {
    			if (found === 0) {
    				if (purchaseDate) {
    					$(node).append(localized_strings[language].purchase_date.replace("__date__", escapeHTML(purchaseDate)));
    					found = 1;
    				}
    			}
    		});
    	});
	}    
}

function bind_ajax_content_highlighting() {
    var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			for (var i = 0; i < mutation.addedNodes.length; i++) {
				var node = mutation.addedNodes[i];
				// Check the node is what we want, and not some unrelated DOM change.
                if (node.classList && node.classList.contains("inventory_page")) {
    				inventory_market_prepare();
				}

				if (node.classList && node.classList.contains("tab_row")) {
					start_highlighting_node(node);
					check_early_access(node, "ea_sm_120.png", 0);
				}
                
				if (node.id == "search_result_container") {
    				endless_scrolling();
					start_highlights_and_tags();
					remove_non_specials();
					add_overlay();
				}

				if ($(node).children('div')[0] && $(node).children('div')[0].classList.contains("blotter_day")) {
					start_friend_activity_highlights();
					add_overlay();
				}

				if (node.classList && node.classList.contains("match")) start_highlighting_node(node);
                if (node.classList && node.classList.contains("search_result_row")) start_highlighting_node(node);
				if (node.classList && node.classList.contains("market_listing_row_link")) highlight_market_items();
                if ($(node).parent()[0] && $(node).parent()[0].classList.contains("search_result_row")) start_highlighting_node($(node).parent()[0]);
			}
		});
	});
	observer.observe(document, { subtree: true, childList: true });
}

function add_app_page_highlights(appid) {
    if (window.location.host == "store.steampowered.com") node = $(".apphub_HeaderStandardTop")[0];
	if (window.location.host == "steamcommunity.com") node = $(".apphub_HeaderTop")[0];

	on_app_info(appid, function(){
		highlight_app(appid, node);
	});
}

function start_highlights_and_tags(){
	var selectors = [
    	"div.tab_row",			// Storefront rows
		"div.dailydeal",		// Christmas deals; https://www.youtube.com/watch?feature=player_detailpage&v=2gGopKNPqVk#t=52s
		"div.wishlistRow",		// Wishlist row
		"a.game_area_dlc_row",	// DLC on app pages
		"a.small_cap",			// Featured storefront items, and "recommended" section on app pages.
		"a.search_result_row",	// Search result row.
		"a.match",				// Search suggestions row.
		"a.cluster_capsule",	// Carousel items.
		"div.recommendation_highlight",	// Recommendation page.
		"div.recommendation_carousel_item",	// Recommendation page.
		"div.friendplaytime_game",	// Recommendation page.
		"div.dlc_page_purchase_dlc", // DLC page rows
		"div.sale_page_purchase_item", // Sale pages
		"div.item",				// Sale page / featured page
		"div.home_area_spotlight",	// midweek and weekend deals
        "div.insert_season_here_sale_dailydeal_ctn"
	];

	// Get all appids and nodes from selectors.
	$.each(selectors, function (i, selector) {
		$.each($(selector), function(j, node){
		    var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
    		if (appid) {
			
				if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
				if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }
			
				on_app_info(appid, function(){
					highlight_app(appid, node);
				});
			} else {
				var subid = get_subid(node.href || $(node).find("a")[0].href);
				if (subid) {
					get_sub_details (subid, node);
				}
			}
		});
	});
}

function start_highlighting_node(node) {
    var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
	if (appid) {
	
		if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
		if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }
	
		on_app_info(appid, function(){
			highlight_app(appid, node);
		});
	} else {
		var subid = get_subid(node.href || $(node).find("a")[0].href);
        
        if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
    	if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }
        
		if (subid) {
			get_sub_details (subid, node);
		}
	}
}

function on_app_info(appid, cb) {
    ensure_appid_deferred(appid);

	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem(appid) || expire_time - 1;

	// If we have no data on appid, or the data has expired; add it to appids to fetch new data.
	if (last_updated < expire_time) {
		get_app_details(appid);
	}
	else {
		appid_promises[appid].resolve();
	}

	// Bind highlighting.
	appid_promises[appid].promise.done(cb);
}

function highlight_app(appid, node) {
	if (!(node.classList.contains("wishlistRow") || node.classList.contains("wishlistRowItem"))) {
		if (getValue(appid + "wishlisted")) highlight_wishlist(node);
	}

	if (getValue(appid + "owned")) highlight_owned(node);
}

function get_app_details(appids) {
	if (!(appids instanceof Array)) appids = [appids];
	get_http('http://store.steampowered.com/api/appuserdetails/?appids=' + appids.join(","), function (data) {
		var storefront_data = JSON.parse(data);
		$.each(storefront_data, function(appid, app_data){
			if (app_data.success) {
				setValue(appid + "wishlisted", (app_data.data.added_to_wishlist === true));
				setValue(appid + "owned", (app_data.data.is_owned === true));
			}
			// Time updated, for caching.
			setValue(appid, parseInt(Date.now() / 1000, 10));

			// Resolve promise, to run any functions waiting for this apps info.
			appid_promises[appid].resolve();
		});
	});
}

function get_sub_details(subid, node) {
    if (getValue(subid + "owned")) { highlight_owned(node); return; }
	get_http('http://store.steampowered.com/api/packagedetails/?packageids=' + subid, function (data) {
		var pack_data = JSON.parse(data);
		$.each(pack_data, function(subid, sub_data) {
			if (sub_data.success) {
				var app_ids = [];
				var owned = [];
				if (sub_data.data.apps) {
					sub_data.data.apps.forEach(function(app) {
						app_ids.push (app.id);
						get_http('http://store.steampowered.com/api/appuserdetails/?appids=' + app.id, function (data2) {
							var storefront_data = JSON.parse(data2);
							$.each(storefront_data, function(appid, app_data) {
								if (app_data.success) {
									if (app_data.data.is_owned === true) {
										owned.push(appid);
									}
								}
							});

							if (owned.length == app_ids.length) {
								setValue(subid + "owned", true);
								setValue(subid, parseInt(Date.now() / 1000, 10));
								highlight_app(subid, node);
							}
						});
					});
				}
			}
		});
	});
}

function add_steamcards_link(appid) {
    if ($(".icon").find('img[src$="/ico_cards.gif"]').length > 0) {
		$('.communitylink .block_content_inner:first').append("<a class='linkbar' href='http://steamcommunity.com/my/gamecards/" + escapeHTML(appid) + "'><div class='rightblock'><img src='http://www.enhancedsteam.com/firefox/ico_cards.gif' width='16' height='16' border='0' align='top' /></div>Steam Trading Cards</a>");
	}
}

function change_user_background() {
    var steamID;
	if ($("#reportAbuseModal").length > 0) { steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined) { steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }
	
	get_http("http://api.enhancedsteam.com/profile/?steam64=" + steamID, function (txt) {
		if (txt) {
			$(".no_header")[0].style.backgroundImage = "url(" + escapeHTML(txt) + ")";
			if ($(".profile_background_image_content").length > 0) {
				$(".profile_background_image_content")[0].style.backgroundImage = "url(" + escapeHTML(txt) + ")";
			} else {
				$(".no_header").addClass("has_profile_background");
				$(".profile_content").addClass("has_profile_background");
				$(".profile_content").prepend('<div class="profile_background_holder_content"><div class="profile_background_overlay_content"></div><div class="profile_background_image_content " style="background-image: url(' + escapeHTML(txt) + ');"></div></div></div>');
			}
		}
	});
}

function add_es_background_selection() {
    if (showcustombg === true) {
        if (window.location.pathname.indexOf("/settings") < 0) { 							
    		var steam64 = $(document.body).html();
    		steam64 = steam64.match(/g_steamID = \"(.+)\";/)[1];				
    		var html = "<form id='es_profile_bg' method='POST' action='http://www.enhancedsteam.com/gamedata/profile_bg_save.php'><div class='group_content group_summary'>";
    		html += "<input type='hidden' name='steam64' value='" + escapeHTML(steam64) + "'>";
    		html += "<div class='formRow'><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'>";
    		html += "<img id='es_profile_background_current_image' src=''>";
    		html += "</div><div class='profile_background_current_description'><div id='profile_background_current_name'><select name='es_background' id='es_background' class='gray_bevel dynInput' onchange=\"function image(obj){index=obj.selectedIndex; document.getElementById('es_profile_background_current_image').src=obj.options[index].id; } image(this);\"><option value='0' id='http://www.enhancedsteam.com/gamedata/icons/smallblacksquare.jpg'>None Selected / No Change</option>";
    
    		get_http("http://api.enhancedsteam.com/profile-select/?steam64=" + escapeHTML(steam64), function (txt) {
    			var data = JSON.parse(txt);
    
    			var array = [];
    			for (var key in data["backgrounds"]) {
    				if (data["backgrounds"].hasOwnProperty(key)) {
    				  array.push(data["backgrounds"][key]);
    				}
    			}
    
    			array.sort(function(a,b) {
    				if ( a.text == b.text ) return 0;
    				return a.text < b.text ? -1 : 1;
    			});
    
    			$.each(array, function(index, value) {
    				if (value["selected"]) {
    					html += "<option id='" + escapeHTML(value['id'].toString()) + "' value='" + escapeHTML(value['index'].toString()) + "' SELECTED>" + escapeHTML(value['text'].toString()) + "</option>";
    				} else {
    					html += "<option id='" + escapeHTML(value['id'].toString()) + "' value='" + escapeHTML(value['index'].toString()) + "'>" + escapeHTML(value['text'].toString()) + "</option>";
    				}
    			});
    			
    			html += "</select></div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span class='btn_grey_white_innerfade btn_small' onclick=\"document.getElementById('es_profile_bg').submit()\"><span>Save</span></span></div></div><div class='formRowTitle'>Custom Background:<span class='formRowHint' title='All users of Enhanced Steam will see this background on your profile.  Non-Enhanced Steam users will see your regular profile background.'>(?)</span></div></div></div>";
    			html += "</form>";            
    				
    			$(".group_content_bodytext").before(html);
    			
    			get_http("http://api.enhancedsteam.com/profile-small/?steam64=" + steam64, function (txt) {
    				$("#es_profile_background_current_image").attr("src", escapeHTML(txt));
    			});
    		});
    	}
    }
}

function rewrite_string(string) {
	string = string.replace(/%23/g, "#");
	string = string.replace(/%20/g, " ");
	string = string.replace(/%28/g, "(");
	string = string.replace(/%29/g, ")");
	string = string.replace(/%3A/g, ":");
	string = string.replace(/%27/g, "'");
	string = string.replace(/%26/g, "&");
	string = string.replace(/%21/g, "!");
	string = string.replace(/%3F/g, "?");
	string = string.replace(/%2C/g, ",");
	string = string.replace(/%22/g, "\"");
	return string;
}

function highlight_market_items() {    
    $.each($(".market_listing_row_link"), function (i, node) {
		var current_market_name = node.href.match(/steamcommunity.com\/market\/listings\/753\/(.+)\?/);
		if (!current_market_name) { current_market_name = node.href.match(/steamcommunity.com\/market\/listings\/753\/(.+)/); }        
		if (current_market_name) {
			var item_name = rewrite_string(current_market_name[1]);            
			var market_name = getValue("card:" + item_name);
			if (market_name) {
                node = $(node).find("div");
    			$(node).css("backgroundImage", "none");
    			$(node).css("color", "white");
    			$(node).css("backgroundColor", ownedColor);				
    		}
    	}
    });
}

function start_friend_activity_highlights() {
    var selectors = [
		".blotter_author_block a",
		".blotter_gamepurchase_details a",
		".blotter_daily_rollup_line a"
	];
	
	$.each(selectors, function (i, selector) {
		$.each($(selector), function(j, node){
			var appid = get_appid(node.href);
			if (appid && !node.classList.contains("blotter_userstats_game")) {
				if (selector == ".blotter_author_block a") { $(node).addClass("inline_tags"); }
				if (selector == ".blotter_daily_rollup_line a") { 
					if ($(node).parent().parent().html().match(/<img src="(.+apps.+)"/)) {
						add_achievement_comparison_link($(node).parent().parent()); 
					}
				}	
				
				on_app_info(appid, function(){
					highlight_app(appid, node);					
				});
			}
		});	
	});
}

function add_achievement_comparison_link(node) {
    if (!($(node).html().match(/es_achievement_compare/))) {
		var links = $(node).find("a");
		var appid = get_appid(links[2].href);
		get_http(links[0].href + "/stats/" + appid, function(txt) {
			var html = txt.match(/<a href="(.+)compare">/);
			if (html) {
				$(node).find("span:not(.nickname_block,.nickname_name)").css("margin-top", "0px");
				$(node).find("span:not(.nickname_block,.nickname_name)").append("<br><a href='http://www.steamcommunity.com" + escapeHTML(html[1]) + "compare' class='es_achievement_compare' target='_blank' style='font-size: 10px; float: right; margin-right: 6px;'>(" + localized_strings[language].compare + ")</a>");
			}
		});
	}
}

function fix_broken_sub_image() {
    var header = $(".package_header").attr("src");
	var img = $(".tab_item_img").find("img").attr("src").match(/(.+)\//)[0] + "header.jpg";
	$.ajax(header).error(function() { $(".package_header").attr("src", img); });
}

function add_dlc_checkboxes() {
	if ($("#game_area_dlc_expanded").length > 0) {
		$("#game_area_dlc_expanded").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; margin-bottom: 10px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><div class='btn_addtocart_left'></div><div class='btn_addtocart_right'></div><a class='btn_addtocart_content' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'>" + localized_strings[language].add_selected_dlc_to_cart + "</a></div></div>");
		$(".game_area_dlc_section").after("<div style='clear: both;'></div>");
	} else {
		$(".gameDlcBlocks").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><div class='btn_addtocart_left'></div><div class='btn_addtocart_right'></div><a class='btn_addtocart_content' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'>" + localized_strings[language].add_selected_dlc_to_cart + "</a></div></div>");
	}
	$("#es_selected_btn").before("<form name=\"add_selected_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\" id=\"es_selected_cart\">");
	$(".game_area_dlc_row").each(function() {
		$(this).find(".game_area_dlc_name").prepend("<input type='checkbox' class='es_dlc_selection' style='cursor: default;' id='es_select_dlc_" + $(this).find("input").val() + "' value='" + $(this).find("input").val() + "'><label for='es_select_dlc_" + $(this).find("input").val() + "' style='background-image: url( http://www.enhancedsteam.com/firefox/img/check_sheet.png );'></label>");
	});
	function add_dlc_to_list() {
		$("#es_selected_cart").html("<input type=\"hidden\" name=\"action\" value=\"add_to_cart\">");
		$(".es_dlc_selection:checked").each(function() {
			var input = $("<input>", {type: "hidden", name: "subid[]", value: $(this).val() });
			$("#es_selected_cart").append(input);
		});
		if ($(".es_dlc_selection:checked").length > 0) {
			$("#es_selected_btn").show();
		} else {
			$("#es_selected_btn").hide();
		}
	}
	$(document).on( "change", ".es_dlc_selection", add_dlc_to_list );
}

function fix_achievement_icon_size() {
	if ($(".rightblock").find("img[src$='ico_achievements.png']").length > 0) {
		$(".rightblock").find("img[src$='ico_achievements.png']").attr("height", "24");
		$(".rightblock").find("img[src$='ico_achievements.png']").css("margin-top", "-5px");
	}
}

function check_early_access(node, image_name, image_left, selector_modifier) {	
	var href = ($(node).find("a").attr("href") || $(node).attr("href"));
	var appid = get_appid(href);
	get_http('http://store.steampowered.com/api/appdetails/?appids=' + appid + '&filters=genres', function (data) {
		var app_data = JSON.parse(data);							
		if (app_data[appid].success) {
			var genres = app_data[appid].data.genres;								
			$(genres).each(function(index, value) {									
				if (value.description == "Early Access") {
					var selector = "img";
					if (selector_modifier != undefined) selector += selector_modifier;
					$(node).find(selector.trim()).after("<img class='es_overlay' style='left: " + image_left + "px' src='http://www.enhancedsteam.com/firefox/img/overlay/" + escapeHTML(image_name) + "'>");
				}
			});	
		}
	});
}

function add_overlay() {
	switch (window.location.host) {
		case "store.steampowered.com":
			switch (true) {
				case /^\/app\/.*/.test(window.location.pathname):
					if ($(".early_access_header").length > 0) {
						$(".game_header_image:first").after("<img class='es_overlay' style='left: " + $(".game_header_image:first").position().left + "px' src='http://www.enhancedsteam.com/firefox/img/overlay/ea_292x136.png'>");
					}
					$(".small_cap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", $(this).position().left + 10); });
					break;
				case /^\/(?:genre|browse)\/.*/.test(window.location.pathname):
					$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
					$(".special_tiny_cap").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
					$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
					$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
					break;
				case /^\/search\/.*/.test(window.location.pathname):
					$(".search_result_row").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0, ":eq(1)"); });					
					break;
				case /^\/recommended/.test(window.location.pathname):
					$(".friendplaytime_appheader").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
					$(".header_image").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
					$(".appheader").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
					$(".recommendation_carousel_item").each(function(index, value) { check_early_access($(this), "ea_184x69.png", $(this).position().left + 8); });
					$(".game_capsule_area").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", $(this).position().left + 8); });
					$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", $(this).position().left); });
					break;
				case /^\/$/.test(window.location.pathname):					
					$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
					$(".small_cap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", $(this).position().left + 10); });
					$(".cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
					$(".special_tiny_cap").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
					$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
					$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
					break;
			}
		case "steamcommunity.com":
			switch(true) {
				case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
					$(".gameLogo").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
					break;
				case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
					$(".gameLogo").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
					break;
				case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
					$(".blotter_gamepurchase_content").find("a").each(function(index, value) {
						check_early_access($(this), "ea_231x87.png", $(this).position().left);
					});
					break;
				case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
					$(".game_info_cap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
					$(".showcase_slot").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
					break;
				case /^\/app\/.*/.test(window.location.pathname):
					if ($(".apphub_EarlyAccess_Title").length > 0) {
						$(".apphub_StoreAppLogo:first").after("<img class='es_overlay' style='left: " + $(".apphub_StoreAppLogo:first").position().left + "px' src='http://www.enhancedsteam.com/firefox/img/overlay/ea_292x136.png'>");
					}
			}
	}
}

function show_regional_pricing() {
    if (showregionalprice) {
        var api_url = "http://store.steampowered.com/api/packagedetails/";
    	var countries = ["US","GB","EU1","EU2","BR","RU","AU"];
    	var pricing_div = "<div class='es_regional_container'></div>";
    	var world = "http://www.enhancedsteam.com/firefox/img/flags/world.png";
    	var currency_deferred = [];
    	var local_country;
    	var local_currency;
    	var dailydeal;
    	var sale;
    	var sub;
    	var region_appended=0;
    	var available_currencies = ["USD","GBP","EUR","BRL","RUB"];
    
    	// Get user's Steam currency
    	var currency_symbol = $(".price:first, .discount_final_price:first").text().trim().match(/(?:R\$|\$|€|£|pуб)/)[0];
    	switch (currency_symbol) {
    		case "$":
    			local_currency = "USD";
    			break;
    		case "£":
    			local_currency = "GBP";
    			break;
    		case "€":
    			local_currency = "EUR";
    			break;
    		case "R$":
    			local_currency = "BRL";
    			break;
    		case "pуб":
    			local_currency = "RUB";
    			break;					
    	}
    
        if (/^\/$/.test(window.location.pathname)) {
			dailydeal = true;
			pricing_div = $(pricing_div).addClass("es_regional_dailydeal");
		}
		if (/^\/sale\/.*/.test(window.location.pathname)) {
			sale=true;
			pricing_div = $(pricing_div).addClass("es_regional_sale");
		}
		if (/^\/sub\/.*/.test(window.location.pathname)) {
			sub=true;
			pricing_div = $(pricing_div).addClass("es_regional_sub");
		}
		if(getCookie("fakeCC")){
			local_country = getCookie("fakeCC").toLowerCase();
		} else {
			local_country = getCookie("LKGBillingCountry").toLowerCase();
		}
		if(countries.indexOf(local_country)===-1){
			countries.push(local_country);
		}
		var all_game_areas = $(".game_area_purchase_game").toArray();
		if (dailydeal) {
			all_game_areas = $(".dailydeal_content").toArray();
		} else if(sale) {
			all_game_areas = $(".sale_page_purchase_app").toArray();
		}
		var subid_info = [];
		var subid_array = [];
		var subids_csv;
        
        function formatPriceData(sub_info,country,converted_price,local_currency) {
			var flag_div = "<div class=\"es_flag\" style='background-image:url( http://www.enhancedsteam.com/firefox/img/flags/flags.png )'></div>";
			if (sub_info["prices"][country]){
				var price = sub_info["prices"][country]["final"]/100;
				var local_price = sub_info["prices"][local_country]["final"]/100;
				converted_price = converted_price/100;
				converted_price = converted_price.toFixed(2);
				var currency = sub_info["prices"][country]["currency"];					
				var percentage;
				switch(currency) {
					case "EUR":
						var formatted_price = formatMoney(price,2,"€",".",",",true);
						break;
					case "RUB":
						var formatted_price = price+"  pуб.";
						break;
					case "BRL":
						var formatted_price = formatMoney(price, 2, "R$ ", ".", ",", false);
						break;
					case "GBP":
						var formatted_price = formatMoney(price,2,"£");
						break;
					default:
						var formatted_price = formatMoney(price);
						break;
				}
				switch(local_currency) {
					case "EUR":
						var formatted_converted_price = formatMoney(converted_price,2,"€",".",",",true);
						break;
					case "RUB":
						converted_price = Math.round(converted_price);
						var formatted_converted_price = converted_price+"  pуб.";
						break;
					case "BRL":
						var formatted_converted_price = formatMoney(converted_price, 2, "R$ ", ".", ",", false);
						break;
					case "GBP":
						var formatted_converted_price = formatMoney(converted_price,2,"£");
						break;
					default:
						var formatted_converted_price = formatMoney(converted_price);
						break;
				}
				percentage = (((converted_price/local_price)*100)-100).toFixed(2);
				var arrows = "http://www.enhancedsteam.com/firefox/img/arrows.png";
				var percentage_span="<span class=\"es_percentage\"><div class=\"es_percentage_indicator\" style='background-image:url(" + arrows + ")'></div></span>";
				if (percentage<0) {
					percentage = Math.abs(percentage);
					percentage_span = $(percentage_span).addClass("es_percentage_lower");
				}else if (percentage==0) {
					percentage_span = $(percentage_span).addClass("es_percentage_equal");
				}else {
					percentage_span = $(percentage_span).addClass("es_percentage_higher");
				}
				percentage_span = $(percentage_span).append(percentage+"%");
				var regional_price_div = "<div class=\"es_regional_price\">"+formatted_price+"&nbsp;<span class=\"es_regional_converted\">(" + escapeHTML(formatted_converted_price) + ")</span></div>";
				flag_div = $(flag_div).addClass("es_flag_" + country.toLowerCase());
				regional_price_div = $(regional_price_div).prepend(flag_div);
				regional_price_div = $(regional_price_div).append(percentage_span);
				return regional_price_div;
			}
			else {
				var regional_price_div = "<div class=\"es_regional_price\"><span class=\"es_regional_unavailable\">" + localized_strings[language].region_unavailable + "</span></div>";
				flag_div = $(flag_div).addClass("es_flag_" + country);
				regional_price_div = $(regional_price_div).prepend(flag_div);
				return regional_price_div;
			}
		}
        
        $.each(all_game_areas,function(index,app_package){
			var subid = $(app_package).find("input").last().val();
			if(subid>0){
				subid_info[index]=[];
				subid_info[index]["subid"]=subid;
				subid_info[index]["prices"]=[];
				subid_array.push(subid);
			}
		});
        
        if(subid_array.length>0){
			subids_csv=subid_array.join();
			$.each(countries,function(index,country){
                switch (country) {
					case "EU1":
						cc="fr";
						break;
					case "EU2":
						cc="it";
						break;
					default:
						cc=country;
						break;
				}
				currency_deferred.push(
					$.ajax({
						url:api_url,
						data:{
							packageids:subids_csv,
							cc:cc
						}
					}).done(function(data){
						$.each(subid_info,function(subid_index,package_info){
							$.each(data,function(data_subid){
								if(package_info){
									if(package_info["subid"]===data_subid){
										if(data[data_subid]["data"]) {
											var price = data[data_subid]["data"]["price"];
											subid_info[subid_index]["prices"][country]=price;
											pricing_div=$(pricing_div).append(price);
										}
									}
								}
							});
						});
					})
				);
			}); 
            var format_deferred=[];
    		var formatted_regional_price_array=[];
			$.when.apply(null,currency_deferred).done(function(){
				$.map(subid_info,function(subid,index){
					if(subid){
						var sub_formatted = [];
						var convert_deferred=[];
						var all_convert_deferred = $.Deferred();
						var app_pricing_div = $(pricing_div).clone();
						$(app_pricing_div).attr("id", "es_pricing_" + subid_info[index]["subid"].toString());
						$.each(countries,function(country_index,country){
							var regional_price_array=[];
							if(country!==local_country){
								if(subid["prices"][country]){
									var country_currency = subid["prices"][country]["currency"].toString().toUpperCase();
									var app_price = subid["prices"][country]["final"];
								}
                                convert_deferred.push($.ajax({
    								url:"http://rate-exchange.appspot.com/currency?from=" + local_currency + "&to=" + country_currency
								}).done(function(conversion_json){
									var converted_price = app_price / parseFloat(escapeHTML(conversion_json["rate"].toString()));
                                    var regional_price_array=[];
    								var regional_price = formatPriceData(subid,country,converted_price,local_currency);
									regional_price_array[0]=country;
									regional_price_array[1]=regional_price;
									sub_formatted.push(regional_price_array);										
								}));
							}
						});
						$.when.apply(null,convert_deferred).done(function(){
							if(dailydeal){
								$(".dailydeal_content").eq(index).find(".game_purchase_action_bg").before(app_pricing_div);
							}
							else if (sale){
								$(".sale_page_purchase_app").eq(index).find(".game_purchase_action_bg").before(app_pricing_div);
							} else {
								$(".game_area_purchase_game").eq(index).after(app_pricing_div);
							}
							sub_formatted["subid"]=subid_info[index]["subid"].toString();
							formatted_regional_price_array.push(sub_formatted);
							all_convert_deferred.resolve();
						});
						format_deferred.push(all_convert_deferred.promise());
					}
				});
				$.when.apply(null,format_deferred).done(function(){
					var all_sub_sorted_divs=[];
					$.each(formatted_regional_price_array,function(formatted_div_index,formatted_div){
						var sorted_formatted_divs=[];
						$.each(countries,function(country_index,country){
							$.each(formatted_div,function(regional_div_index,regional_div){
								var sort_div_country = regional_div[0];
								if(country==sort_div_country){
									sorted_formatted_divs.push(regional_div[1]);
								}
							});
						});
						sorted_formatted_divs["subid"]=formatted_div["subid"];
						all_sub_sorted_divs.push(sorted_formatted_divs);
					});
					$.each(all_sub_sorted_divs,function(index,sorted_divs){
						var subid = subid_array[index];
						$.each(sorted_divs,function(price_index,regional_div){
							$("#es_pricing_"+sorted_divs["subid"]).append(regional_div);
							if(regional_div!=undefined){
								region_appended++;
							}
						});
						$("#es_pricing_"+subid).append("<div class='miniprofile_arrow right' style='position: absolute; top: 12px; right: -8px;'></div>");
						if(region_appended<=1){
							$("#es_pricing_"+subid).find(".miniprofile_arrow").css("top","6px");
						}
					});
					$.each(all_game_areas,function(index,app_package){
						var subid = $(app_package).find("input").last().val();
						if(subid){
							$(app_package).find(".price").css({"padding-left":"25px","background-image":"url(" + world + ")","background-repeat":"no-repeat","background-position":"5px 8px"});
							$(app_package).find(".discount_original_price").css({"position":"relative","float":"left"});
							$(app_package).find(".discount_block").css({"padding-left":"25px","background-image":"url(" + world + ")","background-repeat":"no-repeat","background-position":"77px 8px"});

							var purchase_location = $(app_package).find("div.game_purchase_action_bg").offset();
							if (dailydeal) {
								$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width()+18 +"px");
							} else if (sale) {
								$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 25 +"px");
							} else if (sub) {
								$("#es_pricing_" + subid).css("right", $(".rightcol").width() + $(app_package).find(".game_purchase_action").width() + 45 +"px");
							} else {
								$("#es_pricing_" + subid).css("right", $(".rightcol").width() + $(app_package).find(".game_purchase_action").width() + 35 +"px");
							}
							$(app_package).find(".price, .discount_block")
							.mouseover(function() {
								$("#es_pricing_" + subid).show();
							})
							.mouseout(function() {
								$("#es_pricing_" + subid).hide();
							})
							.css("cursor","help");
						}
					});
				});
			});
        }
	}
}

function add_feature_search_links () {
    var game_details = ($('.game_area_details_specs').filter(function(){ return !$(this).parents('div').hasClass('icon'); }));
	$.each(game_details, function(index, value) {
		if (value.innerHTML.match(/MMO/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=20&advanced=0'>"));
		}
		if (value.innerHTML.match(/Local Co-op/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=24&advanced=0'>"));
		}
		if (value.innerHTML.match(/Cross-Platform Multiplayer/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=27&advanced=0'>"));
		}

		// these have somewhat unique icons and should work everywhere
		if (value.innerHTML.match(/ico_multiPlayer/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=1&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_singlePlayer/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=2&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_mod_hl2/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=997&category2=6&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_mod_hl/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=997&category2=7&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_vac/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=8&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_coop/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=9&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_hdr/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=12&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_cc/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=13&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_commentary/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=14&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_stats/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=15&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_sdk/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=16&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_editor/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=17&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_partial_controller/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=18&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_dlc/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=21&category2=21&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_achievements/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=22&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_cloud/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=23&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_leaderboards/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=25&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_guide/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category2=26'>"));
		}
		if (value.innerHTML.match(/ico_controller/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=28&advanced=0'>"));
		}
		if (value.innerHTML.match(/ico_cards/)) {
			var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=29&advanced=0'>"));
		}
        if (value.innerHTML.match(/ico_workshop/)) {
    		var original  = $(this)[0].innerHTML;
			$(this).html(original.replace("<div class=\"name\">", "<div class='name'><a style='text-decoration: none; color: #7cc53f;' href='http://store.steampowered.com/search/?term=&category1=998&category2=30&advanced=0'>"));
		}
	});
}

function totalsize() {
    var html = $("html").html();
	var txt = html.match(/var rgGames = (.+);/);
	var games = JSON.parse(txt[1]);
	var mbt = 0;
	var gbt = 0;
	$.each(games, function(index, value) {
		if (value["client_summary"]) {
			if (/MiB/.test(value["client_summary"]["localContentSize"])) {
				var mb = value["client_summary"]["localContentSize"].match(/(.+) MiB/)
				mbt += parseFloat(mb[1]);
			}
			if (/GiB/.test(value["client_summary"]["localContentSize"])) {
				var gb = value["client_summary"]["localContentSize"].match(/(.+) GiB/)
				gbt += parseFloat(gb[1]);
			}
		}
	});

	mbt = (mbt / 1024);
	var total = (gbt + mbt).toFixed(2);
	$(".clientConnChangingText").before("<p class='clientConnHeaderText'>Total Size:</p><p class='clientConnMachineText'>" + escapeHTML(total) + " GiB</p>");
}

function totaltime() {
    var html = $("html").html();
	var txt = html.match(/var rgGames = (.+);/);
	var games = JSON.parse(txt[1]);
	var time = 0;
	$.each(games, function(index, value) {
		if (value["hours_forever"]) {
			time_str=value["hours_forever"].replace(",","");
			time+=parseFloat(time_str);
		}
	});
	var total = time.toFixed(1);
	$(".clientConnChangingText").before("<div style='float:right;'><p class='clientConnHeaderText'>" + localized_strings[language].total_time + ":</p><p class='clientConnMachineText'>" + escapeHTML(total) + " Hours</p></div>");
}

function add_gamelist_sort() {
    if ($(".clientConnChangingText").length > 0) {
		$("#gameslist_sort_options").append("&nbsp;&nbsp;<label id='es_gl_sort_size'><a>" + localized_strings[language].size + "</a></label>");
		
		$("#es_gl_sort_size").on("click", function() {
			var gameRowsGB = [];
			var gameRowsMB = [];
			
			$(".clientConnItemBlock").find(".clientConnItemText:last").each(function (index, value) {
				var push = new Array();
				var size = ($(value).text());
				var row = ($(this).parent().parent().parent().parent());
				
				if (size) {
				
					push[0] = row[0].outerHTML;
					push[1] = size.replace(" GiB", "").replace(" MiB", "").replace(",", "");
					
					if (size.match(/GiB/)) {
						gameRowsGB.push(push);
					}
					
					if (size.match(/MiB/)) {
						gameRowsMB.push(push);
					}
					
					$(row).remove();
				}
			});
			
			gameRowsGB.sort(function(a,b) { return parseInt(a[1],10) - parseInt(b[1],10); });
			gameRowsMB.sort(function(a,b) { return parseInt(a[1],10) - parseInt(b[1],10); });
			
			$(gameRowsMB).each(function() {
				$("#games_list_rows").prepend(this[0]);
			});
			
			$(gameRowsGB).each(function() {
				$("#games_list_rows").prepend(this[0]);
			});
			
			$(this).html("<span style='color: #B0AEAC;'>" + localized_strings[language].size + "</span>");
			var html = $("#gameslist_sort_options").find("span[class='selected_sort']").html();
			html = "<a onclick='location.reload()'>" + html + "</a>";
			$("#gameslist_sort_options").find("span[class='selected_sort']").html(html);
		});
	}
}

function add_gamelist_filter() {
	if ($(".clientConnChangingText").length > 0) {
		var html  = "<span>" + localized_strings[language].show + ": </span>";
		html += "<label class='es_sort' id='es_gl_all'><input type='radio' name='es_gl_sort' checked><span><a>" + localized_strings[language].games_all + "</a></span></label>";
		html += "<label class='es_sort' id='es_gl_installed'><input type='radio' name='es_gl_sort'><span><a>" + localized_strings[language].games_installed + "</a></span></label>";
		html += "</div>";
		
		$('#gameslist_sort_options').append("<br>" + html);
		
		$('#es_gl_all').on('click', function() {
			$('.gameListRow').css('display', 'block');
		});
		
		$('#es_gl_installed').on('click', function() {
			$('.gameListRowItem').not(".gameListItemInstalled").parent().css("display", "none");	
		});		
	}
}

function add_gamelist_achievements() {
	if (window.location.href.match(/\/games\?tab=all/)) {
		$(".gameListRow").each(function(index, value) {
			var appid = get_appid_wishlist(value.id);
			$(value).find(".bottom_controls").find("img").each(function () {
				if ($(this).attr("src").indexOf("http://cdn.steamcommunity.com/public/images/skin_1/ico_stats.gif") == 0) {
					if (!($(value).html().match(/<h5><\/h5>/))) {
						$(value).find(".gameListRowItemName").append("<div class='recentAchievements' id='es_app_" + escapeHTML(appid) + "' style='padding-top: 14px; padding-right: 4px; width: 205px; float: right; font-size: 10px; font-weight: normal;'>");
						$("#es_app_" + appid).html("Loading achievements...");
						$("#es_app_" + appid).load($(".profile_small_header_texture a")[0].href + '/stats/' + appid + ' #topSummaryAchievements', function(response, status, xhr) {							
                            var BarFull = $("#es_app_" + appid).html().match(/achieveBarFull\.gif" border="0" height="12" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
							var BarEmpty = $("#es_app_" + appid).html().match(/achieveBarEmpty\.gif" border="0" height="12" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/)[1];
							BarFull = BarFull * .58;
    						BarEmpty = BarEmpty * .58;
							var html = $("#es_app_" + appid).html();
							html = html.replace(/achieveBarFull\.gif" border="0" height="12" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarFull.gif\" border='0' height='12' width=\"" + escapeHTML(BarFull.toString()) + "\"");
							html = html.replace(/achieveBarEmpty\.gif" border="0" height="12" width="([0-9]|[1-9][0-9]|[1-9][0-9][0-9])"/, "achieveBarEmpty.gif\" border='0' height='12' width=\"" + escapeHTML(BarEmpty.toString()) + "\"");
							html = html.replace("::", ":");
							$("#es_app_" + appid).html(html);
						});
					}
				}
			});
		});
	}
}

function add_gamelist_notincommon() {
    if($("label").attr("for")=="show_common_games") {        
		controls = $("#gameslist_controls").html();        
		controls_length = $("#gameslist_controls").html().length;
        controls_notincommon=controls.slice(0,controls_length-60);
        controls_notincommon+="<input type=\"checkbox\" id=\"es_gl_show_notincommon_games\"><label for=\"es_gl_show_notincommon_games\">"+localized_strings[language].notincommon_label+"</label>";
        controls_notincommon+="<br><div style=\"clear: right;\"></div>";        
		get_http('http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=A6509A49A35166921243F4BCC928E812&steamid=' + is_signed_in() + '&include_played_free_games=1&format=json', function (txt) {
			var data = JSON.parse(txt);
            $("#gameslist_controls").html(controls_notincommon);
			$("#es_gl_show_notincommon_games").on("change", function() {
				if (data.response && Object.keys(data.response).length > 0) {
				library_all_games = data.response.games;
				$.each(library_all_games, function(i,obj){
					$("#game_"+obj.appid).toggle();
				});
			}
			});
		});
	}
}

function add_cardexchange_links(game) {
	xpath_each("//div[contains(@class,'badge_row')]", function (node) {
		var $node = $(node);
		var gamecard = game || get_gamecard($node.find(".badge_row_overlay").attr('href'));
		if(!gamecard) return;
		$node.prepend('<div style="position: absolute; z-index: 3; top: 12px; right: 12px;" class="es_steamcardexchange_link"><a href="http://www.steamcardexchange.net/index.php?gamepage-appid-' + escapeHTML(gamecard) + '" target="_blank" alt="Steam Card Exchange" title="Steam Card Exchange"><img src="http://www.enhancedsteam.com/firefox/steamcardexchange.png" width="24" height="24" border="0" /></a></div>');
		$node.find(".badge_title_row").css("padding-right", "44px");
	});
}

function add_badge_filter() {
    if ( $(".profile_small_header_texture a")[0].href == $(".user_avatar a")[0].href) {
		var html  = "<div style='text-align: right;'><span>" + localized_strings[language].show + ": </span>";
			html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_all'><input type='radio' name='es_badge_sort' checked><span>" + localized_strings[language].badges_all + "</span></label>";
			html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_drops'><input type='radio' name='es_badge_sort'><span>" + localized_strings[language].badges_drops + "</span></label>";
			html += "</div>";

		$('.profile_badges_header').append(html);
		
		$('#es_badge_all').on('click', function() {
			$('.is_link').css('display', 'block');
		});
		
		$('#es_badge_drops').on('click', function() {
			$('.is_link').each(function () {
				if ($(this).html().match(/progress_info_bold">\D/)) {
					$(this).css('display', 'none');
				} else {
					if ($(this).html().match(/badge_info_unlocked/)) {
						if (!($(this).html().match(/badge_current/))) {
							$(this).css('display', 'none');
						}	
					}
					// Hide foil badges too
					if (!($(this).html().match(/progress_info_bold/))) {
						$(this).css('display', 'none');
					}
				}
			});
		});
	}	
}

function add_badge_view_options() {
    var html  = "<div style='text-align: right;'><span>" + localized_strings[language].view + ": </span>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_default'><input type='radio' name='es_badge_view' checked><span>" + localized_strings[language].theworddefault + "</span></label>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_binder'><input type='radio' name='es_badge_view'><span>" + localized_strings[language].binder_view + "</span></label>";
		html += "</div>";
		
	$('.profile_badges_header').append(html);
	
	$("#es_badge_view_default").on('click', function() {
		window.location.reload();
	});
			
	$("#es_badge_view_binder").on('click', function() {
		$('.is_link').each(function () {
			var stats = $(this).find("span[class$='progress_info_bold']").html();
    		$(this).find("div[class$='badge_cards']").remove();
    		$(this).find("div[class$='badge_title_stats']").css("display", "none");
			$(this).find("div[class$='badge_description']").css("display", "none");
			$(this).find("span[class$='badge_view_details']").remove();
			$(this).find("div[class$='badge_info_unlocked']").remove();
			$(this).find("div[class$='badge_progress_tasks']").remove();
			$(this).find("div[class$='badge_progress_info']").css("padding", "0");
			$(this).find("div[class$='badge_progress_info']").css("float", "none");
			$(this).find("div[class$='badge_progress_info']").css("margin", "0");
			$(this).find("div[class$='badge_progress_info']").css("width", "auto");
			$(this).find("div[class$='badge_title']").css("font-size", "12px");
			$(this).find("div[class$='badge_title_row']").css("padding-top", "0px");
			$(this).find("div[class$='badge_title_row']").css("padding-right", "4px");
			$(this).find("div[class$='badge_title_row']").css("padding-left", "4px");
			$(this).find("div[class$='badge_title_row']").css("height", "24px");
			$(this).find("div[class$='badge_row_inner']").css("height", "195px");
			$(this).find("div[class$='badge_current']").css("width", "100%");
            $(this).find("div[class$='badge_empty_name']").css("clear", "both");
            $(this).find("div[class$='badge_info_title']").css("clear", "both");
            $(this).find("div[class$='badge_info_image']").css("float", "center");
            $(this).find("div[class$='badge_info_image']").css("margin-left", "30px");
			$(this).find("div[class$='badge_empty_circle']").css("float", "center");
			$(this).find("div[class$='badge_empty_circle']").css("margin-left", "45px");
			$(this).find("div[class$='badge_content']").css("padding-top", "0px");
			$(this).css("width", "160px");
			$(this).css("height", "195px");
			$(this).css("float", "left");
			$(this).css("margin-right", "15px");
			$(this).css("margin-bottom", "15px");
			if (stats && stats.match(/\d+/)) {
    			if (!($(this).find("span[class$='es_game_stats']").length > 0)) {
					$(this).find("div[class$='badge_content']").first().append("<span class='es_game_stats' style='color: #5491cf; font-size: 12px; white-space: nowrap;'>" + escapeHTML(stats) + "</span>");
				}
			}
			if ($(this).find("div[class$='badge_progress_info']").text()) {
				var card = $(this).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/)[1] + " / " + $(this).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/)[2];
				$(this).find("div[class$='badge_progress_info']").text(card);
			}
		});

		$(".es_steamcardexchange_link").remove();
		$(".badges_sheet").css("text-align", "center");
		$(".badges_sheet").css("margin-left", "32px");
		$(".badge_empty").css("border", "none");
		$("#footer_spacer").before('<div style="display: block; clear: both;"></div>');
	});
}

function add_gamecard_foil_link() {
    if ($(".progress_info_bold").length > 0) {
		$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + window.location + "?border=1'><span>View Foil Badge Progress</span></a>");
	}	
}

function add_gamecard_market_links(game) {
	var foil;
	var url_search = window.location.search;
	var url_parameters_array = url_search.replace("?","").split("&");
	var cost = 0;

	$.each(url_parameters_array,function(index,url_parameter){
		if(url_parameter=="border=1"){
			foil=true;
		}
	});

	get_http("http://store.steampowered.com/app/220/", function(txt) {
		var currency_symbol = $(txt).find(".price, .discount_final_price").text().trim().match(/(?:R\$|\$|€|£|pуб)/)[0];

		get_http("http://ehsankia.com/steam/api/?appid=" + game, function(txt) {
			var data = JSON.parse(txt);
			$(".badge_card_set_card").each(function() {
				var node = $(this);
				var cardname = $(this).html().match(/(.+)<div style=\"/)[1].trim();			
				if (cardname == "") { cardname = $(this).html().match(/<div class=\"badge_card_set_text\">(.+)<\/div>/)[1].trim(); }

				var newcardname = escapeHTML(cardname);
				if (foil) { newcardname += " (Foil)"; }

				for (var i = 0; i < data.length; i++) {
					if (data[i].name == newcardname) {
						var url = escapeHTML(data[i].url);
						var marketlink = "http://steamcommunity.com/market/listings/" + url;
						switch (currency_symbol) {
							case "R$":
								var card_price = formatMoney(data[i].price_brl, 2, currency_symbol + " ", ".", ",");
								if ($(node).hasClass("unowned")) cost += data[i].price_brl;
								break;
							case "€":
								var card_price = formatMoney(data[i].price_eur, 2, currency_symbol, ".", ",", true); 
								if ($(node).hasClass("unowned")) cost += data[i].price_eur;
								break;
							case "pуб":
								var card_price = formatMoney(data[i].price_rub, 2, " " + currency_symbol, ".", ",", true); 
								if ($(node).hasClass("unowned")) cost += data[i].price_rub;
								break;
							case "£":
								var card_price = formatMoney(data[i].price_gbp, 2, currency_symbol); 
								if ($(node).hasClass("unowned")) cost += data[i].price_gbp;
								break;
							default:
								var card_price = formatMoney(data[i].price);						
								if ($(node).hasClass("unowned")) cost += data[i].price;
								break;
						}
					}
				}

				if (!(marketlink)) { 
					if (foil) { newcardname = newcardname.replace("(Foil)", "(Foil Trading Card)"); } else { newcardname += " (Trading Card)"; }
					for (var i = 0; i < data.length; i++) {
						if (data[i].name == newcardname) {
							var marketlink = "http://steamcommunity.com/market/listings/" + data[i].url;
							switch (currency_symbol) {
								case "R$":
									var card_price = formatMoney(data[i].price_brl, 2, currency_symbol + " ", ".", ",");
									if ($(node).hasClass("unowned")) cost += data[i].price_brl;
									break;
								case "€":
									var card_price = formatMoney(data[i].price_eur, 2, currency_symbol, ".", ",", true); 
									if ($(node).hasClass("unowned")) cost += data[i].price_eur;
									break;
								case "pуб":
									var card_price = formatMoney(data[i].price_rub, 2, " " + currency_symbol, ".", ",", true); 
									if ($(node).hasClass("unowned")) cost += data[i].price_rub;
									break;
								case "£":
									var card_price = formatMoney(data[i].price_gbp, 2, currency_symbol); 
									if ($(node).hasClass("unowned")) cost += data[i].price_gbp;
									break;
								default:
									var card_price = formatMoney(data[i].price);						
									if ($(node).hasClass("unowned")) cost += data[i].price;
									break;
							}
						}
					}
				}

				if (marketlink && card_price) {
					var html = "<a class=\"es_card_search\" href=\"" + escapeHTML(marketlink) + "\">" + localized_strings[language].lowest_price + ": " + escapeHTML(card_price) + "</a>";
					$(this).children("div:contains('" + escapeHTML(cardname) + "')").parent().append(html);
				}
			});
			if ($(".profile_small_header_name .whiteLink").attr("href") == $("#headerUserAvatarIcon").parent().attr("href")) {
				switch (currency_symbol) {
					case "R$":
						cost = formatMoney(cost, 2, currency_symbol + " ", ".", ",");
						break;
					case "€":
						cost = formatMoney(cost, 2, currency_symbol, ".", ",", true);
						break;
					case "pуб":
						cost = formatMoney(cost, 2, " " + currency_symbol, ".", ",", true);
						break;
					case "£":
						cost = formatMoney(cost, 2, currency_symbol);
						break;
					default:
						cost = formatMoney(cost);
						break;
				}
				$(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + localized_strings[language].badge_completion_cost+ ": " + escapeHTML(cost) + "</div>");
				$(".badge_empty_right").css("margin-top", "7px");
				$(".gamecard_badge_progress .badge_info").css("width", "296px");
			}
		});
	});
}

function add_total_drops_count() {
    var drops_count = 0;
	var drops_games = 0;
	var booster_games = 0;
	$(".progress_info_bold").each(function(i, obj) {
		var obj_count = obj.innerHTML.match(/\d+/);
		if (obj_count) {
			drops_count += parseInt(obj_count[0]);
			drops_games = drops_games + 1;
		}
	});
	
	get_http("http://steamcommunity.com/my/ajaxgetboostereligibility/", function(txt) {
		var eligible = $.parseHTML(txt);
		$(eligible).find(".booster_eligibility_games").children().each(function(i, obj) {
			booster_games += 1;
		});
		
		$(".profile_xp_block_right").html("<span style='color: #fff;'>" + localized_strings[language].card_drops_remaining.replace("__drops__", drops_count) + "<br>" + localized_strings[language].games_with_drops.replace("__dropsgames__", drops_games) + "<br>" + localized_strings[language].games_with_booster.replace("__boostergames__", booster_games) + "</span>");
	});
}

$(document).ready(function(){
    is_signed_in();

    localization_promise.done(function(){	
    	if (startWith(window.location.pathname, "/api")) return;
        if (startWith(window.location.pathname, "/login")) return;
        if (startWith(window.location.pathname, "/checkout")) return;
        if (startWith(window.location.pathname, "/join")) return;
    	
        // On window load...
    	add_enhanced_steam_options();
    	add_fake_country_code_warning();
        remove_install_steam_button();
        remove_about_menu();
    	add_header_links();
    	add_overlay();
                
    	switch (window.location.host) {
    		case "store.steampowered.com":			
    			switch (true) {
    				case /^\/app\/.*/.test(window.location.pathname):
    					var appid = get_appid(window.location.host + window.location.pathname);
                        load_inventory().done(function() {
    						if (getValue(appid+"coupon")) display_coupon_message(appid);
    					});
                        show_pricing_history(appid, "app");
    					dlc_data_from_site(appid);
    
    					drm_warnings();
    					add_metracritic_userscore();
                        display_purchase_date();
    
    					fix_community_hub_links();
    					add_widescreen_certification(appid);
                        add_hltb_info(appid);
                        add_pcgamingwiki_link(appid);
    					add_app_page_highlights(appid);
    					add_steamdb_links(appid, "app");
                        add_steamcards_link(appid);
        				add_feature_search_links();
    					add_dlc_page_link(appid);
                        add_remove_from_wishlist_button(appid);
                        add_4pack_breakdown();
                        add_steamchart_info(appid);
                        add_app_badge_progress(appid);
                        add_dlc_checkboxes();
						fix_achievement_icon_size();
                        
                        show_regional_pricing();
    					break;
    
    				case /^\/sub\/.*/.test(window.location.pathname):
    					var subid = get_subid(window.location.host + window.location.pathname);
    					drm_warnings();
    					subscription_savings_check();
    					show_pricing_history(subid, "sub");
    					add_steamdb_links(subid, "sub");
                        add_feature_search_links();
                        fix_broken_sub_image();
    					break;
                        
                    case /^\/agecheck\/.*/.test(window.location.pathname):
        				send_age_verification();
    					break;
                    
                    case /^\/dlc\/.*/.test(window.location.pathname):
        				dlc_data_for_dlc_page();
    					break;
    
    				case /^\/account\/.*/.test(window.location.pathname):
    					account_total_spent();
    					break;
                        
                    case /^\/search\/.*/.test(window.location.pathname):    					
						endless_scrolling();
						remove_non_specials();
						break;
    
    				// Storefront-front only
    				case /^\/$/.test(window.location.pathname):
                        add_carousel_descriptions();
                        add_affordable_button();
    					break;
    			}
                
    			/* Highlights & data fetching */
    			start_highlights_and_tags();
    
    			// Storefront homepage tabs.
    			bind_ajax_content_highlighting();    
    			break;
                
    
    		case "steamcommunity.com":
                
                add_wallet_balance_to_header();
                
    			switch (true) {
    				case /^\/(?:id|profiles)\/.+\/wishlist/.test(window.location.pathname):
    					appdata_on_wishlist();
                        fix_wishlist_image_not_found();
    					add_empty_wishlist_button();
                        add_empty_owned_wishlist_button();                        
                        add_wishlist_filter();
    					add_wishlist_discount_sort();
                        
                        start_highlights_and_tags();
    					break;
    
    				case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
    					start_friend_activity_highlights();
                        bind_ajax_content_highlighting();                    
    					break;
                        
                    case /^\/(?:id|profiles)\/.+\/edit/.test(window.location.pathname):    					
    					add_es_background_selection();
    					break;
                        
                    case /^\/(?:id|profiles)\/.+\/inventory\/.*/.test(window.location.pathname):
        				bind_ajax_content_highlighting();
                        inventory_market_prepare();
						break;
                        
                    case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
            			totaltime();
                        totalsize();
                        add_gamelist_achievements();
                        add_gamelist_sort();
    					add_gamelist_filter();
                        add_gamelist_notincommon();
    					break;
                        
                    case /^\/(?:id|profiles)\/.+\/badges/.test(window.location.pathname):
        				add_total_drops_count();
    					add_cardexchange_links();
						add_badge_filter();
						add_badge_view_options();
    					break;
    
    				case /^\/(?:id|profiles)\/.+\/gamecard/.test(window.location.pathname):
    					var gamecard = get_gamecard(window.location.pathname);
    					add_cardexchange_links(gamecard);
						add_gamecard_market_links(gamecard);
						add_gamecard_foil_link();
    					break;
    
    				case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
    					add_community_profile_links();
    					change_user_background();
                        fix_profile_image_not_found();
    					break;
    
    				case /^\/(?:sharedfiles|workshop)\/.*/.test(window.location.pathname):
    					hide_greenlight_banner();
    					break;
                        
                    case /^\/market\/.*/.test(window.location.pathname):
    					load_inventory().done(function() {
    						highlight_market_items();
    						bind_ajax_content_highlighting();
    					});
    					add_market_total();
                        add_active_total();
    					break;
    
    				case /^\/app\/.*/.test(window.location.pathname):
    					var appid = get_appid(window.location.host + window.location.pathname);
    					add_app_page_highlights(appid);
                        add_steamdb_links(appid, "gamehub");
    					break;
    					
    				case /^\/games\/.*/.test(window.location.pathname):
    					var appid = document.querySelector( 'a[href*="http://steamcommunity.com/app/"]' );
    					appid = appid.href.match( /(\d)+/g );
    					add_steamdb_links(appid, "gamegroup");
    					break;
    
    			}
    			break;
    	}
    });
});