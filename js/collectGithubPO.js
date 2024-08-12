var RKGithubPO = {
    downloadFileName: function() {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // Pad the numbers with leading zeros
        const paddedMonth = month.toString().padStart(2, "0");
        const paddedDay = day.toString().padStart(2, "0");
        const paddedHours = hours.toString().padStart(2, "0");
        const paddedMinutes = minutes.toString().padStart(2, "0");
        const paddedSeconds = seconds.toString().padStart(2, "0");


        const branch = $('.css-truncate-target', $('.commit-ref.head-ref:first')).text();

        // Create the formatted date string
        return `${branch}_${year}${paddedMonth}${paddedDay}${paddedHours}${paddedMinutes}${paddedSeconds}`;
    },
    download: function(data) {
        //const csvString = data.join('\r\n')
        const csvString = data.map(row =>
            Object.values(row)
            .map(String)  // convert every value to String
            .map(v => v.trim().replaceAll('"', '""'))  // escape double quotes
            .map(v => `"${v}"`)  // quote it
            .join(',')  // comma-separated
        ).join('\r\n');  // rows starting on new lines



        var universalBOM = "\uFEFF";
        var a = window.document.createElement('a');
        a.setAttribute('href', 'data:text/csv; charset=utf-8,' + encodeURIComponent(universalBOM+csvString));
        a.setAttribute('download', RKGithubPO.downloadFileName() + '.csv');
        window.document.body.appendChild(a);
        a.click();
    },
    getItem: function(element) {
        console.log(element);
        // element is tubo frame
        let comments = $('div[id^=discussion]', $('.js-inline-comments-container', element))
        let comment = $('div.comment-body ', comments.get(0)).html()
        let answer = $('div.comment-body ', comments.get(1)).html()
        let timeComment = $('relative-time:first', $(comments.get(0))).attr('datetime')
        let linkComment = $('relative-time:first', $(comments.get(0))).parent().attr('href')
        if (timeComment == undefined) {
            debugger;
        }

        let item = {
            task: $('h1 .js-issue-title').html(),
            reviewer: $('a.author:first').text(),
            implementer: $('a.assignee', 'form[aria-label="Select assignees"]').text(),
            time: timeComment.substr(0, 10),
            fileName: $('summary a', element).html(),
            comment: comment.replace(/<[^>]*>/g, ""),
            answer: answer != undefined ? answer.replace(/<[^>]*>/g, "") : "",
            link: document.location.href + linkComment
        }
        return item;
    },
    collect: async function() {
        let dataCsv = []
        let threads = $('div[id^=pullrequestreview]', '.js-timeline-item.js-timeline-progressive-focus-container');
        
        dataCsv.push({
            task: "task",
            reviewer: "reviewer",
            implementer: "implementer",
            time: "time",
            fileName: "fileName",
            comment: "comment",
            answer: "answer",
            link : "link"
        })

        for (let i = 0; i < threads.length ; i++) {
            let element = $('turbo-frame', threads.get(i));
            element.each(function(i, e) {
                let item = RKGithubPO.getItem(element);
                dataCsv.push(item);
            })
        }
        RKGithubPO.download(dataCsv)
    }
}
