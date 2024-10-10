NOC_HIGHTLIGHT1 = {
	getted: {},
	data: [],
	hidden: false,
	getData: function() {
		if (!NOC_HIGHTLIGHT1.hidden) {
			return NOC_HIGHTLIGHT1.data;
		}
		date = new Date();
		const currentDay = date.getDay();
			
		// Tính ngày đầu tuần (Thứ Hai)
		const startOfWeek = new Date(date);
		startOfWeek.setDate(date.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
		const weekDates = [];
		for (let i = 0; i < 7; i++) {
			const day = new Date(startOfWeek);
			day.setDate(startOfWeek.getDate() + i);
			
			const dayStr = String(day.getDate());
			const monthStr = String(day.getMonth() + 1);
			const yearStr = String(day.getFullYear()).slice(-2);
			weekDates.push(`${dayStr}${monthStr}${yearStr}`);
		}

		return NOC_HIGHTLIGHT1.data.filter(item => {
			if (item == undefined || item.url == undefined) return;
			var dmy = item.url.match(/-(\d+)/)[1];
			console.log(weekDates)
			return weekDates.includes(dmy)
		});
		
	},
	getLink: function(code) {
		if (NOC_HIGHTLIGHT1.getted[code]) {
			return;
		}
		NOC_HIGHTLIGHT1.getted[code] = true;

		var html = $.ajax({
            type: "GET",
            url: "https://api.vebo.xyz/api/news/mitom2/detail/" + code,
            async: false
        }).responseText;
		var dataJson = JSON.parse(html)


		NOC_HIGHTLIGHT1.data.push({
			title: dataJson.data.title,
			url: dataJson.data.video_url,
			link: dataJson.data.video_url + '#' + dataJson.data.slug + ".mp4"
		})
	},
	execute: function() {
		var html = $.ajax({
            type: "GET",
            url: "https://live.90phut120.live/highlights",
            async: false
        }).responseText;

		let links = $('.item-highlight a', html);
		links.each(function name(i, a) {
			hlLink = a.href
			hlLinks = hlLink.split("-")
			NOC_HIGHTLIGHT1.getLink(hlLinks[hlLinks.length - 1])
		})
	}
}