class UnsplashScraper {

    constructor(base_url = "https://unsplash.com/napi/photos",
                per_page = 20,
                total_size = 20,
                page_start = 1,
                order_by = 'latest',
                fetch_imgs = false) {

        this.base_url = base_url;
        this.per_page = per_page;
        this.page_start = page_start;
        this.total_size = total_size;
        this.pages = Math.ceil(this.total_size / this.per_page);
        this.order_by = order_by;
        this.fetch_imgs = fetch_imgs;
    }

    fetchPageImageLinks(page) {

        let pageUrl = `${this.base_url}?page=${page}&per_page=${this.per_page}&order_by=${this.order_by}`;
        let req = new Request(pageUrl,
            {
                method: 'GET',
                headers: {
                    'Upgrade-Insecure-Requests': '1',
                    'Referer': 'https://unsplash.com/',
                    'Connection': 'keep-alive',
                    'x-unsplash-client': 'web'}
            });

        return fetch(req).then(response => response.json().then(results => results.map(e => e['links']['download'])));
    }

    saveImgLinks(links) {
        let csvContent = "";
        links.forEach(function (link) {
            csvContent += link + "\r\n";
        });
        let blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});

        let exportedFilename = "export.csv";

        UnsplashScraper.saveAs(blob, exportedFilename)
    }

    static saveAs(blob, filename) {
        const link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    saveImages(imgs) {
        let zip = new JSZip();
        let imgZip = zip.folder("images");

        imgs.forEach((img, i) => {
            imgZip.file(`${this.page_start}_${this.page_start + this.pages}_${i}.jpg`, img, {base64: false})
        });

        zip.generateAsync({type: "blob"})
            .then(content => UnsplashScraper.saveAs(content, "images.zip"))
    }

    allProgress(proms, progress_cb) {
        let d = 0;
        progress_cb(0);
        proms.forEach((p) => {
            p.then(() => {
                d++;
                progress_cb((d * 100) / proms.length);
            })
        });
        return Promise.all(proms)
    }

    async execute() {
        let pages = Math.ceil(this.total_size / this.per_page);

        let promises = Array(pages).fill().map((_, i) => {
            return this.fetchPageImageLinks(this.page_start + i)
        });
        let data = await Promise.all(promises);
        let links = data.reduce((a, b) => [...a, ...b]);

        if (!this.fetch_imgs) {
            this.saveImgLinks(links)
        } else {
            promises = links.map(link => fetch(link).then(response => response.blob()));
            data = await this.allProgress(promises, (p) => {console.log(`% Done = ${p.toFixed(2)}`)});
            console.log("finished");
            this.saveImages(data);
        }
    }
}

new UnsplashScraper().execute();