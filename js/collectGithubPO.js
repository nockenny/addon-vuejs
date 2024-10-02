var RKGithubPO = {
    dataPO: [],
    totalPO: 0,
    countPOGetted: 0,
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
    download: function() {
        const csvString = RKGithubPO.dataPO.map(row =>
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
    getItem: function(threadId) {
        // var html = $.ajax({
        //     type: "GET",
        //     url: "https://github.com/nockenny/addon-vuejs/pull/1/threads/" + threadId + "?rendering_on_files_tab=false",
        //     async: false
        // }).responseText;

        $.ajax({
            type: "GET",
            url: "https://github.com/nockenny/addon-vuejs/pull/1/threads/" + threadId + "?rendering_on_files_tab=false",
            async: true
        }).done(function(html) {
            RKGithubPO.countPOGetted += 1

            console.log(`hoàn thành: ${RKGithubPO.countPOGetted}/${RKGithubPO.totalPO}`)

            let comments = $('.timeline-comment-group', html);
            let comment = $('div.comment-body ', comments.get(0)).html()
            let answer = "Chua tra loi"
            if (comments > 1) {
                answer = $('div.comment-body ', comments.get(1)).html()
            }
            let timeComment = $('relative-time:first', $(comments.get(0))).attr('datetime')
            let linkComment = $('relative-time:first', $(comments.get(0))).parent().attr('href')
            if (timeComment == undefined) {
                debugger;
            }

            RKGithubPO.dataPO.push({
                task: $('h1 .js-issue-title').html(),
                reviewer: $('a.author:first').text(),
                implementer: $('a.assignee', 'form[aria-label="Select assignees"]').text(),
                time: timeComment.substr(0, 10),
                fileName: "$('summary a', element).html()",
                comment: comment.replace(/<[^>]*>/g, ""),
                answer: answer != undefined ? answer.replace(/<[^>]*>/g, "") : "",
                link: document.location.href + linkComment
            })

            if (RKGithubPO.countPOGetted == RKGithubPO.totalPO) {
                RKGithubPO.download()
            } 
        });
    },
    collect: async function() {
        let threadIds = []

        // lấy content thread hiện có
        let threads = $('div[id^=pullrequestreview]', '.js-timeline-item.js-timeline-progressive-focus-container');
        for (var i = 0; i < threads.length ; i++) {
            let element = $('turbo-frame', threads[i]);
            element.each(function(i, e) {
                let id = $(e).attr('id')
                let threadId = id.match(/(\d+)/)[0]
                threadIds.push(threadId);
            })
        }

        // Lấy comment ẩn
        $('form.js-review-hidden-comment-ids').each(function(i, e) {
            var html = $.ajax({
                type: "GET",
                url: e.action,
                async: false
            }).responseText;

            $(html).each(function(i, e) {
                let id = $(e).attr('id')
                if (id != undefined) {
                    let threadId = id.match(/(\d+)/)[0]
                    threadIds.push(threadId);
                }
            })
        })

        threadIds.sort()
        RKGithubPO.countPOGetted = 0
        RKGithubPO.totalPO = threadIds.length
        RKGithubPO.dataPO = []

        RKGithubPO.dataPO.push({
            task: "task",
            reviewer: "reviewer",
            implementer: "implementer",
            time: "time",
            fileName: "fileName",
            comment: "comment",
            answer: "answer",
            link : "link"
        })

        for (let i = 0; i < threadIds.length ; i++) {
            let item = RKGithubPO.getItem(threadIds[i]);
        }
        console.log('done call thread')
    }
}
