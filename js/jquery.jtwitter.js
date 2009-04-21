jQuery.fn.jTwitter = function(args) {
	if(typeof this != 'object') { return; }
	
	var $ = jQuery;
	var jTwitter = $.fn.jTwitter;
	
	jTwitter.options = jTwitter.processArgs(args);
	var options = jTwitter.options;
	
	if(options.username == null) { return; }

	if(typeof jTwitter.list == 'undefined') {
		jTwitter.list = jQuery(jQuery('<ul class="jtwitter jtwitter-user"></ul>'));
		this.append(jTwitter.list);
		var refreshing = false;
	} else {
		jTwitter.list.children('li.new').removeClass('new');
		var refreshing = true;
	}
	
	var url = 'http://twitter.com/statuses/user_timeline/' + options.username + '.json?callback=?';
	
	jQuery.getJSON(
		url,
		{
			'count': options.limit
		},
		function(json) {
			if(refreshing && options.newReplacesOld) { jTwitter.list.empty(); }
			jTwitter.processTweets(json,options,jTwitter.list,refreshing);
		}
	);
	
	if(options.refresh) {
		setInterval(function(){
			this.jTwitter(args);
		},(options.refresh >= 5000 ? options.refresh : options.refresh * 1000))
	}
	
	return this;
}

jQuery.fn.jTwitterSearch = function(args) {
	if(typeof this != 'object') { return; }
	var $ = jQuery;
	var jTwitter = $.fn.jTwitter;
	var jTwitterSearch = $.fn.jTwitterSearch;
	
	jTwitterSearch.options = jTwitter.processArgs(args);
	var options = jTwitterSearch.options;
	
	if(options.term == null) { return; }
	
	if(typeof jTwitterSearch.list == 'undefined') {
		jTwitterSearch.list = jQuery(jQuery('<ul class="jtwitter jtwitter-search"></ul>'));
		this.append(jTwitterSearch.list);
		var refreshing = false;
	} else {
		jTwitterSearch.list.children('li.new').removeClass('new');
		var refreshing = true;
	}
	
	var url = 'http://search.twitter.com/search.json?q=' + encodeURIComponent(options.term) + '&callback=?';

	jQuery.getJSON(
		url,
		{
			'rpp': options.limit
		},
		function(json) {
			if(refreshing && options.newReplacesOld) { jTwitterSearch.list.empty(); }
			jTwitter.processTweets(json,options,jTwitterSearch.list,refreshing);
		}
	);
	
	if(options.refresh) {
		setInterval(function(){
			this.jTwitterSearch(args);
		},(options.refresh >= 5000 ? options.refresh : options.refresh * 1000))
	}
	
	return this;	
}

jQuery.fn.jTwitter.processArgs = function(args,isSearch) {
	var options = {};
	var jTwitter = jQuery.fn.jTwitter;
	if(typeof args == 'string' && args.match(/\=/gi)) { // Handle jQuery serialized form data
		args = unescape(args);
		args = $.makeArray(args.split('&'));
		newArgs = {};
		$.each(args,function() {
			var keyValue = $.makeArray(this.split('='));
			newArgs[keyValue[0]] = keyValue[1];
		});
		args = newArgs;
	}
	
	if(typeof args == 'object') {
		$.each(jTwitter.defaults, function(i,o){
			if((i == 'limit' || i == 'refresh') && typeof args[i] != 'boolean') {
				args[i] = parseInt(args[i],10);
				 if(isNaN(args[i])) {
					args[i] = '';
				}
			}
			options[i] = (typeof args[i] != 'undefined' && args[i] != '' ? args[i] : o);
		});
	} else if(typeof args == 'string') {
		options['username'] = args;
		options['term'] = args;
	} else {
		options = jTwitter.defaults;
	}

	if(options.limit > 200) { options.limit = 200; } // Respect Twitter's count limit

	return options;
}

jQuery.fn.jTwitter.processTweets = function(tweets,options,list,refreshing) {
	var jTwitter = jQuery.fn.jTwitter;
	if(typeof tweets.results != 'undefined') { // This response is from Summize so we have to map it to the Twitter API
		tweets = tweets.results;
	}
	$.each(tweets,function() {
		var tweet = this;
		if(typeof tweet.user == 'undefined') { // This is from Summize so we have to build the user object
			tweet.user = {
				'screen_name': tweet.from_user,
				'profile_image_url': tweet.profile_image_url
			};
		}

		var in_reply_to = (tweet.in_reply_to_status_id ? '<a href="http://twitter.com/' + tweet.in_reply_to_screen_name + '/statuses/' + tweet.in_reply_to_status_id + '/" class="reply">in reply to ' + tweet.in_reply_to_screen_name + '</a>' : false);
		if(options.convertLinks) {
			tweet.text = tweet.text.replace(/(http:\/\/([^\s]+))/,'<a class="inline" href="$1">$1</a>').replace(/@([A-Za-z0-9_-]+)/g,'<a href="http://twitter.com/$1" class="user" title="@$1">@$1</a>').replace(/#([A-Za-z0-9_-]+)/g,'<a href="http://search.twitter.com/search?q=%23$1" class="topic" title="#$1">#$1</a>');
		}
		var listItem = $(jQuery('<li class="tweet"></li>'));
		if(refreshing && !options.newReplacesOld) { listItem.addClass('new'); }
		var userUrl = 'http://twitter.com/' + tweet.user.screen_name + '/';
		var tweetUsername = (!tweet.user.name || tweet.user.name == '' || !options.useFullName ? tweet.user.screen_name : tweet.user.name);
		var html = '';
		if(options.showAvatar) {
			html += '<a href="' + userUrl + '" class="avatar"><img src="' + tweet.user.profile_image_url + '" class="avatar" /></a> ';
		}
		html += '<a href="' + userUrl + '" class="username" title="' + tweetUsername + '">' + tweetUsername + '</a> ';
		html += '<span class="text">' + tweet.text + '</span> ';
		if(options.showDate) {
			html += '<span class="date">' + (options.timeFormat ? new Date(tweet.created_at).toLocaleFormat(options.timeFormat) : new Date(tweet.created_at).toLocaleFormat()) + '</span> ';
		}
		if(options.showInReplyTo && in_reply_to) {
			html += in_reply_to + ' ';
		}
		if(options.showSource && tweet.source) {
			html += '<span class="from">from ' + tweet.source + '</span> ';
		}
		if(options.showOriginal) {
			html += '<a class="view-original" href="http://twitter.com/' + tweet.user.screen_name + '/statuses/' + tweet.id + '/">view on Twitter</a>';
		}
		listItem.html(html)
		listItem.appendTo(list);
	});
}

jQuery.fn.jTwitter.defaults = {
	'username': null,
	'term': null,
	'limit': 20,
	'refresh': false,
	'newReplacesOld': true,
	'useFullName': false,
	'timeFormat': false,
	'showDate': true,
	'showSource': true,
	'showInReplyTo': true,
	'showOriginal': true,
	'showAvatar': true,
	'convertLinks': true
}

jQuery.fn.jtwitter = jQuery.fn.jTwitter;