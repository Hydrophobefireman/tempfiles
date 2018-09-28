const repeat = (n, func, args = []) => {
    const buf = Array(Math.max(0, n));
    for (let i = 0; i < buf.length; i++) {
        buf[i] = func(...args)
    }
    return buf
}
const simple_blocking_calc = async (baseNumber = 5) => {
    const start = performance.now();
    let result = 0;
    for (let i = baseNumber ** 10; i >= 0; i--) {
        result += Math.atan(i) * Math.tan(i);
    };
    console.log("{NR}:", result)
    return performance.now() - start;
}

const videoframes = () => {
    return new Promise(async (resolve, _) => {
        async function merge_blobs(blobs) {
            class BlobJoiner {
                constructor() {
                    this.parts = []
                }
                append(part) {
                    this.parts.push(part);
                    this.blob = undefined; // Invalidate the blob
                }
                getBlob() {
                    if (!this.blob) {
                        this.blob = new Blob(this.parts, {
                            type: "image/png"
                        })
                    }
                    return this.blob
                }
            }

            const Joiner = new BlobJoiner;
            for (blob of blobs) {
                Joiner.append(blob)
            }
            const bb = Joiner.getBlob()
            const img = new Image;
            document.body.appendChild(img);
            //img.style.display = 'none';
            img.src = URL.createObjectURL(bb)
        }
        window.pngbuf = []
        const start = performance.now();
        const __url__ = `/get-cors/${encodeURIComponent('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4')}`;
        const video_url = __url__;
        let i = 0;
        const thumbs_div = document.createElement("div");
        //thumbs_div.style.display = 'none';
        document.body.appendChild(thumbs_div)
        const video = document.createElement("video");
        const thumbs = thumbs_div;
        video.addEventListener('loadeddata', () => {
            thumbs.innerHTML = "";
            video.currentTime = i;
        }, false);
        video.addEventListener('seeked', () => {
            repeat(100, async () => {
                await generateThumbnail(i);
            })
            i++;
            if (i <= video.duration) {

                video.currentTime = i;
            } else {
                console.log("{NR}:", "Finished")
                merge_blobs(window.pngbuf)
                resolve(performance.now() - start)
            }
        }, false);

        video.preload = "auto";
        video.src = video_url

        async function generateThumbnail() {
            const c = document.createElement("canvas");
            const ctx = c.getContext("2d");
            c.width = 160;
            c.height = 90;
            ctx.drawImage(video, 0, 0, 160, 90);
            const im = new Image;
            im.src = c.toDataURL();
            blb = c.toBlob(
                b => {
                    console.log("PNGBUF")
                    window.pngbuf.push(b)
                }, 'image/png')
            thumbs.appendChild(im);
        }
    });
}

async function base64ToArrayBuffer(b64) {
    const data = await fetch(`data:application/octect-stream;base64,${b64}`);
    return await data.arrayBuffer()
}

const image_test = async () => {
    const s = performance.now(),
        type = 'image/jpg',
        evtSource = new Request("/imgs-source/"),
        dat = await fetch(evtSource),
        buf = new Uint8Array(await base64ToArrayBuffer(await dat.text())).reverse().buffer,
        blob = new Blob([buf], {
            type
        }),
        img = new Image();
    //document.body.appendChild(img);
    //img.style.display = 'none';
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    img.onload = e => {
        ctx.drawImage(e.target, 0, 0, 1920 * 4, 1080 * 4)
    }
    c.height = 1920 * 4;
    c.width = 1080 * 4;
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(c);
    //c.style.display = 'none';
    return (performance.now() - s)
};
const enc_test = async (s = 65536) => {
    /*
    Encrypts a random array buffer 5000 times
     */
    const iv = crypto.getRandomValues(new Uint8Array(16)),
        key = await crypto.subtle.generateKey({
            'name': 'AES-CBC',
            'length': 256
        }, true, ['encrypt', 'decrypt']),
        a = performance.now(),
        rv_context = crypto.getRandomValues.bind(crypto);
    let data = rv_context(new Uint8Array(s)).buffer;
    console.log("{NR}:", data);
    i = 0;
    while (i < 5000) {
        data = await crypto.subtle.encrypt({
            name: 'AES-CBC',
            iv
        }, key, data);
        i += 1;
    }

    const timeperiod = performance.now() - a
    console.log("{NR}:", data);
    console.log("{NR}:", "Time Taken:", timeperiod)
    return timeperiod
}

window.funcs = [
    simple_blocking_calc, videoframes, image_test, enc_test
]
const avg = 8400