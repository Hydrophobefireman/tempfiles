class LazyLoader {
    constructor(imageclass) {
        this.imgClass = imageclass
    }
    loadLazily() {
        document.addEventListener("DOMContentLoaded", function () {
            const lazyImages = [].slice.call(document.getElementsByClassName(this.imgClass));
            let lazyImageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        let lazyImage = entry.target;
                        lazyImage.src = lazyImage.dataset.src;
                        lazyImage.classList.remove(this.imageclass);
                        lazyImageObserver.unobserve(lazyImage);
                    }
                });
            });
            lazyImages.forEach(lazyImage => {
                lazyImageObserver.observe(lazyImage);
            });
        })
    }
}