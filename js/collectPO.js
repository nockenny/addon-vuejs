var RKPO = {
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


        const branch = $('a:nth(1)', '.detail-page-description:first').text();

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
        a.setAttribute('download', RKPO.downloadFileName() + '.csv');
        window.document.body.appendChild(a);
        a.click();
    },
    getItem: function(element) {
        let parent = $(element).parents('.js-discussion-container')
        let parentHeader = $(element).parents('.note-header-info')
        let comments = $('.notes_holder li.note-comment .note-body', $('.discussion-body', parent))
        let comment = $(comments.get(0)).html()
        let answer = $(comments.get(1)).html()
        let timeComment = $('time:first', parentHeader).attr('datetime')
        let linkComment = $('.notes_holder li.note-comment li.js-btn-copy-note-link', $('.discussion-body', parent)).attr('data-clipboard-text')

        let item = {
            task: $('h1.title').html(),
            reviewer: $('a>span:first', parentHeader).text(),
            implementer: $('a.author-link', '.detail-page-description:first').data('username'),
            time: timeComment.substr(0, 10),
            fileName: $('.js-file-title', '.discussion-body').data('qaFileName'),
            comment: comment.replace(/<[^>]*>/g, ""),
            answer: answer != undefined ? answer.replace(/<[^>]*>/g, "") : "",
            link: linkComment
        }
        return item;
    },
    collect: async function() {
        let dataCsv = []
        let threads = $('button', '.note-discussion .discussion-actions:not(.btn-group)');
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
            let element = threads.get(i);
            let item;
            if (/.Show./.test($(element).html())) {
                $(element).trigger('click', true)
                var parent = $(element).parents('.js-discussion-container')
                $('.discussion-body', parent).css({"display":"none"})

                await new Promise(resolve => setTimeout(resolve, 1))
                item = RKPO.getItem(element);
                $(element).trigger('click')
            } else {
                item = RKPO.getItem(element);
            }
            dataCsv.push(item)
        }
        RKPO.download(dataCsv)
        RKPO.download(dataCsv)
        RKPO.download(dataCsv)
    }
}
