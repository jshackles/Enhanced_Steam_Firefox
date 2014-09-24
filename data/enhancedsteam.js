// Enhanced Steam v6.7
var apps;
var language;
var appid_promises = {};
var search_threshhold = $(window).height() - 80;

var total_requests = 0;
var processed_requests = 0;

var cookie = document.cookie;
if (cookie.match(/language=([a-z]{3})/i)) {
	language = cookie.match(/language=([a-z]{3})/i)[1];
} else {
	var language = "eng";
}
if (localized_strings[language] === undefined) { language = "eng"; }


// Run script in the context of the current tab
function runInPageContext(fun){
	var script  = document.createElement('script');
	script.textContent = '(' + fun + ')();';
	document.documentElement.appendChild(script);
	script.parentNode.removeChild(script);
}

// Chrome storage functions
function setValue(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function getValue(key) {
	var v = localStorage.getItem(key);
	if (v === undefined) return v;
	return JSON.parse(v);
}

function delValue(key) {
	localStorage.removeItem(key);
}

// Helper prototypes
function startsWith(string, search) {
	return string.indexOf(search) === 0;
};

function formatCurrency(number, type) {
	var places, symbol, thousand, decimal, right;

	switch (type) {
		case "BRL":
			places = 2; symbol = "R$ "; thousand = "."; decimal = ","; right = false;
			break;
		case "EUR":
			places = 2; symbol = "€"; thousand = ","; decimal = "."; right = true;
			break;
		case "GBP":
			places = 2; symbol = "£"; thousand = ","; decimal = "."; right = false;
			break;
		case "RUB":
			places = 0; symbol = " pуб."; thousand = ""; decimal = ","; right = true;
			if (number % 1 != 0) { places = 2; }
			break;
		case "JPY":
			places = 0; symbol = "¥ "; thousand = ","; decimal = "."; right = false;
			break;
		case "MYR":
			places = 2; symbol = "RM"; thousand = ","; decimal = "."; right = false;
			break;
		case "NOK":
			places = 2; symbol = " kr"; thousand = "."; decimal = ","; right = true;
			break;
		case "IDR":
			places = 2; symbol = "Rp "; thousand = ""; decimal = "."; right = false;
			break;
		case "PHP":
			places = 2; symbol = "P"; thousand = ","; decimal = "."; right = false;
			break;
		case "SGD":
			places = 2; symbol = "S$"; thousand = ","; decimal = "."; right = false;
			break;
		case "THB":
			places = 2; symbol = "฿"; thousand = ","; decimal = "."; right = false;
			break;
		case "VND":
			places = 2; symbol = "₫"; thousand = ","; decimal = "."; right = false;
			break;
		case "KRW":
			places = 2; symbol = "₩"; thousand = ","; decimal = "."; right = false;
			break;
		case "TRY":
			places = 2; symbol = " TL"; thousand = ""; decimal = ","; right = true;
			break;
		case "UAH":
			places = 2; symbol = "₴"; thousand = ""; decimal = ","; right = true;
			break;
		case "MXN":
			places = 2; symbol = "Mex$ "; thousand = ","; decimal = "."; right = false;
			break;
		case "CAD":
			places = 2; symbol = "C$ "; thousand = ","; decimal = "."; right = false;
			break;
		case "AUD":
			places = 2; symbol = "A$ "; thousand = ","; decimal = "."; right = false;
			break;
		case "NZD":
			places = 2; symbol = "NZ$ "; thousand = ","; decimal = "."; right = false;
			break;
		default:
			places = 2; symbol = "$"; thousand = ","; decimal = "."; right = false;
			break;
	}

	var negative = number < 0 ? "-" : "",
		i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
		j = (j = i.length) > 3 ? j % 3 : 0;
	if (right) {
		return negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "") + symbol;
	} else {
		return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
	}
}

function currency_symbol_to_type (currency_symbol) {
	switch (currency_symbol) {
		case "pуб":
			return "RUB";
		case "€":
			return "EUR";
		case "£":
			return "GBP";
		case "R$":
			return "BRL";
		case "¥":
			return "JPY";
		case "kr":
			return "NOK";
		case "Rp":
			return "IDR";
		case "RM":
			return "MYR";
		case "P":
			return "PHP";
		case "S$":
			return "SGD";
		case "฿":
			return "THB";
		case "₫":
			return "VND";
		case "₩":
			return "KRW";
		case "TL":
			return "TRY";
		case "₴":
			return "UAH";
		case "Mex$":
			return "MXN";
		case "C$":
			return "CAD";
		case "A$":
			return "AUD";
		case "NZ$":
			return "NZD";
		default:
			return "USD";
	}
}

function currency_symbol_from_string (string_with_symbol) {
	var return_string = "";
	if (string_with_symbol.match(/(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|C\$|A\$|NZ\$)/)) {
		return_string = string_with_symbol.match(/(?:R\$|S\$|\$|RM|kr|Rp|€|¥|£|฿|pуб|P|₫|₩|TL|₴|Mex\$|C\$|A\$|NZ\$)/)[0];
	}
	return return_string;
}

HTMLreplacements = { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" };

function escapeHTML(str) { 
	str = str.toString();
	var return_string = str.replace(/[&"<>]/g, function (m) HTMLreplacements[m]);
	return return_string;
}

function getCookie(name) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
}

function get_http(url, callback) {
	total_requests += 1;
	$("#es_progress").attr({"max": 100, "title": localized_strings[language].ready.loading});
	$("#es_progress").removeClass("complete");
	var http = new XMLHttpRequest();
	http.onreadystatechange = function () {
		if (this.readyState) {
			if (this.readyState == 4 && this.status == 200) {
				processed_requests += 1;
				var complete_percentage = (processed_requests / total_requests) * 100;
				$("#es_progress").val(complete_percentage);
				if (complete_percentage == 100) { $("#es_progress").addClass("complete").attr("title", localized_strings[language].ready.ready); }
				callback(this.responseText);
			}

			if (this.readyState == 4 && this.status != 200) {
				$("#es_progress").val(100).addClass("error").attr({"title":localized_strings[language].ready.errormsg, "max":1});
			}
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
		if (steamLogin) isSignedIn = steamLogin.replace(/%.*/, "").match(/^\d+/);
		signedInChecked = true;
	}
	return isSignedIn;
}

// colors the tile for owned games
function highlight_owned(node) {
	node.classList.add("es_highlight_owned");
    highlight_node(node, ownedColor);  
}

// colors the tile for wishlist games
function highlight_wishlist(node) {
	node.classList.add("es_highlight_wishlist");
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

	// Sale items
	if (node.classList.contains("summersale_dailydeal_ctn")) {
		$node = $(node).find(".dailydeal_footer");
	}

	if (node.classList.contains("vote_option_game")) {
		$node = $(node).find(".vote_option_info");
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
													if (startsWith(obj.descriptions[i].value, "Can't be applied with other discounts.")) {
														setValue(app.id + "coupon_discount_note", obj.descriptions[i].value);
														setValue(app.id + "coupon_discount_doesnt_stack", true);
													}
													else if (startsWith(obj.descriptions[i].value, "(Valid")) {
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
		
		// purge stale information from localStorage
		var i = 0, sKey;
		for (; sKey = window.localStorage.key(i); i++) {
			if (sKey.match(/coupon/)) { delValue(sKey); }
			if (sKey.match(/card:/)) { delValue(sKey); }
			if (sKey.match(/gift/)) { delValue(sKey); }
			if (sKey.match(/guestpass/)) { delValue(sKey); }
		}
		localStorage.setItem("inventory_time", parseInt(Date.now() / 1000, 10))

		if (profileurl) {
			get_http(profileurl + '/inventory/json/753/1/', handle_inv_ctx1);
			get_http(profileurl + '/inventory/json/753/3/', handle_inv_ctx3);        
			get_http(profileurl + '/inventory/json/753/6/', handle_inv_ctx6);
		}
	} else {		
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

function add_empty_wishlist_buttons() {
	if(is_signed_in) {
		var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");
		if (startsWith(window.location.pathname, profile)) {
			var empty_buttons = $("<div class='btn_save' id='es_empty_wishlist'>" + escapeHTML(localized_strings[language].empty_wishlist) + "</div>");
			$(".save_actions_enabled").filter(":last").after(empty_buttons);
			$("#es_empty_wishlist").click(empty_wishlist);
		}
	}
}

function add_wishlist_notes() {
	if(is_signed_in) {
		var profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com", "");
		if (window.location.pathname.startsWith(profile)) {
			$(".wishlistRow").each(function() {
				var appid = $(this).attr("id").replace("game_", "");
				$(this).find(".bottom_controls .popup_block2 .popup_body2").append("<a class='popup_menu_item2 tight es_add_wishlist_note' id='es_add_wishlist_note_" + appid + "'><h5>Add a wishlist note</h5></a>");
				if (getValue(appid + "wishlist_note")) {
					$(this).find("h4").after("<div class='es_wishlist_note'>" + getValue(appid + "wishlist_note") + "</div").css("padding-top", "6px");
					$("#es_add_wishlist_note_" + appid).find("h5").text("Update wishlist note");
					if ($(this).find(".es_wishlist_note")[0].scrollWidth > $(this).find(".es_wishlist_note")[0].clientWidth) { $(this).find(".es_wishlist_note").attr("title", getValue(appid + "wishlist_note")); }
				}
			});

			$(".es_add_wishlist_note").click(function() {
				$(".popup_block2").hide();
				var appid = $(this).attr("id").replace("es_add_wishlist_note_", "");
				if (getValue(appid + "wishlist_note")) {
					var note = prompt("Update your wishlist note", getValue(appid + "wishlist_note"));
				} else {
					var note = prompt("Enter your wishlist note", "");
				}
				switch (note) {
					case null:
						break;
					case "":
						delValue(appid + "wishlist_note");
						$("#game_" + appid).find(".es_wishlist_note").remove();
						break;
					default:
						setValue(appid + "wishlist_note", note);
						$("#game_" + appid).find(".es_wishlist_note").remove();
						$("#game_" + appid).find("h4").after("<div class='es_wishlist_note'>" + getValue(appid + "wishlist_note") + "</div").css("padding-top", "6px");
						if ($("#game_" + appid).find(".es_wishlist_note")[0].scrollWidth > $("#game_" + appid).find(".es_wishlist_note")[0].clientWidth) { $("#game_" + appid).find(".es_wishlist_note").attr("title", getValue(appid + "wishlist_note")); }
				}
			});
		}
	}
}

function empty_wishlist() {
	var conf_text = "Are you sure you want to empty your wishlist?\n\nThis action cannot be undone!";
	var conf = confirm(conf_text);
	if (conf) {
		var wishlist_class = ".wishlistRow";
		var deferreds = $(wishlist_class).map(function(i, $obj) {
			var deferred = new $.Deferred();
			var appid = get_appid_wishlist($obj.id),
				profile = $(".playerAvatar a")[0].href.replace("http://steamcommunity.com/", ""),
				session = decodeURIComponent(cookie.match(/sessionid=(.+?);/i)[1]);

			$.ajax({
				type:"POST",
				url: "http://steamcommunity.com/" + profile + "/wishlist/",
				data:{
					sessionid: session,
					action: "remove",
					appid: appid
				},
				success: function( msg ) {
					deferred.resolve();
				}
			});

			return deferred.promise();
		});

		$.when.apply(null, deferreds).done(function(){
			location.reload();
		});
	}
}

function add_wishlist_filter() {
    var html  = "<span>" + escapeHTML(localized_strings[language].show) + ": </span>";
		html += "<label class='es_sort' id='es_wl_all'><input type='radio' name='es_wl_sort' checked><span><a>" + escapeHTML(localized_strings[language].games_all) + "</a></span></label>";
		html += "<label class='es_sort' id='es_wl_sale'><input type='radio' name='es_wl_sort'><span><a>" + escapeHTML(localized_strings[language].games_discount) + "</a></span></label>";
    	//html += "<label class='es_sort' id='es_wl_coupon'><input type='radio' name='es_wl_sort'><span><a>" + escapeHTML(localized_strings[language].games_coupon + "</a></span></label>";
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

function add_wishlist_ajaxremove() {
	$("a[onclick*=wishlist_remove]").each(function() {		
		var appid = $(this).parent().parent()[0].id.replace("game_", "");
		$(this).after("<span class='es_wishlist_remove' id='es_wishlist_remove_" + escapeHTML(appid) + "'>" + escapeHTML($(this).text()) + "</span>");
		$(this).remove();
		var session = decodeURIComponent(cookie.match(/sessionid=(.+?);/i)[1]);

		$("#es_wishlist_remove_" + appid).on("click", function() {
			$.ajax({
				type:"POST",
				url: window.location,
				data:{
					sessionid: session,
					action: "remove",
					appid: appid
				},
				success: function( msg ) { 
					var currentRank = parseFloat($("#game_" + appid + " .wishlist_rank")[0].value);
					$("#game_" + appid).remove();
					setValue(appid + "wishlisted", false);
					for (var i = 0; i < $('.wishlistRow').length; i++) {
						if ($('.wishlist_rank')[i].value > currentRank) {
							$('.wishlist_rank')[i].value = $('.wishlist_rank')[i].value - 1;	
						}
					}
				}
			});
		});
	});
}

function pack_split(node, ways) {
	var price_text = $(node).find(".discount_final_price").html();
	var at_end, comma, places = 2;
	if (price_text == null) { price_text = $(node).find(".game_purchase_price").html(); }
	if (price_text.match(/,\d\d(?!\d)/)) {
		at_end = true;
		comma = true;
		price_text = price_text.replace(",", ".");
	}
	var currency_symbol = currency_symbol_from_string(price_text);
	var currency_type = currency_symbol_to_type(currency_symbol);
	var price = (Number(price_text.replace(/[^0-9\.]+/g,""))) / ways;
	price = (Math.ceil(price * 100) / 100);
	price_text = formatCurrency(price, currency_type);
	$(node).find(".btn_addtocart").last().before(
		"<div class='es_each_box'><div class='es_each_price'>" + price_text + "</div><div class='es_each'>"+localized_strings[language].each+"</div></div>"
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

		else if (title.contains(' 3 pack') && !title.contains('doom 3')) { pack_split(this, 3); }
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
	document.getElementsByClassName("btnv6_blue_hoverfade")[0].click();
}

function add_steamchart_info(appid) {
    if ($(".game_area_dlc_bubble").length == 0) {
		if (showsteamchartinfo === true) {
			get_http("http://api.enhancedsteam.com/charts/?appid=" + appid, function (txt) {
				if (txt.length > 0) {
					var data = JSON.parse(txt);
					if (data["chart"]) {
						var html = '<div id="steam-charts" class="game_area_description"><h2>' + escapeHTML(localized_strings[language].charts.current) + '</h2>';
						html += '<div id="chart-heading" class="chart-content"><div id="chart-image"><img src="http://cdn.akamai.steamstatic.com/steam/apps/' + escapeHTML(appid) + '/capsule_184x69.jpg" width="184" height="69"></div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["current"]) + '</span><br>' + escapeHTML(localized_strings[language].charts.playing_now) + '</div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["peaktoday"]) + '</span><br>' + escapeHTML(localized_strings[language].charts.peaktoday) + '</div><div class="chart-stat">';
						html += '<span class="num">' + escapeHTML(data["chart"]["peakall"]) + '</span><br>' + escapeHTML(localized_strings[language].charts.peakall) + '</div><span class="chart-footer">Powered by <a href="http://steamcharts.com/app/' + escapeHTML(appid) + '" target="_blank">SteamCharts.com</a></span></div></div>';
						
						$(".sys_req").parent().before(html);
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
	$dropdown_options_container = $("<div class=\"popup_block_new\"><div class=\"popup_body popup_menu\" id=\"es_popup\"></div></div>");
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

	$website_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"http://www.enhancedsteam.com\">" + escapeHTML(localized_strings[language].website) + "</a>");
	$contribute_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam_Firefox\">" + escapeHTML(localized_strings[language].contribute) + "</a>");
	$translate_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//translation.enhancedsteam.com\">" + escapeHTML(localized_strings[language].translate) + "</a>");
	$bug_feature_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//github.com/jshackles/Enhanced_Steam_Firefox/issues\">" + escapeHTML(localized_strings[language].bug_feature) + "</a>");
	$donation_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//enhancedsteam.com/donate.php\">" + escapeHTML(localized_strings[language].donate) + "</a>");
	$group_link = $("<a class=\"popup_menu_item\" target=\"_blank\" href=\"//" + escapeHTML(localized_strings[language].official_group_url) + "\">" + escapeHTML(localized_strings[language].official_group) + "</a>");

	$clear_cache_link = $("<a class=\"popup_menu_item\" href=\"\">" + escapeHTML(localized_strings[language].clear_cache) + "</a>");
	$clear_cache_link.click(function(){
		localStorage.clear();
		location.reload();
	});

	$spacer = $("<div class=\"hr\"></div>");

	$dropdown_options.append($clear_cache_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($contribute_link);
	$dropdown_options.append($translate_link);
	$dropdown_options.append($bug_feature_link);
	$dropdown_options.append($spacer.clone());
	$dropdown_options.append($website_link);
	$dropdown_options.append($group_link);
	$dropdown_options.append($donation_link);

	$("#global_action_menu")
		.before($dropdown)
		.before($dropdown_options_container);

	$("#global_actions").after("<progress id='es_progress' class='complete' value='1' max='1' title='" + localized_strings[language].ready.ready + "'></progress>");
}

function add_fake_country_code_warning() {
	var LKGBillingCountry = getCookie("LKGBillingCountry");
	var fakeCC = getCookie("fakeCC");

	if (fakeCC && LKGBillingCountry && LKGBillingCountry.length == 2 && LKGBillingCountry != fakeCC) {
		$("#global_header").after('<div class=content style="background-image: url( ' + self.options.img_red_banner + ' ); height: 21px; text-align: center; padding-top: 8px;">' + escapeHTML(localized_strings[language].using_store.replace("__current__", escapeHTML(fakeCC))) + '  <a href="#" id="reset_fake_country_code">' + escapeHTML(localized_strings[language].using_store_return.replace("__base__", escapeHTML(LKGBillingCountry))) + '</a></div>');
		$("#page_background_holder").css("top", "135px");
		$("#reset_fake_country_code").click(function(e) {
			e.preventDefault();
			document.cookie = 'fakeCC=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
			window.location.replace(window.location.href.replace(/[?&]cc=.{2}/, ""));
		})
	}
}

// Displays warning if browsing in a different language
function add_language_warning() {
	if (showlanguagewarning) {
		var currentLanguage = "English";
		if (cookie.match(/language=([a-z]+)/i)) {
			currentLanguage = cookie.match(/language=([a-z]+)/i)[1];
		}
		currentLanguage = currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);

		function make_language_pretty(language_string) {
			switch (language_string) {
				case "Schinese": return "Simplified Chinese"; break;
				case "Tchinese": return "Traditional Chinese"; break;
				case "Koreana":	return "Korean"; break;
				default: return language_string; break;
			}
		}

		var lang = showlanguagewarninglanguage.toLowerCase().slice(0,3);

		currentLanguage = make_language_pretty(currentLanguage);
		showlanguagewarninglanguage = make_language_pretty(showlanguagewarninglanguage);

		if (showlanguagewarninglanguage != currentLanguage) {
			if (localized_strings[lang] && localized_strings[lang].using_language && localized_strings[lang].using_language_return) {
				$("#global_header").after('<div class=content style="background-image: url( ' + self.options.img_red_banner + '); color: #ffffff; font-size: 12px; height: 21px; text-align: center; padding-top: 8px;">' + escapeHTML(localized_strings[lang].using_language.replace("__current__", currentLanguage)) + '  <a href="#" id="reset_language_code">' + escapeHTML(localized_strings[lang].using_language_return.replace("__base__", showlanguagewarninglanguage)) + '</a></div>');
			} else {
				$("#global_header").after('<div class=content style="background-image: url( ' + self.options.img_red_banner + '); color: #ffffff; font-size: 12px; height: 21px; text-align: center; padding-top: 8px;">' + escapeHTML(localized_strings["eng"].using_language.replace("__current__", currentLanguage)) + '  <a href="#" id="reset_language_code">' + escapeHTML(localized_strings["eng"].using_language_return.replace("__base__", showlanguagewarninglanguage)) + '</a></div>');
			}
			$("#page_background_holder").css("top", "135px");
			$("#reset_language_code").click(function(e) {
				e.preventDefault();
				document.cookie = 'Steam_Language=' + showlanguagewarninglanguage.toLowerCase() + ';path=/;';
				window.location.replace(window.location.href.replace(/[?&]l=[a-z]+/, ""));
			});
		}
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

function add_header_links() {
	var supernav_content = document.querySelectorAll("#supernav .supernav");
	if ($("#supernav").length > 0) {
		// add "Forums" after "Workshop"
		var community = $("#supernav").find("a[href='http://steamcommunity.com/']").attr("data-tooltip-content");
		var insertAt = community.match(/\/workshop\/">(.+)<\/a>/);
		community = community.substr(0, (insertAt.index + insertAt[0].length)) + '<a class="submenuitem" href="http://forums.steampowered.com/forums/" target="_blank">' + localized_strings[language].forums + '</a>' + community.substr(insertAt.index + insertAt[0].length);
		$("#supernav").find("a[href='http://steamcommunity.com/']").attr("data-tooltip-content", community);

		if (is_signed_in()) {
			var user = $("#supernav").find("a[href$='/home/']").attr("data-tooltip-content");
			var insertAt = user.match(/\/home\/">(.+)<\/a>/);
			user = user.substr(0, (insertAt.index + insertAt[0].length)) + '<a class="submenuitem" href="http://steamcommunity.com/my/games/">' + localized_strings[language].games + '</a>' + user.substr(insertAt.index + insertAt[0].length);
			user = user + '<a class="submenuitem" href="http://steamcommunity.com/my/recommended/">' + localized_strings[language].reviews + '</a>';
			$("#supernav").find("a[href$='/home/']").attr("data-tooltip-content", user);
		}
	}
}

function add_custom_wallet_amount() {
	var addfunds = $(".addfunds_area_purchase_game:first").clone();
	$(addfunds).addClass("es_custom_funds");
	$(addfunds).find(".btnv6_green_white_innerfade").addClass("es_custom_button");
	$(addfunds).find("h1").text(localized_strings[language].wallet.custom_amount);
	$(addfunds).find("p").text(localized_strings[language].wallet.custom_amount_text.replace("__minamount__", $(addfunds).find(".price").text().trim()));
	var currency_symbol = currency_symbol_from_string($(addfunds).find(".price").text().trim());
	var minimum = $(addfunds).find(".price").text().trim().replace(/(?:R\$|\$|€|¥|£|pуб)/, "");
	var formatted_minimum = minimum;
	switch (currency_symbol) {
		case "€":
		case "pуб":
			$(addfunds).find(".price").html("<input id='es_custom_funds_amount' class='es_text_input' style='margin-top: -3px;' size=4 value='" + escapeHTML(minimum) +"'> " + escapeHTML(currency_symbol));
			break;
		default:
			$(addfunds).find(".price").html(currency_symbol + " <input id='es_custom_funds_amount' class='es_text_input' style='margin-top: -3px;' size=4 value='" + escapeHTML(minimum) +"'>");
			break;
	}
	$("#game_area_purchase .addfunds_area_purchase_game:first").after(addfunds);
	$("#es_custom_funds_amount").change(function() {
		// Make sure two numbers are entered after the separator
		if (!($("#es_custom_funds_amount").val().match(/(\.|\,)\d\d$/))) { $("#es_custom_funds_amount").val($("#es_custom_funds_amount").val().replace(/\D/g, "")); }

		// Make sure the user entered decimals.  If not, add 00 to the end of the number to make the value correct
		if (currency_symbol == "€" || currency_symbol == "pуб" || currency_symbol == "R$") {
			if ($("#es_custom_funds_amount").val().indexOf(",") == -1) $("#es_custom_funds_amount").val($("#es_custom_funds_amount").val() + ",00");
		} else {
			if ($("#es_custom_funds_amount").val().indexOf(".") == -1) $("#es_custom_funds_amount").val($("#es_custom_funds_amount").val() + ".00");
		}

		var calculated_value = $("#es_custom_funds_amount").val().replace(/-/g, "0").replace(/\D/g, "").replace(/[^A-Za-z0-9]/g, '');
		$("#es_custom_funds_amount").val($("#es_custom_funds_amount").val().replace(/[A-Za-z]/g, ''));
		$(".es_custom_button").attr("href", "javascript:submitAddFunds( " + escapeHTML(calculated_value) + " );")
	});
}

function add_empty_cart_button() {
	addtext = "<a id='es_empty_cart' class='es_empty btnv6_green_white_innerfade btn_medium continue' style='float: left;'><span>" + escapeHTML(localized_strings[language].empty_cart) + "</span></a>";
	$(".checkout_content").prepend(addtext);
	if ($(".cart_row").length === 0) {
		$(".es_empty").addClass("btn_disabled");
	}
	$("#es_empty_cart").on("click", function() {
		document.cookie = 'shoppingCartGID' + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
		location.href=location.href;
	});
}

// User profile pages
function add_community_profile_links() {
    if (showprofilelinks == true) {
        if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
        if (steamID === undefined) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }
    	var ico_steamrep, ico_steamtrades, ico_steamgifts, ico_achievementstats, ico_backpacktf, ico_astats;
    	var ico_steamdb = self.options.img_ico_steamdb;

    	switch (showprofilelinks_display) {
    		case 0:
    			ico_steamrep = self.options.img_ico_steamrep;
    			ico_steamtrades = self.options.img_ico_steamtrades;
    			ico_steamgifts = self.options.img_ico_steamgifts;
    			ico_achievementstats = self.options.img_ico_achievementstats;
    			ico_backpacktf = self.options.img_ico_backpacktf;
    			ico_astats = self.options.img_ico_astatsnl;
    			break;
    		case 1:
    			ico_steamrep = self.options.img_ico_steamrep_col;
    			ico_steamtrades = self.options.img_ico_steamtrades_col;
    			ico_steamgifts = self.options.img_ico_steamgifts_col;
    			ico_achievementstats = self.options.img_ico_achievementstats_col;
    			ico_backpacktf = self.options.img_ico_backpacktf_col;
    			ico_astats = self.options.img_ico_astatsnl_col;
    			break;
    	}

    	var htmlstr = '';
    	htmlstr += '<div class="profile_count_link"><a href="http://steamrep.com/profiles/' + escapeHTML(steamID) + '" target="_blank"><span class="count_link_label">SteamRep</span>&nbsp;<span class="profile_count_link_total">';
    	if (showprofilelinks_display != 2) { htmlstr += '<img src="' + escapeHTML(ico_steamrep) + '" class="profile_link_icon">'; }
    	htmlstr += '<div class="profile_count_link"><a href="http://steamdb.info/calculator/?player=' + escapeHTML(steamID) + '" target="_blank"><span class="count_link_label">SteamDB</span>&nbsp;<span class="profile_count_link_total">';
    	if (showprofilelinks_display != 2) { htmlstr += '<img src="' + escapeHTML(ico_steamdb) + '" class="profile_link_icon">'; }
    	htmlstr += '<div class="profile_count_link"><a href="http://www.steamtrades.com/user/id/' + escapeHTML(steamID) + '" target="_blank"><span class="count_link_label">SteamTrades</span>&nbsp;<span class="profile_count_link_total">';
    	if (showprofilelinks_display != 2) { htmlstr += '<img src="' + escapeHTML(ico_steamtrades) + '" class="profile_link_icon">'; }
    	htmlstr += '<div class="profile_count_link"><a href="http://www.steamgifts.com/user/id/' + escapeHTML(steamID) + '" target="_blank"><span class="count_link_label">SteamGifts</span>&nbsp;<span class="profile_count_link_total">';
    	if (showprofilelinks_display != 2) { htmlstr += '<img src="' + escapeHTML(ico_steamgifts) + '" class="profile_link_icon">'; }
    	htmlstr += '<div class="profile_count_link"><a href="http://www.achievementstats.com/index.php?action=profile&playerId=' + escapeHTML(steamID) + '" target="_blank"><span class="count_link_label">Achievement Stats</span>&nbsp;<span class="profile_count_link_total">';
    	if (showprofilelinks_display != 2) { htmlstr += '<img src="' + escapeHTML(ico_achievementstats) + '" class="profile_link_icon">'; }
    	htmlstr += '<div class="profile_count_link"><a href="http://backpack.tf/profiles/' + escapeHTML(steamID) + '" target="_blank"><span class="count_link_label">Backpack.tf</span>&nbsp;<span class="profile_count_link_total">';
    	if (showprofilelinks_display != 2) { htmlstr += '<img src="' + escapeHTML(ico_backpacktf) + '" class="profile_link_icon">'; }
    	htmlstr += '<div class="profile_count_link"><a href="http://astats.astats.nl/astats/User_Info.php?steamID64=' + escapeHTML(steamID) + '" target="_blank"><span class="count_link_label">AStats.nl</span>&nbsp;<span class="profile_count_link_total">';
    	if (showprofilelinks_display != 2) { htmlstr += '<img src="' + escapeHTML(ico_astats) + '" class="profile_link_icon">'; }
    	if (htmlstr != '') { $(".profile_item_links").append(htmlstr); }

    	if ($(".profile_item_links").length == 0) {
			$(".profile_rightcol").append("<div class='profile_item_links'>");
			$(".profile_item_links").append(htmlstr);
			$(".profile_rightcol").after("<div style='clear: both'></div>");
		}
    }
}

// Fix "No image available" in wishlist
function fix_wishlist_image_not_found() {
	var items = document.getElementById("wishlist_items");
	if (items) {
		imgs = items.getElementsByTagName("img");
		for (var i = 0; i < imgs.length; i++)
		if (imgs[i].src == "http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/33/338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2.gif") {
			var gameurl = imgs[i].parentNode.href;
			imgs[i].src = "http://cdn.akamai.steamstatic.com/steam/apps/" + gameurl.substring(gameurl.lastIndexOf("/") + 1) + "/header.jpg";
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

function add_wishlist_profile_link() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

	$(".profile_item_links").find(".profile_count_link:first").after("<div class='profile_count_link' id='es_wishlist_link'><a href='http://steamcommunity.com/profiles/" + escapeHTML(steamID) + "/wishlist'><span class='count_link_label'>" + localized_strings[language].wishlist + "</span>&nbsp;<span class='profile_count_link_total' id='es_wishlist_count'></span></a></div>");

	// Get count of wishlisted items
	get_http("http://steamcommunity.com/profiles/" + steamID + "/wishlist", function(txt) {
		var html = $.parseHTML(txt);
		var count = ($(html).find(".wishlistRow").length);

		if (count) { $("#es_wishlist_count").text(count); } else { $('#es_wishlist_link').remove(); }
	});	
}

// Adds supporter badges to supporter's profiles
function add_supporter_badges() {
	if ($("#reportAbuseModal").length > 0) { var steamID = document.getElementsByName("abuseID")[0].value; }
	if (steamID === undefined) { var steamID = document.documentElement.outerHTML.match(/steamid"\:"(.+)","personaname/)[1]; }

	get_http("http://api.enhancedsteam.com/supporter/?steam_id=" + steamID, function(txt) {
		var data = JSON.parse(txt);
		var badge_count = data["badges"].length;

		if (badge_count > 0) {
			var html = '<div class="profile_badges"><div class="profile_count_link"><a href="http://www.EnhancedSteam.com"><span class="count_link_label">' + escapeHTML(localized_strings[language].es_supporter) + '</span>&nbsp;<span class="profile_count_link_total">' + escapeHTML(data["num_badges"].toString()) + '</span></a></div>';

			for (i=0; i < data["badges"].length; i++) {
				if (data["badges"][i].link) {
					html += '<div class="profile_badges_badge "><a href="' + escapeHTML(data["badges"][i].link) + '" title="' + escapeHTML(data["badges"][i].title) + '"><img src="' + escapeHTML(data["badges"][i].img) + '"></a></div>';
				} else {
					html += '<div class="profile_badges_badge "><img src="' + escapeHTML(data["badges"][i].img) + '" title="' + escapeHTML(data["badges"][i].title) + '"></div>';
				}
			}

			html += '<div style="clear: left;"></div></div>';
			$(".profile_badges").after(html);
			$("#es_supporter_badges .profile_badges_badge:last").addClass("last");
		}
	});
}

function appdata_on_wishlist() {
	$('a.btn_visit_store').each(function (index, node) {
		var app = get_appid(node.href);
		get_http('http://store.steampowered.com/api/appdetails/?appids=' + app, function (data) {
			var storefront_data = JSON.parse(data);
			$.each(storefront_data, function(appid, app_data) {
				if (app_data.success) {
					if (app_data.data.packages && app_data.data.packages[0]) {
						var htmlstring = '<form name="add_to_cart_' + escapeHTML(app_data.data.packages[0].toString()) + '" action="http://store.steampowered.com/cart/" method="POST">';
						htmlstring += '<input type="hidden" name="snr" value="1_5_9__403">';
						htmlstring += '<input type="hidden" name="action" value="add_to_cart">';
						htmlstring += '<input type="hidden" name="subid" value="' + escapeHTML(app_data.data.packages[0].toString()) + '">';
						htmlstring += '</form>';
						$(node).before('</form>' + htmlstring + '<a href="#" onclick="document.forms[\'add_to_cart_' + escapeHTML(app_data.data.packages[0].toString()) + '\'].submit();" class="btn_visit_store">' + escapeHTML(localized_strings[language].add_to_cart) + '</a>  ');
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
	});
}

function add_advanced_cancel() {
	$("#advanced_search_controls").find(".control:first").append("<div id='es_advanced_cancel' style='display: inline-block;'>(<a style='cursor: pointer;'>" + escapeHTML(localized_strings[language].cancel) + "</a>)</div>");
	$("#es_advanced_cancel").click(function() {
		$("#advanced_search_ctn").hide();
		$("#advanced_search_toggle").show();
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
	"                    <img src=\"http://cdn.steamcommunity.com/economy/image/" + escapeHTML(getValue(appid + "coupon_imageurl")) + "\"/>" +
	"                </td>" +
	"                <td valign=center>" +
	"                    <h1>" + escapeHTML(getValue(appid + "coupon_title")) + "</h1>" +
	"                </td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" + escapeHTML(coupon_discount_note) + "</td>" +
	"            </tr>" +
	"            <tr>" +
	"                <td>" +
	"                    <font style=\"color:#A75124;\">" + escapeHTML(coupon_date) + "</font>" +
	"                </td>" +
	"            </tr>" +
	"        </table>" +
	"    </div>" +
	"</div>"));

    var price_div = $("[itemtype=\"http://schema.org/Offer\"]");
	var	cart_id = $(document).find("[name=\"subid\"]")[0].value;
	var actual_price_container = $(price_div).find("[itemprop=\"price\"]").text().trim();
	var currency_symbol = currency_symbol_from_string(actual_price_container);
	var currency_type = currency_symbol_to_type(currency_symbol);
	var comma = actual_price_container.search(/,\d\d(?!\d)/);

	if (comma > -1) {
		actual_price_container = actual_price_container.replace(",", ".");
	} else {
		actual_price_container = actual_price_container.replace(",", "");
	}

	var original_price = parseFloat(actual_price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1]);
	var discounted_price = (original_price - (original_price * getValue(appid + "coupon_discount") / 100).toFixed(2)).toFixed(2);

	if (!(price_div.find(".game_purchase_discount").length > 0 && getValue(appid + "coupon_discount_doesnt_stack"))) {
		$(price_div).html("<div class=\"game_purchase_action_bg\">" +
			"    <div class=\"discount_block game_purchase_discount\">" +
			"        <div class=\"discount_pct\">-" + getValue(appid + "coupon_discount") + "%</div>" +
			"        <div class=\"discount_prices\">" +
			"            <div class=\"discount_original_price\">" + formatCurrency(original_price, currency_type) + "</div>" +
			"            <div class=\"discount_final_price\" itemprop=\"price\">" + formatCurrency(discounted_price, currency_type) + "</div>" +
			"        </div>" +
			"    </div>" +
			"<div class=\"btn_addtocart\">" +
			"        <a class=\"btnv6_green_white_innerfade btn_medium\" href=\"javascript:addToCart( " + cart_id + ");\"><span>" + localized_strings[language].add_to_cart + "</span></a>" +
			"    </div>" +
			"</div>");
	}
}

function show_pricing_history(appid, type) {
    if (showpricehistory == true) {
        storestring = "steam,amazonus,impulse,gamersgate,greenmangaming,gamefly,origin,uplay,indiegalastore,gametap,gamesplanet,getgames,desura,gog,dotemu,fireflower,gameolith,humblewidgets,adventureshop,nuuvem,shinyloot,dlgamer,humblestore,indiegamestand,squenix,bundlestars";

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
    	
    	function get_price_data(lookup_type, node, id) {	
			get_http("http://api.enhancedsteam.com/pricev2/?search=" + lookup_type + "/" + id + "&stores=" + storestring + "&cc=" + cc + "&coupon=true", function (txt) {
				var data = JSON.parse(txt);
				if (data) {
					var activates = "", line1 = "", line2 = "", line3 = "", html, recorded, currency_symbol, comma = false, at_end = false;
					var currency_type = data[".meta"]["currency"];

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
							activates = "(<b>" + escapeHTML(localized_strings[language].activates) + "</b>)";
							if (data["price"]["store"] == "Steam") {
								activates = "";
							}
						}

						line1 = escapeHTML(localized_strings[language].lowest_price) + ': ' + formatCurrency(escapeHTML(data["price"]["price"].toString()), currency_type) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + escapeHTML(localized_strings[language].info) + '</a>)';
						
						if (data["price"]["price_voucher"]) {
							line1 = escapeHTML(localized_strings[language].lowest_price) + ': ' + formatCurrency(escapeHTML(data["price"]["price_voucher"].toString()), currency_type) + ' at <a href="' + escapeHTML(data["price"]["url"].toString()) + '" target="_blank">' + escapeHTML(data["price"]["store"].toString()) + '</a> ' + escapeHTML(localized_strings[language].after_coupon) + ' <b>' + escapeHTML(data["price"]["voucher"].toString()) + '</b> ' + activates + ' (<a href="' + escapeHTML(data["urls"]["info"].toString()) + '" target="_blank">' + escapeHTML(localized_strings[language].info) + '</a>)';
						}
					}

					// "Historical Low"
					if (data["lowest"]) {
						recorded = new Date(data["lowest"]["recorded"]*1000);
						line2 = escapeHTML(localized_strings[language].historical_low) + ': ' + formatCurrency(escapeHTML(data["lowest"]["price"].toString()), currency_type) + ' at ' + escapeHTML(data["lowest"]["store"].toString()) + ' on ' + escapeHTML(recorded.toDateString()) + ' (<a href="' + escapeHTML(data["urls"]["history"].toString()) + '" target="_blank">Info</a>)';
					}

					var html = "<div class='es_lowest_price' id='es_price_" + escapeHTML(id.toString()) + "'><div class='gift_icon' id='es_line_chart_" + escapeHTML(id.toString()) + "'><img src='" + self.options.img_line_chart + "'></div>";

					// "Number of times this game has been in a bundle"
					if (data["bundles"]["count"] > 0) {
						line3 = "<br>" + escapeHTML(localized_strings[language].bundle.bundle_count) + ": " + data["bundles"]["count"] + ' (<a href="' + escapeHTML(data["urls"]["bundle_history"].toString()) + '" target="_blank">Info</a>)';						
					}

					if (line1 && line2) {
						$(node).before(html + line1 + "<br>" + line2 + line3);
						$("#es_line_chart_" + id).css("top", (($("#es_price_" + id).outerHeight() - 20) / 2) + "px");
					}

					if (data["bundles"]["active"].length > 0) {
						var length = data["bundles"]["active"].length;
						for (var i = 0; i < length; i++) {
							var enddate;
							if (data["bundles"]["active"][i]["expiry"]) {
								enddate = new Date(data["bundles"]["active"][i]["expiry"]*1000);
							}
							var currentdate = new Date().getTime();
							if (!enddate || currentdate < enddate) {
								if (data["bundles"]["active"][i]["page"]) { purchase = '<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings[language].buy + ' ' + data["bundles"]["active"][i]["page"] + ' ' + data["bundles"]["active"][i]["title"] + '</h1>'; } 
								else { purchase = '<div class="game_area_purchase_game_wrapper"><div class="game_area_purchase_game"><div class="game_area_purchase_platform"></div><h1>' + localized_strings[language].buy + ' ' + data["bundles"]["active"][i]["title"] + '</h1>'; }
								if (enddate) purchase += '<p class="game_purchase_discount_countdown">' + localized_strings[language].bundle.offer_ends + ' ' + enddate + '</p>';
								purchase += '<p class="package_contents"><b>' + localized_strings[language].bundle.includes.replace("(__num__)", data["bundles"]["active"][i]["games"].length) + ':</b> '
								data["bundles"]["active"][i]["games"].forEach(function(entry) {
									purchase += entry + ", ";
								});
								purchase = purchase.replace(/, $/, "");
								purchase += '</p><div class="game_purchase_action"><div class="game_purchase_action_bg"><div class="btn_addtocart btn_packageinfo"><div class="btn_addtocart_left"></div><a class="btn_addtocart_content" href="' + data["bundles"]["active"][i]["details"] + '" target="_blank">' + localized_strings[language].bundle.info + '</a><div class="btn_addtocart_right"></div></div></div><div class="game_purchase_action_bg">';
								if (data["bundles"]["active"][i]["price"] > 0) {										
									if (data["bundles"]["active"][i]["pwyw"]) {
										purchase += '<div class="es_each_box" itemprop="price">';
										purchase += '<div class="es_each">' + localized_strings[language].bundle.at_least + '</div><div class="es_each_price" style="text-align: right;">' + formatCurrency(escapeHTML(data["bundles"]["active"][i]["price"].toString()), currency_type) + '</div>';
									} else {
										purchase += '<div class="game_purchase_price price" itemprop="price">';
										purchase += formatCurrency(escapeHTML(data["bundles"]["active"][i]["price"].toString()), currency_type);
									}
								 }
								purchase += '</div><div class="btn_addtocart"><div class="btn_addtocart_left"></div>';
								purchase += '<a class="btn_addtocart_content" href="' + data["bundles"]["active"][i]["url"] + '" target="_blank">';
								purchase += localized_strings[language].buy;
								purchase += '</a><div class="btn_addtocart_right"></div></div></div></div></div></div>';
								$("#game_area_purchase").after(purchase);
								
								$("#game_area_purchase").after("<h2 class='gradientbg'>" + localized_strings[language].bundle.header + " <img src='http://cdn3.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></h2>");
							}
						}
					}
				}
			});
		}

		switch (type) {
			case "app":
				get_price_data(type, $(".game_area_purchase_game_wrapper:first"), appid);

				$(".game_area_purchase_game_wrapper").not(".game_area_purchase_game_wrapper:first").each(function() {
					var subid = $(this).find("input[name=subid]").val();
					get_price_data("sub", $(this), subid);
				});
				break;
			case "sub":
				get_price_data(type, $(".game_area_purchase_game:first"), appid);
				break;
		}
    }
}

// Add Steam user review score
function add_steamreview_userscore(appid) {
	if ($(".game_area_dlc_bubble,.noReviewsYetTitle").length === 0) {
		var positive = 0,
			negative = 0;

		positive = parseFloat($("#ReviewsTab_positive").find("span:last").text().replace(/\(|\)|,/g, ""));
		negative = parseFloat($("#ReviewsTab_negative").find("span:last").text().replace(/\(|\)|,/g, ""));

		var pos_percent = ((positive / (positive + negative)) * 100).toFixed(0),
			neg_percent = ((negative / (positive + negative)) * 100).toFixed(0);

		if (!isNaN(pos_percent) && !isNaN(neg_percent)) {
			$(".game_details").find(".details_block:first").before('<div id="es_review_score"><div style="display: inline-block; margin-right: 25px;"><img src="http://store.akamai.steamstatic.com/public/shared/images/userreviews/icon_thumbsUp_v6.png" width="24" height="24" class="es_review_image"><span class="es_review_text"> ' + pos_percent + '%</span></div><div style="display: inline-block;"><img src="http://store.akamai.steamstatic.com/public/shared/images/userreviews/icon_thumbsDown_v6.png" width="24" height="24" class="es_review_image"><span class="es_review_text"> ' + neg_percent + '%</span></div><div style="clear: both;"></div></div>');
		}
	}
}

function add_hltb_info(appid) {
	if (showhltb == true) {
		get_http("http://api.enhancedsteam.com/hltb/?appid=" + appid, function (txt) {
			if (txt.length > 0) {
				var data = JSON.parse(txt);
				if (data["hltb"]) {
					how_long_html = "<div class='block game_details underlined_links'>"
						+ "<div class='block_header'><h4>How Long to Beat</h4></div>"
						+ "<div class='block_content'><div class='block_content_inner'><div class='details_block'>";
					if (data["hltb"]["main_story"]){
						how_long_html += "<b>" + localized_strings[language].hltb.main + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_story']) + "</span><br>";
					}
					if (data["hltb"]["main_extras"]){
						how_long_html += "<b>" + localized_strings[language].hltb.main_e + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['main_extras']) + "</span><br>";
					}
					if (data["hltb"]["comp"]) {
						how_long_html += "<b>" + localized_strings[language].hltb.compl + ":</b><span style='float: right;'>" + escapeHTML(data['hltb']['comp']) + "</span><br>"
					}
					how_long_html += "</div>"
						+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['url']) + "' target='_blank'>" + localized_strings[language].more_information + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
						+ "<a class='linkbar' href='" + escapeHTML(data['hltb']['submit_url']) + "' target='_blank'>" + localized_strings[language].hltb.submit + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"
						+ "</div></div></div>";
					$("div.game_details:first").after(how_long_html);
				}
			}
		});	
	}
}

function add_pcgamingwiki_link(appid) {
	if (showpcgw == true) {
		get_http("http://api.enhancedsteam.com/pcgw/?appid=" + appid, function (txt) {
			if (txt) {
				var data = JSON.parse(txt);
				for (var game_name in data["results"]) break;
				var url = data["results"][game_name]["fullurl"];
				$('#demo_block').find('.block_content_inner').prepend('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="' + url + '" style="background-image:url(' + self.options.img_pcgw + ')">' + localized_strings[language].wiki_article.replace("__pcgw__","PC Gaming Wiki") + '</a></div>');
			}
		});
	}
}

// Add link to Steam Card Exchange
function add_steamcardexchange_link(appid){
	if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
		$("#demo_block").find('.block_content_inner').prepend('<div class="demo_area_button"><a class="game_area_wishlist_btn" target="_blank" href="http://www.steamcardexchange.net/index.php?gamepage-appid-' + appid + '" style="background-image:url(' + self.options.img_steamcardexchange_store + ')">' + localized_strings[language].view_in + ' Steam Card Exchange</a></div>');
	}
}

function add_widescreen_certification(appid) {
    if (showwsgf == true) {
        if (document.URL.indexOf("store.steampowered.com/app/") >= 0) {    
        	if (document.body.innerHTML.indexOf("<p>Requires the base game <a href=") <= 0) { 
        		// check to see if game data exists
                get_http("http://api.enhancedsteam.com/wsgf/?appid=" + appid, function (txt) {
        			$("div.game_details:first").each(function (index, node) {
						var data = JSON.parse(txt);
						if (data["node"]) {
							var path = data["node"]["Path"];
							var wsg = data["node"]["WideScreenGrade"];
							var mmg = data["node"]["MultiMonitorGrade"];
							var fkg = data["node"]["Grade4k"];
							var uws = data["node"]["UltraWideScreenGrade"];
							var wsg_icon = "", wsg_text = "", mmg_icon = "", mmg_text = "";
							var fkg_icon = "", fkg_text = "", uws_icon = "", uws_text = "";

							switch (wsg) {
								case "A":
									wsg_icon = self.options.img_wsgf_ws_gold;
									wsg_text = escapeHTML(localized_strings[language].wsgf.gold.replace(/__type__/g, "Widescreen"));
									break;
								case "B":
									wsg_icon = self.options.img_wsgf_ws_silver;
									wsg_text = escapeHTML(localized_strings[language].wsgf.silver.replace(/__type__/g, "Widescreen"));
									break;
								case "C":
									wsg_icon = self.options.img_wsgf_ws_limited;
									wsg_text = escapeHTML(localized_strings[language].wsgf.limited.replace(/__type__/g, "Widescreen"));
									break;
								case "Incomplete":
									wsg_icon = self.options.img_wsgf_ws_inc;
									wsg_text = escapeHTML(localized_strings[language].wsgf.incomplete);
									break;
								case "Unsupported":
									wsg_icon = self.options.img_wsgf_ws_uns;
									wsg_text = escapeHTML(localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Widescreen"));
									break;
							}

							switch (mmg) {
								case "A":
									mmg_icon = self.options.img_wsgf_mm_gold;
									mmg_text = escapeHTML(localized_strings[language].wsgf.gold.replace(/__type__/g, "Multi-Monitor")); 
									break;
								case "B":
									mmg_icon = self.options.img_wsgf_mm_silver;
									mmg_text = escapeHTML(localized_strings[language].wsgf.silver.replace(/__type__/g, "Multi-Monitor"));
									break;
								case "C":
									mmg_icon = self.options.img_wsgf_mm_limited;
									mmg_text = escapeHTML(localized_strings[language].wsgf.limited.replace(/__type__/g, "Multi-Monitor"));
									break;
								case "Incomplete":
									mmg_icon = self.options.img_wsgf_mm_inc;
									mmg_text = escapeHTML(localized_strings[language].wsgf.incomplete);
									break;
								case "Unsupported":
									mmg_icon = self.options.img_wsgf_mm_uns;
									mmg_text = escapeHTML(localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Multi-Monitor"));
									break;
							}

							switch (uws) {
								case "A":
									uws_icon = self.options.img_wsgf_uw_gold;
									uws_text = escapeHTML(localized_strings[language].wsgf.gold.replace(/__type__/g, "Ultra-Widescreen"));
									break;
								case "B":
									uws_icon = self.options.img_wsgf_uw_silver;
									uws_text = escapeHTML(localized_strings[language].wsgf.silver.replace(/__type__/g, "Ultra-Widescreen"));
									break;
								case "C":
									uws_icon = self.options.img_wsgf_uw_limited;
									uws_text = escapeHTML(localized_strings[language].wsgf.limited.replace(/__type__/g, "Ultra-Widescreen"));
									break;
								case "Incomplete":
									uws_icon = self.options.img_wsgf_uw_inc;
									uws_text = escapeHTML(localized_strings[language].wsgf.incomplete);
									break;
								case "Unsupported":
									uws_icon = self.options.img_wsgf_uw_uns;
									uws_text = escapeHTML(localized_strings[language].wsgf.unsupported.replace(/__type__/g, "Ultra-Widescreen"));
									break;
							}

							switch (fkg) {
								case "A":
									fkg_icon = self.options.img_wsgf_4k_gold;
									fkg_text = escapeHTML(localized_strings[language].wsgf.gold.replace(/__type__/g, "4k UHD"));
									break;
								case "B":
									fkg_icon = self.options.img_wsgf_4k_silver;
									fkg_text = escapeHTML(localized_strings[language].wsgf.silver.replace(/__type__/g, "4k UHD"));
									break;
								case "C":
									fkg_icon = self.options.img_wsgf_4k_limited;
									fkg_text = escapeHTML(localized_strings[language].wsgf.limited.replace(/__type__/g, "4k UHD"));
									break;
								case "Incomplete":
									fkg_icon = self.options.img_wsgf_4k_inc;
									fkg_text = escapeHTML(localized_strings[language].wsgf.incomplete);
									break;
								case "Unsupported":
									fkg_icon = self.options.img_wsgf_4k_uns;
									fkg_text = escapeHTML(localized_strings[language].wsgf.unsupported.replace(/__type__/g, "4k UHD"));
									break;
							}

							var html = "<div class='block underlined_links'><div class='block_header'><h4>WSGF Widescreen Certifications</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'><center>";
							
							if (wsg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(wsg_icon) + "' height='120' title='" + escapeHTML(wsg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (mmg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(mmg_icon) + "' height='120' title='" + escapeHTML(mmg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (uws != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(uws_icon) + "' height='120' title='" + escapeHTML(uws_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (fkg != "Incomplete") { html += "<a target='_blank' href='" + escapeHTML(path) + "'><img src='" + escapeHTML(fkg_icon) + "' height='120' title='" + escapeHTML(fkg_text) + "' border=0></a>&nbsp;&nbsp;&nbsp;"; }
							if (path) { html += "</center><br><a class='linkbar' target='_blank' href='" + escapeHTML(path) + "'>" + localized_strings[language].rating_details + " <img src='http://cdn2.store.steampowered.com/public/images/v5/ico_external_link.gif' border='0' align='bottom'></a>"; }
							html += "</div></div></div></div>";
							$(node).after(html);
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

function add_screenshot_lightbox() {
	$(".highlight_screenshot").find("a").addClass("es_lightbox_image");
	var current, size = 0;
	var game_name = $(".apphub_AppName:first").text();

	$(".es_lightbox_image").click(function(e) {
		e.preventDefault();
		var image_href = $(this).attr("href");
		var slideNum = $(".es_lightbox_image").index(this);
		if ($('#es-lightbox').length > 0) {
			$('#es-lightbox').fadeIn(300);
		} else {
			$('body').append("<div id='es-lightbox'><p>X</p><div id='es-lightbox-content'><ul></ul><div class='es-nav'><a href='#es-prev' class='es-prev slide-nav'><</a><a href='#es-next' class='es-next slide-nav'>></a></div><div id='es-lightbox-desc'></div></div></div>");
		}

		if (size === 0) {
			$(".es_lightbox_image").each(function() {
				var $href = $(this).attr("href");
				$("#es-lightbox-content ul").append("<li><img src='" + $href + "'></li>");
			});
		}

		size = $("#es-lightbox-content ul > li").length;
		if (size === 1) { $(".es-nav").remove(); }
		$("#es-lightbox-content ul > li").hide();
		$("#es-lightbox-content ul > li:eq(" + slideNum + ")").show();
		current = slideNum;
		$("#es-lightbox-desc").text(game_name + "  " + (current + 1) + " / " + size);
	});

	$("body").on("click", "#es-lightbox", function() { $("#es-lightbox").fadeOut(300); });

	$("body").on({ 
		mouseenter: function() { $(".es-nav").fadeIn(300);	},
		mouseleave: function() { $(".es-nav").fadeOut(300); }
	}, "#es-lightbox-content");

	$("body").on("click", ".slide-nav", function(e) {
		e.preventDefault();
		e.stopPropagation();

		var $this = $(this);
		var dest;

		if ($this.hasClass('es-prev')) {
			dest = current - 1;
			if (dest < 0) {
				dest = size - 1;
			}
		} else {
			dest = current + 1;
			if (dest > size - 1) {
				dest = 0;
			}
		}

		$('#es-lightbox-content ul > li:eq(' + current + ')').hide();
		$('#es-lightbox-content ul > li:eq(' + dest + ')').show();

		current = dest;
		$("#es-lightbox-desc").text(game_name + "  " + (current + 1) + " / " + size);
	});
}

function add_app_badge_progress(appid) {
	if ($(".icon").find('img[src$="/ico_cards.png"]').length > 0) {
		$("#category_block").after("<div class='block'><div class='block_header'><h4>Badge Progress</h4></div><div class='block_content_inner'><link rel='stylesheet' type='text/css' href='http://cdn.steamcommunity.com/public/css/skin_1/badges.css'><div class='es_badge_progress'></div><div class='es_foil_badge_progress'></div></div>");
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
					$(".es_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].view_badge + "</a></div>");
				} else {
					$(".es_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].badge_progress + "</a></div>");
				}
				if(show_card_num){
					$(".es_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
				}
				$(".es_badge_progress").after("<div style='padding-top: 10px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + $(responseText).find(".progress_info_bold").text() + "</div>");
				$(".es_badge_progress").after("<div style=\"clear: both\"></div>");
				$(".es_badge_progress .badge_info_description").css({"width":"275px"});
				$(".es_badge_progress .badge_empty_circle").css({"margin":"0px 46px 14px 8px","border-radius":"46px"});
				$(".es_badge_progress .badge_empty_right div:last-child").remove();
				$(".es_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + escapeHTML(localized_strings[language].badge_not_unlocked) + "</div>").append("<div style=\"clear: both\"></div>");
			} else {
				$(".es_badge_progress").remove();
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
					$(".es_foil_badge_progress .badge_empty_right").append("<div class=\"badge_empty_name\">" + escapeHTML(localized_strings[language].badge_not_unlocked) + "</div>")
					if (badge_completed){
						$(".es_foil_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].view_badge_foil + "</a><div>");
					} else {
						$(".es_foil_badge_progress").after("<div class='game_area_details_specs'><div class='icon'><img src='http://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png' width=24 height=16 border=0 align=top></div><a href='http://steamcommunity.com/my/gamecards/" + appid + "/' class='name'>" + localized_strings[language].badge_foil_progress + "</a><div>");
					}
					if(show_card_num){
						$(".es_foil_badge_progress").after("<div style='padding-top: 2px; padding-bottom: 10px; margin-left: 44px; color: #67c1f5;'>" + localized_strings[language].cards_owned.replace("__owned__", card_num_owned).replace("__possible__", card_num_total) + "</div>");
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
		if ($("#game_area_metascore")) {
			var metalink = $("#game_area_metalink").find("a").attr("href");
			get_http("http://api.enhancedsteam.com/metacritic/?mcurl=" + metalink, function (txt) {
				var metauserscore = parseFloat(txt)*10;
				var newmeta = '<div id="game_area_metascore" style="background-image: url(' + self.options.img_metacritic_bg + ');"><span>' + metauserscore + '</span><span class="ms_slash">/</span><span class="ms_base">100</span></div>';
				$("#game_area_metascore").after(newmeta);
			});
		}
	}
}

// Check price savings when purchasing game bundles
function subscription_savings_check() {
	var not_owned_games_prices = 0,
		appid_info_deferreds = [],
		sub_apps = [],
		sub_app_prices = {},
		currency_symbol,
		currency_type,
		comma;

	// Load each apps info
	$.each($(".tab_row"), function (i, node) {
		var appid = get_appid(node.querySelector("a").href),
			// Remove children, leave only text(price or only discounted price, if there are discounts)
			price_container = $(node).find(".tab_price").children().remove().end().text().trim();

		if (price_container !== "N/A" && price_container !== "Free") {
			if (price_container) {
				itemPrice = parseFloat(price_container.match(/([0-9]+(?:(?:\,|\.)[0-9]+)?)/)[1]);
				if (!currency_symbol) currency_symbol = currency_symbol_from_string(price_container);
				if (!comma) comma = (price_container.search(/,\d\d(?!\d)/));
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
		currency_type = currency_symbol_to_type(currency_symbol);
		for (var i = 0; i < sub_apps.length; i++) {
			if (!getValue(sub_apps[i] + "owned")) not_owned_games_prices += sub_app_prices[sub_apps[i]];
		}
		var $bundle_price = $(".discount_final_price");
		if ($bundle_price.length === 0) $bundle_price = $(".game_purchase_price");

        var bundle_price = $($bundle_price).html();
        bundle_price = bundle_price.replace(/[^0-9\.]+/g,"");
        bundle_price = parseFloat(bundle_price);
		if (comma > -1) { bundle_price = bundle_price / 100; }                
		var corrected_price = not_owned_games_prices - bundle_price;
		
		var $message = $('<div class="savings">' + formatCurrency(corrected_price, currency_type) + '</div>');
		if (corrected_price < 0) $message[0].style.color = "red";
		$('.savings').replaceWith($message);
	});
}

// pull DLC gamedata from enhancedsteam.com
function dlc_data_from_site(appid) {
    if ($("div.game_area_dlc_bubble").length > 0) {
        var appname = $(".apphub_AppName").html();
		appname = rewrite_string(appname, true);	
		get_http("http://api.enhancedsteam.com/gamedata/?appid=" + appid + "&appname=" + appname, function (txt) {
    		var data;
			if (txt != "{\"dlc\":}}") {
				data = JSON.parse(txt);
			}
            var html = "<div class='block'><div class='block_header'><h4>" + escapeHTML(localized_strings[language].dlc_details) + "</h4></div><div class='block_content'><div class='block_content_inner'><div class='details_block'>";

            if (data) {
                $.each(data["dlc"], function(index, value) {
                    html += "<div class='game_area_details_specs'><div class='icon'><img src='http://www.enhancedsteam.com/gamedata/icons/" + escapeHTML(value['icon']) + "' align='top'></div><a class='name' title='" + escapeHTML(value['text']) + "'>" + escapeHTML(index) + "</a></div>";
                });
			}

			html += "</div><a class='linkbar' style='margin-top: 10px;' href=\"http://www.enhancedsteam.com/gamedata/dlc_category_suggest.php?appid=" + appid + "&appname=" + appname + "\" target='_blank'>" + localized_strings[language].dlc_suggest + "</a></div></div></div>";

			$("#demo_block").after(html);
    	});
    }
}

function add_market_total() {
	if (showmarkethistory === true) {
		if (window.location.pathname.match(/^\/market\/$/)) {
			$("#moreInfo").before('<div id="es_summary"><div class="market_search_sidebar_contents"><h2 class="market_section_title">'+ escapeHTML(localized_strings[language].market_transactions) +'</h2><div class="market_search_game_button_group" id="es_market_summary" style="width: 238px"><img src="http://cdn.steamcommunity.com/public/images/login/throbber.gif">' + escapeHTML(localized_strings[language].loading) + '</div></div></div>');

			var pur_total = 0.0;
			var sale_total = 0.0;
			var currency_symbol = "";

			function get_market_data(txt) {
				var data = JSON.parse(txt);
				market = data['results_html'];
				if (!currency_symbol) currency_symbol = currency_symbol_from_string($(market).find(".market_listing_price").text().trim());

				pur_totaler = function (p, i) {
					if ($(p).find(".market_listing_price").length > 0) {
						if (p.innerHTML.match(/\+.+<\/div>/)) {
							var price = $(p).find(".market_listing_price").text().trim().match(/(\d+[.,]?\d+)/);
							if (price !== null) {
								var tempprice = price[0].toString();
								tempprice = tempprice.replace(/,(\d\d)$/, ".$1");
								tempprice = tempprice.replace(/,/g, "");
								return parseFloat(tempprice);
							}
						}
					}
				};

				sale_totaler = function (p, i) {
					if ($(p).find(".market_listing_price").length > 0) {
						if (p.innerHTML.match(/-.+<\/div>/)) {
							var price = $(p).find(".market_listing_price").text().trim().match(/(\d+[.,]?\d+)/);
							if (price !== null) {
								var tempprice = price[0].toString();
								tempprice = tempprice.replace(/,(\d\d)$/, ".$1");
								tempprice = tempprice.replace(/,/g, "");
								return parseFloat(tempprice);
							}
						}
					}
				};

				pur_prices = jQuery.map($(market), pur_totaler);
				sale_prices = jQuery.map($(market), sale_totaler);

				jQuery.map(pur_prices, function (p, i) { pur_total += p; });
				jQuery.map(sale_prices, function (p, i) { sale_total += p; });
			}

			function show_results() {
				var currency_type = currency_symbol_to_type(currency_symbol);
				var net = sale_total - pur_total;

				var html = localized_strings[language].purchase_total + ":<span class='es_market_summary_item'>" + formatCurrency(parseFloat(pur_total), currency_type) + "</span><br>";
				html += localized_strings[language].sales_total + ":<span class='es_market_summary_item'>" + formatCurrency(parseFloat(sale_total), currency_type) + "</span><br>";
				if (net > 0) {
					html += localized_strings[language].net_gain + ":<span class='es_market_summary_item' style='color: green;'>" + formatCurrency(parseFloat(net), currency_type) + "</span>";
				} else {
					html += localized_strings[language].net_spent + ":<span class='es_market_summary_item' style='color: red;'>" + formatCurrency(parseFloat(net), currency_type) + "</span>";
				}

				$("#es_market_summary").html(html);
			}

			var start = 0;
			var count = 1000;
			var i = 1;
			get_http("http://steamcommunity.com/market/myhistory/render/?query=&start=0&count=1", function (last_transaction) {
				var data = JSON.parse(last_transaction);
				var total_count = data["total_count"];
				var loops = Math.ceil(total_count / count);

				if (loops) {
					while ((start + count) < (total_count + count)) {
						get_http("http://steamcommunity.com/market/myhistory/render/?query=&start=" + start + "&count=" + count, function (txt) {
							get_market_data(txt);
							if (i == loops) { show_results(); }
							i++;
						});
						start += count;
					}
				} else {
					show_results();
				}
			});
		}
	}
}

function add_active_total() {
	if (window.location.pathname.match(/^\/market\/$/)) {
		var total = 0;
		var total_after = 0;	
		
		$(".my_listing_section:first").find(".market_listing_row").find(".market_listing_my_price").each(function() {			
			var temp = $(this).text().trim().replace(/pуб./g,"").replace(/,(\d\d(?!\d))/g, ".$1").replace(/[^0-9(\.]+/g,"").split("(");
			total += Number(temp[0]);
			total_after += Number(temp[1]);
			currency_symbol = currency_symbol_from_string($(this).text().trim());
		});
		
		if (total != 0) {
			var currency_type = currency_symbol_to_type(currency_symbol);
			total = formatCurrency(parseFloat(total), currency_type);
			total_after = formatCurrency(parseFloat(total_after), currency_type);
			$(".my_listing_section:first").append("<div class='market_listing_row market_recent_listing_row'><div class='market_listing_right_cell market_listing_edit_buttons'></div><div class='market_listing_my_price es_active_total'><span class='market_table_value><span class='market_listing_price'><span style='color: white'>" + total + "</span><br><span style='color: #AFAFAF'>(" + total_after + ")</span></span></span><br><span>" + escapeHTML(localized_strings[language].sales_total) + "</span></div></div>");
		}

		var total = 0;
		
		$(".my_listing_section:nth-child(2)").find(".market_listing_row").find(".market_listing_my_price:first").each(function() {
			var qty = $(this).parent().find(".market_listing_my_price:last").text().trim();
			total += Number($(this).text().trim().replace(/pуб./g,"").replace(/,(\d\d(?!\d))/g, ".$1").replace(/[^0-9\.]+/g,"")) * Number(qty);
			currency_symbol = currency_symbol_from_string($(this).text().trim());
		});
		
		if (total != 0) {
			var currency_type = currency_symbol_to_type(currency_symbol);
			total = formatCurrency(parseFloat(total), currency_type);
			$(".my_listing_section:nth-child(2)").append("<div class='market_listing_row market_recent_listing_row'><div class='market_listing_right_cell market_listing_edit_buttons'></div><div class='market_listing_my_price es_active_total'><span class='market_listing_item_name' style='color: white'>" + escapeHTML(total) + "</span><br><span class='market_listing_game_name'>" + escapeHTML(localized_strings[language].buying_total) + "</span></div></div>");
		}
	}
}

function account_total_spent() {
	if (showtotal === true) {
		if ($('.transactionRow').length !== 0) {
			var available_currencies = ["USD","GBP","EUR","BRL","RUB","JPY","NOK","IDR","MYR","PHP","SGD","THB","VND","KRW","TRY","UAH","MXN","CAD","AUD","NZD"];
			var currency_symbol;

			// Get user's Steam currency
			currency_symbol = currency_symbol_from_string($(".accountBalance").text().trim());
			if (currency_symbol == "") { return; }
			local_currency = currency_symbol_to_type(currency_symbol);

			function totaler(p, i) {
				if (p.innerHTML.indexOf("class=\"transactionRowEvent walletcredit\">") < 0) {
					if ($(p).find(".transactionRowPrice")) {
						var price = $(p).find(".transactionRowPrice").text().match(/(\d+[.,]?\d+)/);
						if (price !== null) {
							var currency = currency_symbol_to_type(currency_symbol_from_string($(p).find(".transactionRowPrice").text()));
							var tempprice = price[0].toString();
							tempprice = tempprice.replace(/,(\d\d)$/, ".$1");
							tempprice = tempprice.replace(/,/g, "");

							if (currency !== local_currency) {
								tempprice = parseFloat(tempprice);
								tempprice = tempprice / getValue(currency + "to" + local_currency);
							}
							return parseFloat(tempprice);
						}
					}
				}
			};

			function get_total() {
				game_prices = jQuery.map($('#store_transactions .block:first .transactionRow'), totaler);
				gift_prices = jQuery.map($('#store_transactions .block:last .transactionRow'), totaler);
				ingame_prices = jQuery.map($('#ingame_transactions .transactionRow'), totaler);
				market_prices = jQuery.map($('#market_transactions .transactionRow'), totaler);

				var game_total = 0.0;
				var gift_total = 0.0;
				var ingame_total = 0.0;
				var market_total = 0.0;

				jQuery.map(game_prices, function (p, i) { game_total += p; });
				jQuery.map(gift_prices, function (p, i) { gift_total += p; });
				jQuery.map(ingame_prices, function (p, i) { ingame_total += p; });
				jQuery.map(market_prices, function (p, i) { market_total += p; });

				total_total = game_total + gift_total + ingame_total + market_total;

				if (currency_symbol) {
					var currency_type = currency_symbol_to_type(currency_symbol);

					game_total = formatCurrency(parseFloat(game_total), currency_type);
					gift_total = formatCurrency(parseFloat(gift_total), currency_type);
					ingame_total = formatCurrency(parseFloat(ingame_total), currency_type);
					market_total = formatCurrency(parseFloat(market_total), currency_type);
					total_total = formatCurrency(parseFloat(total_total), currency_type);

					var html = '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + game_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].store_transactions + ':</div></div>';
					html += '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + gift_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].gift_transactions + ':</div></div>';
					html += '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + ingame_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].game_transactions + ':</div></div>';
					html += '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + market_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].market_transactions + ':</div></div>';
					html += '<div class="inner_rule"></div>';
					html += '<div class="accountRow accountBalance accountSpent">';
					html += '<div class="accountData price">' + total_total + '</div>';
					html += '<div class="accountLabel">' + localized_strings[language].total_spent + ':</div></div>';
					html += '<div class="inner_rule"></div>';

					$('.accountInfoBlock .block_content_inner .accountBalance').before(html);
				}
			}

			var complete = 0;

			$.each(available_currencies, function(index, currency_type) {
				if (currency_type != local_currency) {
					if (getValue(currency_type + "to" + local_currency)) {
						var expire_time = parseInt(Date.now() / 1000, 10) - 24 * 60 * 60; // One day ago
						var last_updated = getValue(currency_type + "to" + local_currency + "_time") || expire_time - 1;

						if (last_updated < expire_time) {
							get_http("https://firefox.enhancedsteam.com/api/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
								complete += 1;
								setValue(currency_type + "to" + local_currency, parseFloat(txt));
								setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
								if (complete == available_currencies.length - 1) get_total();
							});
						} else {
							complete += 1;
							if (complete == available_currencies.length - 1) get_total();
						}
					} else {
						get_http("https://firefox.enhancedsteam.com/api/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
							complete += 1;
							setValue(currency_type + "to" + local_currency, parseFloat(txt));
							setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
							if (complete == available_currencies.length - 1) get_total();
						});
					}
				}
			});
		}
	}
}

function inventory_market_prepare() {	
	$("#es_market_helper").remove();
	var es_market_helper = document.createElement("script");
	es_market_helper.type = "text/javascript";
	es_market_helper.id = "es_market_helper";
	es_market_helper.textContent = 'jQuery("#inventories").on("click", ".itemHolder, .newitem", function() { window.postMessage({ type: "es_sendmessage", information: [iActiveSelectView,g_ActiveInventory.selectedItem.marketable,g_ActiveInventory.appid,g_ActiveInventory.selectedItem.market_hash_name,g_ActiveInventory.selectedItem.market_fee_app,g_ActiveInventory.selectedItem.type] }, "*"); });';
	document.documentElement.appendChild(es_market_helper);

	window.addEventListener("message", function(event) {		
		if (event.data.type && (event.data.type == "es_sendmessage")) { inventory_market_helper(event.data.information); }
	}, false);
}

function inventory_market_helper(response) {
	var item = response[0];
	var marketable = response[1];
	var global_id = response[2];
	var hash_name = response[3];
	var appid = response[4];
	var gift = false;
	if (response[5] && response[5].match(/Gift/)) gift = true;
	var html;

	if (gift) {
		$("#es_item" + item).remove();
		if ($("#iteminfo" + item + "_item_actions").find("a").length > 0) {
			var gift_appid = get_appid($("#iteminfo" + item + "_item_actions").find("a")[0].href);
			get_http("http://store.steampowered.com/api/appdetails/?appids=" + gift_appid + "&filters=price_overview", function(txt) {
				var data = JSON.parse(txt);
				if (data[gift_appid].success && data[gift_appid]["data"]["price_overview"]) {
					var currency = data[gift_appid]["data"]["price_overview"]["currency"];
					var discount = data[gift_appid]["data"]["price_overview"]["discount_percent"];
					var price = formatCurrency(data[gift_appid]["data"]["price_overview"]["final"] / 100, currency);
					
					$("#iteminfo" + item + "_item_actions").css("height", "50px");
					if (discount > 0) {
						var original_price = formatCurrency(data[gift_appid]["data"]["price_overview"]["initial"] / 100, currency);
						$("#iteminfo" + item + "_item_actions").append("<div class='es_game_purchase_action' style='float: right;'><div class='es_game_purchase_action_bg'><div class='es_discount_block es_game_purchase_discount'><div class='es_discount_pct'>-" + discount + "%</div><div class='es_discount_prices'><div class='es_discount_original_price'>" + original_price + "</div><div class='es_discount_final_price'>" + price + "</div></div></div></div>");
					} else {						
						$("#iteminfo" + item + "_item_actions").append("<div class='es_game_purchase_action' style='float: right;'><div class='es_game_purchase_action_bg'><div class='es_game_purchase_price es_price'>" + price + "</div></div>");
					}	
				}
			});
		}
	} else {
		if ($(".profile_small_header_name .whiteLink").attr("href") !== $(".playerAvatar").find("a").attr("href")) {
			if ($('#es_item0').length == 0) { $("#iteminfo0_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item0></div>"); }
			if ($('#es_item1').length == 0) { $("#iteminfo1_item_market_actions").after("<div class='item_market_actions es_item_action' id=es_item1></div>"); }
			$('.es_item_action').html("");
			
			if (marketable == 0) { $('.es_item_action').remove(); return; }
			$("#es_item" + item).html("<img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading+"</span>");
			
			var url = "http://steamcommunity.com/market/priceoverview/?appid=" + global_id + "&market_hash_name=" + hash_name;
			get_http(url, function (txt) {
				data = JSON.parse(txt);
				$("#es_item" + item).html("");
				if (data.success) {
					html = "<div><div style='height: 24px;'><a href='http://steamcommunity.com/market/listings/" + global_id + "/" + hash_name + "'>" + localized_strings[language].view_in_market + "</a></div>";
					html += "<div style='min-height: 3em; margin-left: 1em;'>" + localized_strings[language].starting_at + ": " + data.lowest_price;
					if (data.volume) {
						html += "<br>" + localized_strings[language].last_24.replace("__sold__", data.volume);
					}

					$("#es_item" + item).html(html);
				} else {
					$("#es_item" + item).remove();
				}
			});
		} else {
			if (hash_name && hash_name.match(/Booster Pack/g)) {
				setTimeout(function() {
					var currency_symbol = currency_symbol_from_string($("#iteminfo" + item + "_item_market_actions").text());
					var currency_type = currency_symbol_to_type(currency_symbol);
					var api_url = "http://api.enhancedsteam.com/market_data/average_card_price/?appid=" + appid + "&cur=" + currency_type.toLowerCase();

					get_http(api_url, function(price_data) {				
						var booster_price = parseFloat(price_data,10) * 3;					
						html = localized_strings[language].avg_price_3cards + ": " + formatCurrency(booster_price, currency_type) + "<br>";
						$("#iteminfo" + item + "_item_market_actions").find("div:last").css("margin-bottom", "8px");
						$("#iteminfo" + item + "_item_market_actions").find("div:last").append(html);
					});
				}, 1000);
			}
		}
	}
}

// Add SteamDB links to pages
function add_steamdb_links(appid, type) {
	if (showdblinks === true) {
		switch (type) {
			case "gamehub":
				$(".apphub_OtherSiteInfo").append('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="http://steamdb.info/app/' + appid + '/"><span><i class="ico16" style="background-image:url(' + self.options.img_steamdb_store + ')"></i>&nbsp; Steam Database</span></a>');
				break;
			case "gamegroup":
				$('#rightActionBlock' ).append('<div class="actionItemIcon"><img src="' + chrome.extension.getURL("img/steamdb.png") + '" width="16" height="16" alt=""></div><a class="linkActionMinor" target="_blank" href="http://steamdb.info/app/' + appid + '/">' + localized_strings[language].view_in + ' Steam Database</a>');
				break;
			case "app":
				$('#demo_block').prepend('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="http://steamdb.info/app/' + appid + '/" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(' + self.options.img_steamdb_store + ')"></i>&nbsp; &nbsp;' + localized_strings[language].view_in + ' Steam Database</span></a>');
				break;
			case "sub":
				$(".share").before('<a class="btnv6_blue_hoverfade btn_medium steamdb_ico" target="_blank" href="http://steamdb.info/app/' + appid + '/" style="display: block; margin-bottom: 6px;"><span><i class="ico16" style="background-image:url(' + self.options.img_steamdb_store + ')"></i>&nbsp; &nbsp;' + localized_strings[language].view_in + ' Steam Database</span></a>');
				break;
		}

		$(".steamdb_ico").hover(
			function() {
				$(this).find("i").css("background-image", "url(" + self.options.img_steamdb_store_black + ")");
			}, function() {
				$(this).find("i").css("background-image", "url(" + self.options.img_steamdb_store + ")");
			}
		)
	}
}

function add_familysharing_warning(appid) {
	get_http('http://api.enhancedsteam.com/exfgls/?appid=' + appid, function (txt) {
		var data = JSON.parse(txt);
		if (data["exfgls"]["excluded"]) {
			$("#game_area_purchase").before('<div id="purchase_note"><div class="notice_box_top"></div><div class="notice_box_content">' + localized_strings[language].family_sharing_notice + '</div><div class="notice_box_bottom"></div></div>');
		}
	});
}

// Adds red warnings for 3rd party DRM
function drm_warnings(type) {
    if (showDRM === true) {
        var gfwl;
        var uplay;
        var securom;
        var tages;
        var stardock;
        var rockstar;
        var kalypso;
        var drm;

        var text = $("#game_area_description").html();
			text += $("#game_area_sys_req").html();
			text += $("#game_area_legal").html();
			text += $(".game_details").html();
			text += $(".DRM_notice").html();
        
        // Games for Windows Live detection
        if (text.toUpperCase().indexOf("GAMES FOR WINDOWS LIVE") > 0) { gfwl = true; }
		if (text.toUpperCase().indexOf("GAMES FOR WINDOWS - LIVE") > 0) { gfwl = true; }
		if (text.indexOf("Online play requires log-in to Games For Windows") > 0) { gfwl = true; }
		if (text.indexOf("INSTALLATION OF THE GAMES FOR WINDOWS LIVE SOFTWARE") > 0) { gfwl = true; }
		if (text.indexOf("Multiplayer play and other LIVE features included at no charge") > 0) { gfwl = true; }
		if (text.indexOf("www.gamesforwindows.com/live") > 0) { gfwl = true; }

		// Ubisoft Uplay detection
		if (text.toUpperCase().indexOf("CREATION OF A UBISOFT ACCOUNT") > 0) { uplay = true; }
		if (text.toUpperCase().indexOf("UPLAY") > 0) { uplay = true; }

		// Securom detection
		if (text.toUpperCase().indexOf("SECUROM") > 0) { securom = true; }

		// Tages detection
		if (text.match(/\btages\b/i)) { tages = true; }
		if (text.match(/angebote des tages/i)) { tages = false; }
		if (text.match("/\bsolidshield\b/i")) { tages = true; }

		// Stardock account detection
		if (text.indexOf("Stardock account") > 0) { stardock = true; }

		// Rockstar social club detection
		if (text.indexOf("Rockstar Social Club") > 0) { rockstar = true; }
		if (text.indexOf("Rockstar Games Social Club") > 0) { rockstar = true; }

		// Kalypso Launcher detection
		if (text.indexOf("Requires a Kalypso account") > 0) { kalypso = true; }

		// Detect other DRM
		if (text.indexOf("3rd-party DRM") > 0) { drm = true; }
		if (text.indexOf("No 3rd Party DRM") > 0) { drm = false; }

		var string_type;
		var drm_string = "(";
		if (type == "app") { string_type = localized_strings[language].drm_third_party; } else { string_type = localized_strings[language].drm_third_party_sub; }

		if (gfwl) { drm_string += 'Games for Windows Live, '; drm = true; }
		if (uplay) { drm_string += 'Ubisoft Uplay, '; drm = true; }
		if (securom) { drm_string += 'SecuROM, '; drm = true; }
		if (tages) { drm_string += 'Tages, '; drm = true; }
		if (stardock) { drm_string += 'Stardock Account Required, '; drm = true; }
		if (rockstar) { drm_string += 'Rockstar Social Club, '; drm = true; }
		if (kalypso) { drm_string += "Kalypso Launcher, "; drm = true; }

		if (drm_string == "(") {
			drm_string = "";
		} else {
			drm_string = drm_string.substring(0, drm_string.length - 2);
			drm_string += ")";
		}

		if (drm) {
			if ($("#game_area_purchase").find(".game_area_description_bodylabel").length > 0) {
				$("#game_area_purchase").find(".game_area_description_bodylabel").after('<div class="game_area_already_owned es_drm_warning" style="background-image: url( ' + self.options.img_game_area_warning + ' );"><span>' + string_type + ' ' + drm_string + '</span></div>');
			} else {
				$("#game_area_purchase").prepend('<div class="game_area_already_owned es_drm_warning" style="background-image: url( ' + self.options.img_game_area_warning + ' );"><span>' + string_type + ' ' + drm_string + '</span></div>');
			}
		}
	}
}

function add_carousel_descriptions() {
    if (showappdesc == true) {
    	if ($(".main_cluster_content").length > 0) {
			var description_height_to_add = 56;
			$(".main_cluster_content").css("height", parseInt($(".main_cluster_content").css("height").replace("px", ""), 10) + description_height_to_add + "px");
			
			$.each($(".cluster_capsule"), function(i, _obj) {
				var appid = get_appid(_obj.href),
					$desc = $(_obj).find(".main_cap_content"),
					$desc_content = $("<p></p>");
				
				$desc.css("height", parseInt($desc.css("height").replace("px", ""), 10) + description_height_to_add + "px");
				$desc.parent().css("height", parseInt($desc.parent().css("height").replace("px", ""), 10) + description_height_to_add + "px");

				var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
				var last_updated = getValue(appid + "carousel_time") || expire_time - 1;

				if (last_updated < expire_time) {
					get_http('http://store.steampowered.com/app/' + appid, function(txt) {
						var desc = txt.match(/textarea name="w_text" placeholder="(.+)" maxlength/);
						if (desc) {
							setValue(appid + "carousel", desc[1]);
							setValue(appid + "carousel_time", parseInt(Date.now() / 1000, 10));
							var value_to_add = "<div class='main_cap_status' style='font-size: 12px; line-height: normal;'>" + desc[1] + "</div>";
							$desc.append(value_to_add);
						}
					});
				}
				else {
					var desc = getValue(appid + "carousel");
					var value_to_add = "<div class='main_cap_status' style='font-size: 12px; line-height: normal;'>" + desc + "</div>";
					$desc.append(value_to_add);					
				}
			});

			// purge stale information from localStorage				
			var i = 0, sKey;
			for (; sKey = window.localStorage.key(i); i++) {
				if (sKey.match(/carousel_time/)) {
					var expire_time = parseInt(Date.now() / 1000, 10) - 8 * 60 * 60; // Eight hours ago
					var last_updated = window.localStorage.getItem(sKey) || expire_time - 1;

					if (last_updated < expire_time) {
						var appid = sKey.match(/\d+/)[0];
						delValue(appid + "carousel");
						delValue(appid + "carousel_time");
					}
				}
			}
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
				search_in_names_only(true);
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

function add_popular_tab() {
	$(".tabarea .tabbar").find(".tab:last").after("<div class='tab' id='es_popular'>" + localized_strings[language].popular + "</div>");
	var tab_html = "<div id='tab_popular_content' style='display: none;'><div class='tab_page' style='height: 780px;'><div id='tab_popular_items' class='v5'><span id='es_loading' style='position: absolute; margin-top: 20px; margin-left: 260px;'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'>" + localized_strings[language].loading + "</span></div></div>";
	tab_html += "<div class='tab_page_link_holder'><div id='tab_popular_prev' class='tab_page_link tab_page_link_prev' style='visibility: hidden;'>";
	tab_html += "<a href='javascript:tabMax[\"popular\"] = 100; PageTab(\"popular\", -10, 100);'>";
	tab_html += "<img src='http://store.akamai.steamstatic.com/public/images/v5/ico_navArrow_up.gif'> prev 10</a></div>";
	tab_html += "<div id='tab_popular_next' class='tab_page_link tab_page_link_next'>";
	tab_html += "<a href='javascript:tabMax[\"popular\"] = 100; PageTab(\"popular\", 10, 100);'>";
	tab_html += "next 10 <img src='http://store.akamai.steamstatic.com/public/images/v5/ico_navArrow_down.gif'></a></div>";
	tab_html += "<div id='tab_popular_count' class='tab_page_count'><span id='tab_popular_count_start'>1</span> - <span id='tab_popular_count_end'>10</span> of <span id='tab_popular_count_total'>100</span></div>";
	tab_html += "</div>";

	$(".tabarea .tab_content_ctn").append(tab_html);

	$("#es_popular").on("click", function() {
		$(".tabarea .tabbar").find(".active").removeClass("active");
		$("#tab1_content, #tab_2_content, #tab_3_content, #tab_discounts_content, #tab_filtered_dlc_content, #tab_filtered_dlc_content_enhanced, #tab_1_content_enhanced").css("display", "none");
		$("#es_popular").addClass("active");
		$("#tab_popular_content").css("display", "block");

		if ($("#tab_popular_items").find("div").length == 0) {

			get_http("http://store.steampowered.com/stats", function(txt) {
				$("#es_loading").remove();
				var return_text = $.parseHTML(txt);
				$(return_text).find(".player_count_row").each(function() {
					var appid = get_appid($(this).find("a").attr("href"));
					var game_name = $(this).find("a").text();
					var currently = $(this).find(".currentServers:first").text();
					var html = "<div class='tab_row' onmouseover='GameHover( this, event, $(\"global_hover\"), {\"type\":\"app\",\"id\":\"" + appid + "\"} );' onmouseout='HideGameHover( this, event, $(\"global_hover\") )' id='tab_row_popular_" + appid + "'>";
					html += "<a class='tab_overlay' href='http://store.steampowered.com/app/" + appid + "/?snr=1_4_4__106'></a>";
					html += "<div class='tab_item_img'><img src='http://cdn.akamai.steamstatic.com/steam/apps/" + appid + "/capsule_sm_120.jpg' class='tiny_cap_img'></div>";
					html += "<div class='tab_desc'><h4>" + game_name + "</h4><div class='genre_release'>" + currently + " " + localized_strings[language].charts.playing_now + "</div><br clear='all'></div>";

					html += "</div>";
					$("#tab_popular_items").append(html);
				});	
			});
		}
	});
}

function hide_greenlight_banner() {
    if (changegreenlightbanner === true) {
        var banner = $("#ig_top_workshop");
		var breadcrumbs = $(".breadcrumbs");

		var greenlight_info = '<link rel="stylesheet" type="text/css" href="http://steamcommunity-a.akamaihd.net/public/shared/css/apphub.css"><div class="apphub_HeaderTop es_greenlight"><div class="apphub_AppName ellipsis">Greenlight</div><div style="clear: both"></div>'
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
    		var earliestPurchase = $(txt).find("#store_transactions .block:nth-of-type(1) .transactionRowTitle:contains(" + appname + ")").closest(".transactionRow").last(),
    			purchaseDate = $(earliestPurchase).find(".transactionRowDate").text();
    
    		var found = 0;
    		$("div.game_area_already_owned").each(function (index, node) {
    			if (found === 0) {
    				if (purchaseDate) {
    					$(node).append(escapeHTML(localized_strings[language].purchase_date.replace("__date__", escapeHTML(purchaseDate))));
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
				if (node.classList && node.classList.contains("tab_row")) {
					start_highlighting_node(node);
					check_early_access(node, "ea_sm_120.png", 0);
				}
                
				if (node.id == "search_result_container") {
    				endless_scrolling();
					start_highlights_and_tags();
					remove_non_specials();
					add_overlay();
					search_in_names_only(true);
				}

				if ($(node).children('div')[0] && $(node).children('div')[0].classList.contains("blotter_day")) {
					start_friend_activity_highlights();
					add_overlay();
				}

				if (node.classList && node.classList.contains("browse_tag_games")) {
					start_highlights_and_tags();
					add_overlay();
				}

				if (node.classList && node.classList.contains("summersale_tabpage")) {
					$(node).find(".summersale_dailydeal_ctn").each(function() {
						start_highlighting_node(this);
						check_early_access(this, "ea_231x87.png", 0);
					});
					show_win_mac_linux();
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

	on_app_info(appid, node, function(){
		highlight_app(appid, node);
	});
}

var owned_promise = (function () {
	var deferred = new $.Deferred();
	if (is_signed_in() && window.location.protocol != "https:") {
		var steamID = is_signed_in()[0];

		var expire_time = parseInt(Date.now() / 1000, 10) - 7 * 60 * 60 * 24; // One week ago
		var last_updated = getValue("owned_games_time") || expire_time - 1;

		if (last_updated < expire_time) {
			$.ajax({
				url:"http://api.enhancedsteam.com/steamapi/GetOwnedGames/?steamid=" + steamID + "&include_appinfo=0",
				success: function(txt) {
					var data = JSON.parse(txt);
					if (data["requests"]) {
						$.each(data['response']['games'], function(index, value) {
							setValue(value['appid'] + "owned", true);
						});
					}
					setValue("owned_games_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();
				},
				error: function(e){
					deferred.resolve();
				}
			});
		} else {
			deferred.resolve();
		}
	} else {
		deferred.resolve();
	}
	
	return deferred.promise();
})();

var wishlist_promise = (function () {
	var deferred = new $.Deferred();
	if (is_signed_in() && window.location.protocol != "https:") {
		var steamID = is_signed_in()[0];
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60 ; // One hour ago
		var last_updated = getValue("wishlist_games_time") || expire_time - 1;

		if (last_updated < expire_time) {
			// purge stale information from localStorage
			var i = 0, sKey;
			for (; sKey = window.localStorage.key(i); i++) {
				if (sKey.match(/wishlisted/)) {
					var appid = sKey.match(/\d+/)[0];
					delValue(appid + "wishlisted");
				}
			}

			$.ajax({
				url:"http://steamcommunity.com/profiles/" + steamID + "/wishlist",
				success: function(txt) {
					var html = $.parseHTML(txt);
					$(html).find(".wishlistRow").each(function() {
						var appid = $(this).attr("id").replace("game_", "");
						setValue(appid + "wishlisted", true);
						setValue(appid, parseInt(Date.now() / 1000, 10));
					});
					setValue("wishlist_games_time", parseInt(Date.now() / 1000, 10));
					deferred.resolve();
				},
				error: function(e){
					deferred.resolve();
				}
			});
		} else {
			deferred.resolve();
		}
	} else {
		deferred.resolve();
	}
	
	return deferred.promise();
})();

function start_highlights_and_tags(){
	// Batch all the document.ready appid lookups into one storefront call.
	$.when.apply($, [owned_promise, wishlist_promise]).done(function() {	
		var selectors = [
			"div.tab_row",				// Storefront rows
			"div.dailydeal",			// Christmas deals; http://youtu.be/2gGopKNPqVk?t=52s
			"div.wishlistRow",			// Wishlist rows
			"a.game_area_dlc_row",			// DLC on app pages
			"a.small_cap",				// Featured storefront items and "recommended" section on app pages
			"a.search_result_row",			// Search result rows
			"a.match",				// Search suggestions rows
			"a.cluster_capsule",			// Carousel items
			"div.recommendation_highlight",		// Recommendation pages
			"div.recommendation_carousel_item",	// Recommendation pages
			"div.friendplaytime_game",		// Recommendation pages
			"div.dlc_page_purchase_dlc",		// DLC page rows
			"div.sale_page_purchase_item",		// Sale pages
			"div.item",				// Sale pages / featured pages
			"div.home_area_spotlight",		// Midweek and weekend deals
			"div.browse_tag_game",			// Tagged games
			"div.similar_grid_item"			// Items on the "Similarly tagged" pages
		];

		var appids = [];

		// Get all appids and nodes from selectors
		$.each(selectors, function (i, selector) {
			$.each($(selector), function(j, node){
				var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
				if (appid) {
					if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
					if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }

					var pushvar = [appid, node];
					appids.push(pushvar);
				} else {
					var subid = get_subid(node.href || $(node).find("a")[0].href);

					if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
					if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }

					if (subid) {
						get_sub_details (subid, node);
					}
				}	
			});
		});

		on_apps_info(appids);
	});
}

function start_friend_activity_highlights() {
	$.when.apply($, [owned_promise, wishlist_promise]).done(function() {
		var selectors = [
			".blotter_author_block a",
			".blotter_gamepurchase_details a",
			".blotter_daily_rollup_line a"
		];

		var appids = [];

		// Get all appids and nodes from selectors
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

					var pushvar = [appid, node];
					appids.push(pushvar);
				} else {
					var subid = get_subid(node.href || $(node).find("a")[0].href);
					if (subid) {
						get_sub_details (subid, node);
					}
				}	
			});
		});

		on_apps_info(appids);
	});
}

// Accepts a multidimensional array with [appid, node] values
function on_apps_info(appids) {
	var appids_to_process = [];

	$.each(appids, function(index, value) {
		var appid = value[0];
		ensure_appid_deferred(appid);

		if (getValue(appid + "owned") != true) {
			var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
			var last_updated = getValue(appid) || expire_time - 1;

			// If we have no data on appid, or the data has expired; add it to appids to fetch new data.
			if (last_updated < expire_time) {
				appids_to_process.push(appid);
			}
			else {
				appid_promises[appid].resolve();
			}
		} else {
			appid_promises[appid].resolve();
		}

		appid_promises[appid].promise.done(highlight_app(appid, value[1]));
	});

	if (appids_to_process.length) {
		get_http('http://store.steampowered.com/api/appuserdetails/?appids=' + appids_to_process.join(), function (data) {
			var storefront_data = JSON.parse(data);
			$.each(storefront_data, function(appid, app_data){
				if (app_data.success) {
					setValue(appid + "owned", (app_data.data.is_owned === true));

					if (app_data.data.is_owned != true) {
						// Update time for caching
						setValue(appid, parseInt(Date.now() / 1000, 10));
					}
				}

				// Resolve promise to run any functions waiting for this apps info
				appid_promises[appid].resolve();

				// find the appropriate node to highlight
				for (var i = 0; i < appids.length; i++) {
					if (appids[i][0] === appid) {
						highlight_app(appid, appids[i][1]);
					}
				}
			});
		});
	}
}

function start_highlighting_node(node) {
    var appid = get_appid(node.href || $(node).find("a")[0].href) || get_appid_wishlist(node.id);
	if (appid) {
	
		if ($(node).hasClass("item")) { node = $(node).find(".info")[0]; }
		if ($(node).hasClass("home_area_spotlight")) { node = $(node).find(".spotlight_content")[0]; }
	
		on_app_info(appid, node, function(){
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

function on_app_info(appid, node, cb) {
	ensure_appid_deferred(appid);
	
	var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
	var last_updated = localStorage.getItem(appid) || expire_time - 1;

	// If we have no data on appid, or the data has expired; add it to appids to fetch new data.
	if (last_updated < expire_time) {
		get_app_details(appid, node);
	}
	else {
		appid_promises[appid].resolve();
	}

	// Bind highlighting.
	appid_promises[appid].promise.done(cb);
}

function highlight_app(appid, node, override) {
	if (!(node.classList.contains("wishlistRow") || node.classList.contains("wishlistRowItem"))) {
		if (getValue(appid + "wishlisted")) highlight_wishlist(node); 
		if (override == "wishlisted") highlight_wishlist(node);
	}

	if (getValue(appid + "owned")) highlight_owned(node); 
	if (override == "owned") highlight_owned(node);
}

function get_app_details(appids, node) {
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
	if (is_signed_in()) {
		if (getValue(subid + "owned")) { highlight_owned(node); return; }

		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		var last_updated = getValue(subid) || expire_time - 1;

		if (last_updated < expire_time) {
			var app_ids = [];
			var owned = [];

			get_http('http://store.steampowered.com/api/packagedetails/?packageids=' + subid, function (data) {
				var pack_data = JSON.parse(data);
				$.each(pack_data, function(subid, sub_data) {
					if (sub_data.success) {
						if (sub_data.data.apps) {
							sub_data.data.apps.forEach(function(app) {
								app_ids.push (app.id.toString());
							});
						}
					}
				});

				get_http('http://store.steampowered.com/api/appuserdetails/?appids=' + app_ids.toString(), function (data2) {
					var storefront_data = JSON.parse(data2);
					$.each(storefront_data, function(appid, app_data) {
						if (app_data.success) {
							if (app_data.data.is_owned === true) {
								setValue(appid + "owned", true);
								owned.push(appid);
							} else {
								setValue(appid + "owned", false);
								setValue(appid, parseInt(Date.now() / 1000, 10));
							}
						}
					});
					if (owned.length == app_ids.length) {
						setValue(subid + "owned", true);
						highlight_app(subid, node);
					} else {
						setValue(subid + "owned", false);
						setValue(subid, parseInt(Date.now() / 1000, 10));
					}
				});
			});
		}
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
			var selected = false;
			steam64 = steam64.match(/g_steamID = \"(.+)\";/)[1];
			var html = "<form id='es_profile_bg' method='POST' action='http://www.enhancedsteam.com/gamedata/profile_bg_save.php'><div class='group_content group_summary'>";
			html += "<input type='hidden' name='steam64' value='" + steam64 + "'>";
			html += "<input type='hidden' name='appid' id='appid'>";
			html += "<div class='formRow'><div class='formRowFields'><div class='profile_background_current'><div class='profile_background_current_img_ctn'><div class='es_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading +"</div>";
			html += "<img id='es_profile_background_current_image' src=''>";
			html += "</div><div class='profile_background_current_description'><div id='es_profile_background_current_name'>";
			html += "</div></div><div style='clear: left;'></div><div class='background_selector_launch_area'></div></div><div class='background_selector_launch_area'>&nbsp;<div style='float: right;'><span id='es_background_save_btn' class='btn_grey_white_innerfade btn_small btn_disabled'><span>" + localized_strings[language].save + "</span></span></div></div><div class='formRowTitle'>" + localized_strings[language].custom_background + ":<span class='formRowHint' title='" + localized_strings[language].custom_background_help + "'>(?)</span></div></div></div>";
			html += "</form>";
			$(".group_content_bodytext").before(html);

			get_http("http://api.enhancedsteam.com/profile-select-v2/?steam64=" + steam64, function (txt) {
				var data = JSON.parse(txt);
				var select_html = "<select name='es_background_gamename' id='es_background_gamename' class='gray_bevel dynInput'><option value='0' id='0'>None Selected / No Change</option>";
				
				$.each(data["games"], function(index, value) {
					if (value["selected"]) {
						select_html += "<option id='" + escapeHTML(value["appid"].toString()) + "' value='" + escapeHTML(value["appid"].toString()) + "' selected>" + escapeHTML(index.toString()) + "</option>";
						selected = true;
					} else {
						select_html += "<option id='" + escapeHTML(value["appid"].toString()) + "' value='" + escapeHTML(value["appid"].toString()) + "'>" + escapeHTML(index.toString()) + "</option>";
					}
				});
				select_html += "</select>";
				$(".es_loading").remove();
				$("#es_profile_background_current_name").html(select_html);

				get_http("http://api.enhancedsteam.com/profile-small/?steam64=" + steam64, function (txt) {
					$("#es_profile_background_current_image").attr("src", escapeHTML(txt));
				});

				$("#es_background_gamename").change(function() {
					var appid = $("#es_background_gamename option:selected").attr("id");
					$("#appid").attr("value", appid);
					$("#es_background_selection").remove();
					if (appid == 0) {
						$("#es_profile_background_current_image").attr("src", "");
					} else {
						$("#es_profile_background_current_name").after("<div class='es_loading'><img src='http://cdn.steamcommunity.com/public/images/login/throbber.gif'><span>"+ localized_strings[language].loading +"</div>");							

						get_http("http://api.enhancedsteam.com/profile-select-v2-game/?appid=" + appid + "&steam64=" + steam64, function (txt) {
							var bg_data = JSON.parse(txt);
							$("#es_profile_background_current_name").after("<div id='es_background_selection'></div>");
							select_html = "<select name='es_background' id='es_background' class='gray_bevel dynInput'>";
							var i = 0;
							if (selected) { i = 1; selected = false; }
							$.each(bg_data["backgrounds"], function(index, value) {
								if (value["selected"]) {
									select_html += "<option id='" + escapeHTML(value["id"].toString()) + "' value='" + escapeHTML(value["index"].toString()) + "' selected>" + escapeHTML(value["text"].toString()) + "</option>";
								} else {
									if (i == 0) { $("#es_profile_background_current_image").attr("src", value["id"]); i = 1; }
									select_html += "<option id='" + escapeHTML(value["id"].toString()) + "' value='" + escapeHTML(value["index"].toString()) + "'>" + escapeHTML(value["text"].toString()) + "</option>";
								}	
							});
							select_html += "</select>";
							$(".es_loading").remove();
							$("#es_background_selection").html(select_html);

							$("#es_background").change(function() {
								var img = $("#es_background option:selected").attr("id");
								$("#es_profile_background_current_image").attr("src", img);
							});
						});

						// Enable the "save" button
						$("#es_background_save_btn").removeClass("btn_disabled");
						$("#es_background_save_btn").click(function(e) {
							$("#es_profile_bg").submit();
						});
					}
				});

				if (selected) { $("#es_background_gamename").change(); }
			});
		}
	}
}

function rewrite_string(string, websafe) {
	if (websafe) {
		string = encodeURIComponent(string);
	} else {		
		string = decodeURI(string);
	}
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

function add_achievement_comparison_link(node) {
    if (!($(node).html().match(/es_achievement_compare/))) {
		var links = $(node).find("a");
		var appid = get_appid(links[2].href);
		get_http(links[0].href + "/stats/" + appid, function(txt) {
			var html = txt.match(/<a href="(.+)compare">/);
			if (html) {
				$(node).find("span:not(.nickname_block,.nickname_name)").css("margin-top", "0px");
				$(node).find("span:not(.nickname_block,.nickname_name)").append("<br><a href='http://www.steamcommunity.com" + escapeHTML(html[1]) + "compare' class='es_achievement_compare' target='_blank' style='font-size: 10px; float: right; margin-right: 6px;'>(" + escapeHTML(localized_strings[language].compare) + ")</a>");
			}
		});
	}
}

function add_dlc_checkboxes() {
	var session = decodeURIComponent(cookie.match(/sessionid=(.+?);/i)[1]);
	if ($("#game_area_dlc_expanded").length > 0) {
		$("#game_area_dlc_expanded").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; margin-bottom: 10px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'><span>" + localized_strings[language].add_selected_dlc_to_cart + "</span></a></div></div>");
		$(".game_area_dlc_section").after("<div style='clear: both;'></div>");
	} else {
		$(".gameDlcBlocks").after("<div class='game_purchase_action game_purchase_action_bg' style='float: left; margin-top: 4px; display: none;' id='es_selected_btn'><div class='btn_addtocart'><a class='btnv6_green_white_innerfade btn_medium' href='javascript:document.forms[\"add_selected_dlc_to_cart\"].submit();'><span>" + localized_strings[language].add_selected_dlc_to_cart + "</span></a></div></div>");
	}
	$("#es_selected_btn").before("<form name=\"add_selected_dlc_to_cart\" action=\"http://store.steampowered.com/cart/\" method=\"POST\" id=\"es_selected_cart\">");
	$(".game_area_dlc_row").each(function() {
		$(this).find(".game_area_dlc_name").prepend("<input type='checkbox' class='es_dlc_selection' style='cursor: default;' id='es_select_dlc_" + $(this).find("input").val() + "' value='" + $(this).find("input").val() + "'><label for='es_select_dlc_" + $(this).find("input").val() + "' style='background-image: url( " + self.options.img_check_sheet + " );'></label>");
	});
	function add_dlc_to_list() {
		$("#es_selected_cart").html("<input type=\"hidden\" name=\"action\" value=\"add_to_cart\"><input type=\"hidden\" name=\"sessionid\" value=\"" + session + "\">");
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

	$(".game_area_dlc_section").find(".gradientbg").after("<div style='height: 28px; padding-left: 15px; display: none;' id='es_dlc_option_panel'></div>");

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='unowned_dlc_check'>" + escapeHTML(localized_strings[language].select.unowned_dlc) + "</div>");
	$("#unowned_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			if (!($(this).hasClass("es_highlight_owned"))) {
				$(this).find("input").prop("checked", true).change();
			}
		});
	});

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='wl_dlc_check'>" + escapeHTML(localized_strings[language].select.wishlisted_dlc) + "</div>");
	$("#wl_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			if ($(this).hasClass("es_highlight_wishlist")) {
				$(this).find("input").prop("checked", true).change();
			}	
		});
	});

	$("#es_dlc_option_panel").append("<div class='es_dlc_option' id='no_dlc_check'>" + escapeHTML(localized_strings[language].select.none) + "</div>");
	$("#no_dlc_check").on("click", function() {		
		$(".game_area_dlc_section").find(".game_area_dlc_row").each(function() {
			$(this).find("input").prop("checked", false).change();
		});
	});

	$(".game_area_dlc_section").find(".gradientbg").append("<div id='es_dlc_option_button'>" + escapeHTML(localized_strings[language].thewordoptions) + " ▾</div>");
	
	$("#es_dlc_option_button").on("click", function() {
		$("#es_dlc_option_panel").toggle();
		if ($("#es_dlc_option_button").text().match("▾")) {
			$("#es_dlc_option_button").text(localized_strings[language].thewordoptions + " ▴");
		} else {
			$("#es_dlc_option_button").text(localized_strings[language].thewordoptions + " ▾");
		}
	});

	$(document).on( "change", ".es_dlc_selection", add_dlc_to_list );
}

function fix_achievement_icon_size() {
	if ($(".rightblock").find("img[src$='ico_achievements.png']").length > 0) {
		$(".rightblock").find("img[src$='ico_achievements.png']").attr("height", "24");
		$(".rightblock").find("img[src$='ico_achievements.png']").css("margin-top", "-5px");
	}
}

function add_astats_link(appid) {
	if (showastats === true) {
		$(".communitylink_achievement_inner a:last").after("<a class='linkbar' href='http://astats.astats.nl/astats/Steam_Game_Info.php?AppID=" + appid + "' target='_blank'><div class='rightblock'><img src='" + self.options.img_ico_astatsnl + "' style='margin-right: 11px;'></div>" + localized_strings[language].view_astats + "</a>")
	}	
}

var ea_appids, ea_promise = (function () {
	var deferred = new $.Deferred();
	if (window.location.protocol != "https:") {		
		// is the data cached?
		var expire_time = parseInt(Date.now() / 1000, 10) - 1 * 60 * 60; // One hour ago
		var last_updated = getValue("ea_appids_time") || expire_time - 1;
		
		if (last_updated < expire_time) {
			// if no cache exists, pull the data from the website
			get_http("http://api.enhancedsteam.com/early_access/", function(txt) {
				ea_appids = txt;
				setValue("ea_appids", ea_appids);
				setValue("ea_appids_time", parseInt(Date.now() / 1000, 10));
				deferred.resolve();	
			});
		} else {
			ea_appids = getValue("ea_appids");
			deferred.resolve();
		}
		
		return deferred.promise();
	} else {
		deferred.resolve();
		return deferred.promise();
	}
})();

function check_early_access(node, image_name, image_left, selector_modifier, action) {
	var href = ($(node).find("a").attr("href") || $(node).attr("href"));
	var appid = get_appid(href);
	if (appid === null) { 
		if ($(node).find("img").attr("src").match(/\/apps\/(\d+)\//)) {
			appid = $(node).find("img").attr("src").match(/\/apps\/(\d+)\//)[1];
		}
	}
	var early_access = JSON.parse(ea_appids);
	if (early_access["ea"].indexOf(appid) >= 0) {
		var selector = "img";
		if (selector_modifier != undefined) selector += selector_modifier;
		var image;
		switch (image_name) {
			case "ea_sm_120.png":
				image = self.options.img_overlay_ea_sm_120;
				break;
			case "ea_184x69.png":
				image = self.options.img_overlay_ea_184x69;
				break;
			case "ea_231x87.png":
				image = self.options.img_overlay_ea_231x87;
				break;
			case "ea_292x136.png":
				image = self.options.img_overlay_ea_292x136;
				break;
			case "ea_467x181.png":
				image = self.options.img_overlay_ea_467x181;
				break;
		}
		overlay_img = $("<img class='es_overlay' src='" + image + "'>");
		$(overlay_img).css({"left":image_left+"px"});
		$(node).find(selector.trim()).before(overlay_img);
	}
}

function process_early_access() {
	ea_promise.done(function(){
		switch (window.location.host) {
			case "store.steampowered.com":
				switch (true) {
					case /^\/app\/.*/.test(window.location.pathname):
						$(".game_header_image").append("<a href='" + window.location.href + "'></a>");
						$(".game_header_image_ctn").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
						$(".small_cap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 15); });
						break;
					case /^\/(?:genre|browse)\/.*/.test(window.location.pathname):
						$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
						$(".special_tiny_cap").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
						$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
						$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
						break;
					case /^\/search\/.*/.test(window.location.pathname):
						$(".search_result_row").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });					
						break;
					case /^\/recommended/.test(window.location.pathname):
						$(".friendplaytime_appheader").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
						$(".header_image").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
						$(".appheader").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
						$(".recommendation_carousel_item").each(function(index, value) { check_early_access($(this), "ea_184x69.png", $(this).position().left + 8); });
						$(".game_capsule_area").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", $(this).position().left + 8); });
						$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", $(this).position().left); });
						$(".similar_grid_capsule").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
						break;
					case /^\/tag\/.*/.test(window.location.pathname):
						$(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
						$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0); });
						$(".browse_tag_game_cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", $(this).position().left); });
						break;
					case /^\/$/.test(window.location.pathname):
						$(".tab_row").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
						$(".home_smallcap").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 15); });
						$(".cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
						$(".special_tiny_cap").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
						$(".game_capsule").each(function(index, value) { check_early_access($(this), "ea_sm_120.png", 0); });
						$("#home_main_cluster").find(".cluster_capsule").each(function(index, value) { check_early_access($(this), "ea_467x181.png", 0); });
						$(".recommended_spotlight_cap").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
						$(".curated_app_link").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
						$(".tab_item").each(function(index, value) { check_early_access($(this), "ea_184x69.png", 0, ":last"); });
						$(".dailydeal_cap").find("a").each(function(index, value) { check_early_access($(this), "ea_292x136.png", 0); });
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
							$(".apphub_StoreAppLogo:first").after("<img class='es_overlay' style='left: " + $(".apphub_StoreAppLogo:first").position().left + "px' src='" + self.options.img_overlay_ea_292x136 + "'>");
						}
				}
		}
	});
}

// Display a regional price comparison
function show_regional_pricing() {
	if (showregionalprice) {
		var api_url = "http://store.steampowered.com/api/packagedetails/";
		var countries = ["US","GB","EU1","EU2","BR","RU","AU","JP"];
		var pricing_div = "<div class='es_regional_container'></div>";
		var world = self.options.img_world;
		var currency_deferred = [];
		var local_country;
		var local_currency;
		var dailydeal;
		var sale;
		var sub;
		var region_appended=0;
		var available_currencies = ["USD","GBP","EUR","BRL","RUB","JPY","NOK","IDR","MYR","PHP","SGD","THB","VND","KRW","TRY","UAH","MXN","CAD","AUD","NZD"];
		var conversion_rates = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
		var currency_symbol;
		
		function process_data(conversion_array) {
			// Clean up conversion script DOM nodes
			$.each(available_currencies, function(index, currency_type) {
				$("#es_compare_" + local_currency + "_" + currency_type).remove();
			});
			$("#es_helper").remove();

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
				all_game_areas = $(".sale_page_purchase_item").toArray();
			}
			var subid_info = [];
			var subid_array = [];
			var subids_csv;

			function formatPriceData(sub_info,country,converted_price) {
				var flag_div = "<div class=\"es_flag\" style='background-image:url( " + self.options.img_flags + " )'></div>";
				if (sub_info["prices"][country]){
					var price = sub_info["prices"][country]["final"]/100;
					var local_price = sub_info["prices"][local_country]["final"]/100;
					converted_price = converted_price/100;
					converted_price = converted_price.toFixed(2);
					var currency = sub_info["prices"][country]["currency"];
					var percentage;
					var formatted_price = formatCurrency(price, currency);
					var formatted_converted_price = formatCurrency(converted_price, local_currency);
					
					percentage = (((converted_price/local_price)*100)-100).toFixed(2);
					var arrows = self.options.img_arrows;
					var percentage_span="<span class=\"es_percentage\"><div class=\"es_percentage_indicator\" style='background-image:url("+arrows+")'></div></span>";
					if (percentage<0) {
						percentage = Math.abs(percentage);
						percentage_span = $(percentage_span).addClass("es_percentage_lower");
					}else if (percentage==0) {
						percentage_span = $(percentage_span).addClass("es_percentage_equal");
					}else {
						percentage_span = $(percentage_span).addClass("es_percentage_higher");
					}
					percentage_span = $(percentage_span).append(percentage+"%");
					var regional_price_div = "<div class=\"es_regional_price\">"+formatted_price+"&nbsp;<span class=\"es_regional_converted\">("+formatted_converted_price+")</span></div>";
					flag_div = $(flag_div).addClass("es_flag_"+country.toLowerCase());
					regional_price_div = $(regional_price_div).prepend(flag_div);
					regional_price_div = $(regional_price_div).append(percentage_span);
					return regional_price_div;
				}
				else {
					var regional_price_div = "<div class=\"es_regional_price\"><span class=\"es_regional_unavailable\">"+localized_strings[language].region_unavailable+"</span></div>";
					flag_div = $(flag_div).addClass("es_flag_"+country.toLowerCase());
					regional_price_div = $(regional_price_div).prepend(flag_div);
					return regional_price_div;
				}
			}

			$.each(all_game_areas,function(index,app_package){
				var subid = $(app_package).find("input[name='subid']").val();
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
										var index = $.inArray(country_currency, available_currencies);
										var converted_price = parseFloat(app_price) / conversion_array[index];																					
										var regional_price = formatPriceData(subid,country,converted_price);
										regional_price_array[0]=country;
										regional_price_array[1]=regional_price;
										sub_formatted.push(regional_price_array);											
									}
									else {
										var regional_price = formatPriceData(subid,country);
										regional_price_array[0]=country;
										regional_price_array[1]=regional_price;
										sub_formatted.push(regional_price_array);
									}
								}
							});
							$.when.apply(null,convert_deferred).done(function(){
								if(dailydeal){
									$(".dailydeal_content").eq(index).find(".game_purchase_action_bg").before(app_pricing_div);
								}
								else if (sale){
									$(".sale_page_purchase_item").eq(index).find(".game_purchase_action_bg").before(app_pricing_div);
								} else {
									$(".game_area_purchase_game").eq(index).append(app_pricing_div);
									$(app_pricing_div).css("top", $(".game_area_purchase_game").eq(index).outerHeight(true));
									$(".game_area_purchase_game").css("z-index", "auto");
									$(".game_purchase_action").css("z-index", "1");
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
							var subid = $(app_package).find("input[name='subid']").val();
							if(subid){
								$(app_package).find(".price").css({"padding-left":"25px","background-image":"url("+world+")","background-repeat":"no-repeat","background-position":"5px 8px"});
								$(app_package).find(".discount_original_price").css({"position":"relative","float":"left"});
								$(app_package).find(".discount_block").css({"padding-left":"25px","background-image":"url("+world+")","background-repeat":"no-repeat","background-position":"77px 8px","background-color":"#000000"});
								$(app_package).find(".discount_prices").css({"background":"none"});

								$(app_package).find(".price, .discount_block")
								.mouseover(function() {
									var purchase_location = $(app_package).find("div.game_purchase_action_bg").offset();
									if(dailydeal) {
										$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width()+18 +"px");
									} else if(sale) {
										$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 25 +"px");
									} else if(sub) {
										$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 45 + "px");
									} else {
										$("#es_pricing_" + subid).css("right", $(app_package).find(".game_purchase_action").width() + 20 + "px");
									}
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

		// Get user's Steam currency
		currency_symbol = currency_symbol_from_string($(".price:first, .discount_final_price:first").text().trim());
		if (currency_symbol == "") { return; }
		local_currency = currency_symbol_to_type(currency_symbol);

		var complete = 0;

		$.each(available_currencies, function(index, currency_type) {
			if (currency_type != local_currency) {
				if (getValue(currency_type + "to" + local_currency)) {
					var expire_time = parseInt(Date.now() / 1000, 10) - 24 * 60 * 60; // One day ago
					var last_updated = getValue(currency_type + "to" + local_currency + "_time") || expire_time - 1;

					if (last_updated < expire_time) {
						get_http("http://api.enhancedsteam.com/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
							complete += 1;
							conversion_rates[available_currencies.indexOf(currency_type)] = parseFloat(txt);
							setValue(currency_type + "to" + local_currency, parseFloat(txt));
							setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
							if (complete == available_currencies.length - 1) { process_data(conversion_rates); }
						});
					} else {
						complete += 1;
						conversion_rates[available_currencies.indexOf(currency_type)] = getValue(currency_type + "to" + local_currency);
						if (complete == available_currencies.length - 1) { process_data(conversion_rates); }
					}	
				} else {
					get_http("http://api.enhancedsteam.com/currency/?" + local_currency.toLowerCase() + "=1&local=" + currency_type.toLowerCase(), function(txt) {
						complete += 1;
						conversion_rates[available_currencies.indexOf(currency_type)] = parseFloat(txt);
						setValue(currency_type + "to" + local_currency, parseFloat(txt));
						setValue(currency_type + "to" + local_currency + "_time", parseInt(Date.now() / 1000, 10));
						if (complete == available_currencies.length - 1) { process_data(conversion_rates); }
					});
				}
			}
		});
	}
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
	$(".clientConnChangingText").before("<div style='float:right;'><p class='clientConnHeaderText'>" + escapeHTML(localized_strings[language].total_time) + ":</p><p class='clientConnMachineText'>" + escapeHTML(total) + " Hours</p></div>");
}

function add_gamelist_sort() {
    if ($(".clientConnChangingText").length > 0) {
		$("#gameslist_sort_options").append("&nbsp;&nbsp;<label id='es_gl_sort_size'><a>" + escapeHTML(localized_strings[language].size) + "</a></label>");
		
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
			
			$(this).html("<span style='color: #B0AEAC;'>" + escapeHTML(localized_strings[language].size) + "</span>");
			var html = $("#gameslist_sort_options").find("span[class='selected_sort']").html();
			html = "<a onclick='location.reload()'>" + html + "</a>";
			$("#gameslist_sort_options").find("span[class='selected_sort']").html(html);
		});
	}
}

function add_gamelist_filter() {
	if ($(".clientConnChangingText").length > 0) {
		var html  = "<span>" + escapeHTML(localized_strings[language].show) + ": </span>";
		html += "<label class='es_sort' id='es_gl_all'><input type='radio' name='es_gl_sort' checked><span><a>" + escapeHTML(localized_strings[language].games_all) + "</a></span></label>";
		html += "<label class='es_sort' id='es_gl_installed'><input type='radio' name='es_gl_sort'><span><a>" + escapeHTML(localized_strings[language].games_installed) + "</a></span></label>";
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
	if (showallachievements) {
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
}

function add_cardexchange_links(game) {
	$(".badge_row").each(function (index, node) {
		var $node = $(node);
		var gamecard = game || get_gamecard($node.find(".badge_row_overlay").attr('href'));
		if(!gamecard) return;
		$node.prepend('<div style="position: absolute; z-index: 3; top: 12px; right: 12px;" class="es_steamcardexchange_link"><a href="http://www.steamcardexchange.net/index.php?gamepage-appid-' + escapeHTML(gamecard) + '" target="_blank" alt="Steam Card Exchange" title="Steam Card Exchange"><img src="' + self.options.img_steamcardexchange + '" width="24" height="24" border="0" /></a></div>');
		$node.find(".badge_title_row").css("padding-right", "44px");
	});
}

function add_badge_filter() {
    if ( $(".profile_small_header_texture a")[0].href == $(".user_avatar a")[0].href) {
		var html  = "<div style='text-align: right;'><span>" + escapeHTML(localized_strings[language].show) + ": </span>";
			html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_all'><input type='radio' name='es_badge_sort' checked><span>" + escapeHTML(localized_strings[language].badges_all) + "</span></label>";
			html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_drops'><input type='radio' name='es_badge_sort'><span>" + escapeHTML(localized_strings[language].badges_drops) + "</span></label>";
			html += "</div>";

		$('.profile_badges_header').append(html);

		var resetLazyLoader = function() { runInPageContext(function() { 
				// Clear registered image lazy loader watchers (CScrollOffsetWatcher is found in shared_global.js)
				CScrollOffsetWatcher.sm_rgWatchers = [];
				
				// Recreate registered image lazy loader watchers
				$J('div[id^=image_group_scroll_badge_images_gamebadge_]').each(function(i,e){
					// LoadImageGroupOnScroll is found in shared_global.js
					LoadImageGroupOnScroll(e.id, e.id.substr(19));
				});
			});
		};
		
		$('#es_badge_all').on('click', function() {
			$('.is_link').css('display', 'block');
		});
		
		$('#es_badge_drops').on('click', function() {
			$('.is_link').each(function () {
				if (!($(this).html().match(/progress_info_bold".+\d/))) {
					$(this).css('display', 'none');
				} else if (parseFloat($(this).html().match(/progress_info_bold".+?(\d+)/)[1]) == 0) {
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
			resetLazyLoader();
		});
	}	
}

function add_badge_sort() {
	if ($(".profile_badges_sortoptions").find("a[href$='sort=r']").length > 0) {
		$(".profile_badges_sortoptions").find("a[href$='sort=r']").after("&nbsp;&nbsp;<a class='badge_sort_option whiteLink' id='es_badge_sort_drops'>" + escapeHTML(localized_strings[language].most_drops) + "</a>&nbsp;&nbsp;<a class='badge_sort_option whiteLink' id='es_badge_sort_value'>" + escapeHTML(localized_strings[language].drops_value) + "</a>");
	}

	var resetLazyLoader = function() { runInPageContext(function() { 
			// Clear registered image lazy loader watchers (CScrollOffsetWatcher is found in shared_global.js)
			CScrollOffsetWatcher.sm_rgWatchers = [];
			
			// Recreate registered image lazy loader watchers
			$J('div[id^=image_group_scroll_badge_images_gamebadge_]').each(function(i,e){
				// LoadImageGroupOnScroll is found in shared_global.js
				LoadImageGroupOnScroll(e.id, e.id.substr(19));
			});
		});
	};

	$("#es_badge_sort_drops").on("click", function() {
		var badgeRows = [];
		$('.badge_row').each(function () {
			var push = new Array();
			if ($(this).html().match(/progress_info_bold".+\d/)) {
				push[0] = this.outerHTML;
				push[1] = $(this).find(".progress_info_bold").html().match(/\d+/)[0];
			} else {
				push[0] = this.outerHTML;
				push[1] = "0";
			}
			badgeRows.push(push);
			this.parentNode.removeChild(this);
		});

		badgeRows.sort(function(a,b) {
			var dropsA = parseInt(a[1],10);
			var dropsB = parseInt(b[1],10);

			if (dropsA < dropsB) {
				return 1;
			} else {
				return -1;
			}	
		});

		$('.badge_row').each(function () { $(this).css("display", "none"); });

		$(badgeRows).each(function() {
			$(".badges_sheet:first").append(this[0]);
		});

		$(".active").removeClass("active");
		$(this).addClass("active");
		resetLazyLoader();
	});

	$("#es_badge_sort_value").on("click", function() {
		var badgeRows = [];
		$('.badge_row').each(function () {
			var push = new Array();
			if ($(this).find(".es_card_drop_worth").length > 0) {
				push[0] = this.outerHTML;
				push[1] = $(this).find(".es_card_drop_worth").html();
			} else {
				push[0] = this.outerHTML;
				push[1] = localized_strings[language].drops_worth_avg;
			}
			badgeRows.push(push);
			$(this).remove();
		});

		badgeRows.sort(function(a, b) {
			var worthA = a[1];
			var worthB = b[1];

			if (worthA < worthB) {
				return 1;
			} else {
				return -1;
			}
		});

		$('.badge_row').each(function () { $(this).css("display", "none"); });

		$(badgeRows).each(function() {
			$(".badges_sheet:first").append(this[0]);
		});

		$(".active").removeClass("active");
		$(this).addClass("active");
	});	
}

function add_achievement_sort() {
	if ($("#personalAchieve").length > 0 || $("#achievementsSelector").length > 0) {
		if (language == "eng") {
			$("#tabs").before("<div id='achievement_sort_options' class='sort_options'>" + localized_strings[language].sort_by + "<span id='achievement_sort_default'>" + localized_strings[language].theworddefault + "</span><span id='achievement_sort_date' class='es_achievement_sort_link'>" + localized_strings[language].date_unlocked + "</span></div>");
			$("#personalAchieve, #achievementsSelector").clone().insertAfter("#personalAchieve, #achievementsSelector").attr("id", "personalAchieveSorted").css("padding-left", "16px").hide();	

			var achRows = [];
			$("#personalAchieveSorted").find(".achieveUnlockTime").each(function() {
				var push = new Array();
				push[0] = $(this).parent().parent().prev();
				$(this).parent().parent().next().remove();
				$(this).parent().parent().next().remove();
				$(this).parent().parent().next().remove();
				push[1] = $(this).parent().parent();
				var unlocktime = $(this).text().trim().replace(/^.+\: /, "").replace(/jan/i, "01").replace(/feb/i, "02").replace(/mar/i, "03").replace(/apr/i, "04").replace(/may/i, "05").replace(/jun/i, "06").replace(/jul/i, "07").replace(/aug/i, "08").replace(/sep/i, "09").replace(/oct/i, "10").replace(/nov/i, "11").replace(/dec/i, "12");
				var year = new Date().getFullYear();
				if ($(this).text().replace(/^.+\: /, "").match(/^\d/)) {
					var parts = unlocktime.match(/(\d+) (\d{2})(?:, (\d{4}))? \@ (\d+):(\d{2})(am|pm)/);				
				} else {
					var parts = unlocktime.match(/(\d{2}) (\d+)(?:, (\d{4}))? \@ (\d+):(\d{2})(am|pm)/);
				}

				if (parts[3] === undefined) parts[3] = year;
				if (parts[6] == "pm" && parts[4] != 12) parts[4] = (parseFloat(parts[4]) + 12).toString();
				if (parts[6] == "am" && parts[4] == 12) parts[4] = (parseFloat(parts[4]) - 12).toString();
				
				if ($(this).text().replace(/^.+\: /, "").match(/^\d/)) {
					push[2] = Date.UTC(+parts[3], parts[2]-1, +parts[1], +parts[4], +parts[5]) / 1000;
				} else {	
					push[2] = Date.UTC(+parts[3], parts[1]-1, +parts[2], +parts[4], +parts[5]) / 1000;
				}	
				achRows.push(push);
			});

			achRows.sort();

			$(achRows).each(function() {		
				if ($(".smallForm").length > 0) {
					$("#personalAchieveSorted").find("form").next().after("<br clear='left'><img src='http://cdn.steamcommunity.com/public/images/trans.gif' width='1' height='11' border='0'><br>");
					$("#personalAchieveSorted").find("form").next().after(this[1]);
					$("#personalAchieveSorted").find("form").next().after(this[0]);
				} else {
					$("#personalAchieveSorted").prepend("<br clear='left'><img src='http://cdn.steamcommunity.com/public/images/trans.gif' width='1' height='11' border='0'><br>");
					$("#personalAchieveSorted").prepend(this[1]);
					$("#personalAchieveSorted").prepend(this[0]);
				}
			});

			$("#achievement_sort_default").on("click", function() {
				$(this).removeClass('es_achievement_sort_link');
				$("#achievement_sort_date").addClass("es_achievement_sort_link");
				$("#personalAchieve, #achievementsSelector").show();
				$("#personalAchieveSorted").hide();
			});

			$("#achievement_sort_date").on("click", function() {
				$(this).removeClass('es_achievement_sort_link');
				$("#achievement_sort_default").addClass("es_achievement_sort_link");
				$("#personalAchieve, #achievementsSelector").hide();
				$("#personalAchieveSorted").show();
			});
		}
	}
}

function add_badge_view_options() {
    var html  = "<div style='text-align: right;'><span>" + escapeHTML(localized_strings[language].view) + ": </span>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_default'><input type='radio' name='es_badge_view' checked><span>" + escapeHTML(localized_strings[language].theworddefault) + "</span></label>";
		html += "<label class='badge_sort_option whiteLink es_badges' id='es_badge_view_binder'><input type='radio' name='es_badge_view'><span>" + escapeHTML(localized_strings[language].binder_view) + "</span></label>";
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
		$(".gamecards_inventorylink").append("<a class='btn_grey_grey btn_small_thin' href='" + escapeHTML(window.location) + "?border=1'><span>View Foil Badge Progress</span></a>");
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
		var currency_symbol = currency_symbol_from_string($(txt).find(".price, .discount_final_price").text().trim());
		var currency_type = currency_symbol_to_type(currency_symbol);

		get_http("http://api.enhancedsteam.com/market_data/card_prices/?appid=" + game, function(txt) {
			var data = JSON.parse(txt);
			$(".badge_card_set_card").each(function() {
				var node = $(this);
				var cardname = $(this).html().match(/(.+)<div style=\"/)[1].trim().replace(/&amp;/g, '&');
				if (cardname == "") { cardname = $(this).html().match(/<div class=\"badge_card_set_text\">(.+)<\/div>/)[1].trim().replace(/&amp;/g, '&');; }

				var newcardname = cardname;
				if (foil) { newcardname += " (Foil)"; }

				for (var i = 0; i < data.length; i++) {
					if (data[i].name == newcardname) {
						var marketlink = "http://steamcommunity.com/market/listings/" + data[i].url;
						switch (currency_symbol) {
							case "R$":
								var card_price = formatCurrency(data[i].price_brl, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_brl);
								break;
							case "€":
								var card_price = formatCurrency(data[i].price_eur, currency_type); 
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_eur);
								break;
							case "pуб":
								var card_price = formatCurrency(data[i].price_rub, currency_type); 
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_rub);
								break;
							case "£":
								var card_price = formatCurrency(data[i].price_gbp, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_gbp);
								break;
							case "¥":
								var card_price = formatCurrency(data[i].price_jpy, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_jpy);
								break;
							default:
								var card_price = formatCurrency(data[i].price, currency_type);
								if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price);
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
									var card_price = formatCurrency(data[i].price_brl, currency_type);
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_brl);
									break;
								case "€":
									var card_price = formatCurrency(data[i].price_eur, currency_type); 
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_eur);
									break;
								case "pуб":
									var card_price = formatCurrency(data[i].price_rub, currency_type); 
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_rub);
									break;
								case "£":
									var card_price = formatCurrency(data[i].price_gbp, currency_type); 
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_gbp);
									break;
								case "¥":
									var card_price = formatCurrency(data[i].price_jpy, currency_type);
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price_jpy);
									break;	
								default:
									var card_price = formatCurrency(data[i].price, currency_type);						
									if ($(node).hasClass("unowned")) cost += parseFloat(data[i].price);
									break;
							}
						}
					}
				}

				if (marketlink && card_price) {
					var html = "<a class=\"es_card_search\" href=\"" + marketlink + "\">" + localized_strings[language].lowest_price + ": " + card_price + "</a>";
					$(this).children("div:contains('" + cardname + "')").parent().append(html);
				}
			});
			if (cost > 0 && $(".profile_small_header_name .whiteLink").attr("href") == $("#headerUserAvatarIcon").parent().attr("href")) {
				cost = formatCurrency(cost, currency_type);
				$(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + localized_strings[language].badge_completion_cost+ ": " + cost + "</div>");
				$(".badge_empty_right").css("margin-top", "7px");
				$(".gamecard_badge_progress .badge_info").css("width", "296px");
			}
		});
	});
}

function add_badge_completion_cost() {
	$(".profile_xp_block_right").after("<div id='es_cards_worth'></div>");
	get_http("http://store.steampowered.com/app/220/", function(txt) {
		var currency_symbol = currency_symbol_from_string($(txt).find(".price, .discount_final_price").text().trim());
		var currency_type = currency_symbol_to_type(currency_symbol);
		var cur, total_worth = 0, count = 0;
		$(".badge_row").each(function() {
			var game = $(this).find(".badge_row_overlay").attr("href").match(/\/(\d+)\//);
			var foil = $(this).find("a:last").attr("href").match(/\?border=1/);
			var node = $(this);
			if (game) {
				var url = "http://api.enhancedsteam.com/market_data/average_card_price/?appid=" + game[1] + "&cur=" + currency_type.toLowerCase();
				if (foil) { url = url + "&foil=true"; }
				get_http(url, function(txt) {
					if ($(node).find("div[class$='badge_progress_info']").text()) {
						var card = $(node).find("div[class$='badge_progress_info']").text().trim().match(/(\d+)\D*(\d+)/);
						if (card) { var need = card[2] - card[1]; }
					}

					var cost = (need * parseFloat(txt)).toFixed(2);

					if ($(node).find(".progress_info_bold").text()) {
						var drops = $(node).find(".progress_info_bold").text().match(/\d+/);
						if (drops) { var worth = (drops[0] * parseFloat(txt)).toFixed(2); }
					}

					if (worth > 0) {
						total_worth = total_worth + parseFloat(worth);
					}

					cost = formatCurrency(cost, currency_type);
					card = formatCurrency(worth, currency_type);
					worth_formatted = formatCurrency(total_worth, currency_type);

					if (worth > 0) {
						$(node).find(".how_to_get_card_drops").after("<span class='es_card_drop_worth'>" + escapeHTML(localized_strings[language].drops_worth_avg) + " " + escapeHTML(card) + "</span>")
						$(node).find(".how_to_get_card_drops").remove();
					}

					$(node).find(".badge_empty_name:last").after("<div class='badge_info_unlocked' style='color: #5c5c5c;'>" + escapeHTML(localized_strings[language].badge_completion_avg) + ": " + escapeHTML(cost) + "</div>");
					$(node).find(".badge_empty_right").css("margin-top", "7px");
					$(node).find(".gamecard_badge_progress .badge_info").css("width", "296px");

					if (total_worth > 0) {
						$("#es_cards_worth").text(localized_strings[language].drops_worth_avg + " " + worth_formatted);
					}
				});
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
		
		$(".profile_xp_block_right").html("<span style='color: #fff;'>" + escapeHTML(localized_strings[language].card_drops_remaining.replace("__drops__", drops_count)) + "<br>" + escapeHTML(localized_strings[language].games_with_drops.replace("__dropsgames__", drops_games)) + "<br>" + escapeHTML(localized_strings[language].games_with_booster.replace("__boostergames__", booster_games)) + "</span>");
	});
}

function add_friends_that_play() {
	var appid = window.location.pathname.match(/(?:id|profiles)\/.+\/friendsthatplay\/(\d+)/)[1];

	$.get('//store.steampowered.com/api/appuserdetails/?appids=' + appid).success(function(data) {
		if (data[appid].success && data[appid].data.friendsown && data[appid].data.friendsown.length > 0) {
			// Steam Web API is awful, let's do it the easiest way.
			$.get('//steamcommunity.com/my/friends/').success(function(friends_html) {
				friends_html = $(friends_html);

				var friendsown = data[appid].data.friendsown;

				var html = '<div class="mainSectionHeader friendListSectionHeader">';
				html += localized_strings[language].all_friends_own.replace('__friendcount__', friendsown.length);
				html += ' <span class="underScoreColor">_</span>';
				html += '</div>';

				html += '<div class="profile_friends" style="height: ' + (48 * friendsown.length / 3) + 'px;">';

				for (var i = 0; i < friendsown.length; i++) {
					var steamID = friendsown[i].steamid.slice(4) - 1197960265728;
					var friend_html = $(friends_html.find('.friendBlock[data-miniprofile=' + steamID + ']')[0].outerHTML);
					var friend_small_text = localized_strings[language].hours_short.replace('__hours__', Math.round(friendsown[i].playtime_twoweeks / 60 * 10) / 10);
					friend_small_text += ' / ' + localized_strings[language].hours_short.replace('__hours__', Math.round(friendsown[i].playtime_total / 60 * 10) / 10);
					var compare_url = friend_html.find('.friendBlockLinkOverlay')[0].href + '/stats/' + appid + '/compare';
					friend_small_text += '<br><a class="whiteLink friendBlockInnerLink" href="' + compare_url + '">' + localized_strings[language].view_stats + '</a>';
					friend_html.find('.friendSmallText').html(friend_small_text);
					html += friend_html[0].outerHTML;
				}

				html += '</div>';

				$('.friends_that_play_content').append(html);

				// Reinitialize miniprofiles by injecting the function call.

				var injectedCode = 'InitMiniprofileHovers();';
				var script = document.createElement('script');
				script.appendChild(document.createTextNode('(function() { '+ injectedCode +' })();'));
				(document.body || document.head || document.documentElement).appendChild(script);
			});
		}
	});
}

// Add a checkbox to Advanced Search Options to search in names of products only
function search_in_names_only(calledbyajax) {
	var searchterm = $(".search_controls #realterm").val().toLowerCase();
	var itemtitle;
	if(!$("#advanced_search_controls #names_only").length) {
		$("#advanced_search_controls").append('<div class="store_checkbox_button" style="margin-bottom: 8px;" id="names_only">' + localized_strings[language].search_names_only + '</div>');
	}
	if(calledbyajax) {      
		$(".search_result_row:hidden").show();
		if($("#advanced_search_controls #names_only").hasClass("checked")) {
			$(".search_result_row .search_name h4").each(function() {
				itemtitle = $(this).html().toLowerCase();
				if(!$(this).html().toLowerCase().contains(searchterm)) {
					$(this).parent().parent().hide();
					search_threshhold = search_threshhold - 61;
				}
			});
		}    
	} else {
		$("#advanced_search_controls #names_only").off('click').click(function(){
			$(this).toggleClass("checked");
			if($(this).hasClass("checked")) {
				$(".search_result_row .search_name h4").each(function() {
					itemtitle = $(this).html().toLowerCase();
					if(!$(this).html().toLowerCase().contains(searchterm)) {
						$(this).parent().parent().hide();
						search_threshhold = search_threshhold - 61;
					}
				});
			} else {
				$(".search_result_row:hidden").show();
			}
		});
	}
}

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
	showregionalprice,
	showprofilelinks_display,
	showallachievements,
	showlanguagewarninglanguage,
	showlanguagewarning,
	showastats;

$(document).ready(function(){
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
		showprofilelinks_display = data[20];
		showallachievements = data[21];
		showlanguagewarninglanguage = data[22];
		showlanguagewarning = data[23];
		showastats = data[24];

		is_signed_in();

		localization_promise.done(function(){
			if (startsWith(window.location.pathname, "/api")) return;
			if (startsWith(window.location.pathname, "/login")) return;
			if (startsWith(window.location.pathname, "/checkout")) return;
			if (startsWith(window.location.pathname, "/join")) return;

			// On window load...
			add_enhanced_steam_options();
			add_fake_country_code_warning();
			add_language_warning();
			remove_install_steam_button();
			remove_about_menu();
			add_header_links();
			process_early_access();

			switch (window.location.host) {
				case "store.steampowered.com":
					switch (true) {
						case /^\/cart\/.*/.test(window.location.pathname):
							add_empty_cart_button();
							break;

						case /^\/app\/.*/.test(window.location.pathname):
							var appid = get_appid(window.location.host + window.location.pathname);
							load_inventory().done(function() {
								if (getValue(appid+"coupon")) display_coupon_message(appid);
							});
							show_pricing_history(appid, "app");
							dlc_data_from_site(appid);
							add_screenshot_lightbox();

							drm_warnings("app");
							add_metracritic_userscore();
							add_steamreview_userscore(appid);
							display_purchase_date();

							fix_community_hub_links();
							add_widescreen_certification(appid);
							add_hltb_info(appid);
							add_pcgamingwiki_link(appid);
							add_steamcardexchange_link(appid);
							add_app_page_highlights(appid);
							add_steamdb_links(appid, "app");
							add_familysharing_warning(appid);
							add_dlc_page_link(appid);
							add_4pack_breakdown();
							add_steamchart_info(appid);
							add_app_badge_progress(appid);
							add_dlc_checkboxes();
							fix_achievement_icon_size();
							add_astats_link(appid);

							show_regional_pricing();
							break;

						case /^\/sub\/.*/.test(window.location.pathname):
							var subid = get_subid(window.location.host + window.location.pathname);
							drm_warnings("sub");
							subscription_savings_check();
							show_pricing_history(subid, "sub");
							add_steamdb_links(subid, "sub");

							show_regional_pricing();
							break;

						case /^\/agecheck\/.*/.test(window.location.pathname):
							send_age_verification();
							break;

						case /^\/dlc\/.*/.test(window.location.pathname):
							dlc_data_for_dlc_page();
							break;

						case /^\/account\/.*/.test(window.location.pathname):
							account_total_spent();
							return;
							break;

						case /^\/steamaccount\/addfunds/.test(window.location.pathname):
							add_custom_wallet_amount();
							break;

						case /^\/search\/.*/.test(window.location.pathname):
							add_advanced_cancel();
							endless_scrolling();
							remove_non_specials();
							search_in_names_only(false);
							break;

						case /^\/sale\/.*/.test(window.location.pathname):
							show_regional_pricing();
							break;

						// Storefront-front only
						case /^\/$/.test(window.location.pathname):
							add_popular_tab();
							add_carousel_descriptions();
							show_regional_pricing();
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
							add_empty_wishlist_buttons();
							add_wishlist_filter();
							add_wishlist_discount_sort();
							add_wishlist_ajaxremove();
							add_wishlist_notes();

							start_highlights_and_tags();
							break;

						case /^\/(?:id|profiles)\/.+\/\b(home|myactivity|status)\b/.test(window.location.pathname):
							start_friend_activity_highlights();
							bind_ajax_content_highlighting();
							break;

						case /^\/(?:id|profiles)\/.+\/edit/.test(window.location.pathname):    					
							add_es_background_selection();
							break;

						case /^\/(?:id|profiles)\/.+\/inventory/.test(window.location.pathname):
							bind_ajax_content_highlighting();
							inventory_market_prepare();
							break;

						case /^\/(?:id|profiles)\/(.+)\/games/.test(window.location.pathname):
							totaltime();
							totalsize();
							add_gamelist_achievements();
							add_gamelist_sort();
							add_gamelist_filter();
							break;

						case /^\/(?:id|profiles)\/.+\/badges/.test(window.location.pathname):
							add_badge_completion_cost();
							add_total_drops_count();
							add_cardexchange_links();
							add_badge_filter();
							add_badge_sort();
							add_badge_view_options();
							break;

						case /^\/(?:id|profiles)\/.+\/stats/.test(window.location.pathname):
							add_achievement_sort();
							break;

						case /^\/(?:id|profiles)\/.+\/gamecard/.test(window.location.pathname):
							var gamecard = get_gamecard(window.location.pathname);
							add_cardexchange_links(gamecard);
							add_gamecard_market_links(gamecard);
							add_gamecard_foil_link();
							break;

						case /^\/(?:id|profiles)\/.+\/friendsthatplay/.test(window.location.pathname):
							add_friends_that_play();
							break;

						case /^\/(?:id|profiles)\/.+/.test(window.location.pathname):
							add_community_profile_links();
							add_wishlist_profile_link();
							add_supporter_badges();
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
});