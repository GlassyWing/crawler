class UnsplashScraper {

    constructor(selector = "div._1pn7R:nth-of-type(n) img._2zEKz", prop = "src", num_imgs = 10000) {
        this.selector = selector;
        this.num_imgs = num_imgs;
    }

    loadEles() {
        return document.querySelectorAll(this.selector);
    }

    static saveToDb(allEles) {
        console.log(allEles)
    }

    execute() {

        let allEles = document.querySelectorAll(this.selector);
        let lastEleSize = allEles.length;

        new Executor(300, () => {

            if (allEles.length < this.num_imgs) {
                if (allEles.length === lastEleSize) {
                    window.scrollTo(0, document.body.scrollHeight);
                }
                console.log(allEles.length);
                allEles = document.querySelectorAll(this.selector);
                lastEleSize = allEles.length;
                return true;
            } else {
                UnsplashScraper.saveToDb(allEles);
                return false;
            }
        }).run();
    }
}

class Executor {

    constructor(interval = 300, callback) {
        this.interval = interval;
        this.callback = callback
    }

    run() {
        let interval = this.interval;
        let callback = this.callback;

        let handler = setTimeout(wrap, interval);

        function wrap() {
            let next = callback();
            clearTimeout(handler);
            if (next) {
                handler = setTimeout(wrap, interval)
            }
        }
    }
}

new UnsplashScraper().execute();