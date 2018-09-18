function unfade(element) {
    let op = 0.1;
    element.style.display = 'block';
    const timer = setInterval(() => {
        if (op >= 1) {
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = `alpha(opacity=${op * 100})`;
        op += op * 0.1;
    }, 10);
}

function fade(element) {
    let op = 0.1;
    element.style.display = 'block';
    const timer = setInterval(() => {
        if (parseInt(op) <= 0) {
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = `alpha(opacity=${op * 100})`;
        op -= op * 0.1;
    }, 15);
}
window.type_data = {
    download: 50,
    upload: 20
}

function show_ans(el, id) {
    const ans = document.getElementById(id);
    if (ans.style.display == "none") {
        unfade(ans);
    } else {
        fade(ans)
    }
}
const infost = document.getElementById('info-st');
infost.onclick = () => {
    show_ans(this, 'spdinfo')
}
const start_btn = document.getElementById('start_btn');
start_btn.onclick = () => {
    show_ans(this, 'testarea');
    dl_req(), ul_req()
}
const avg_dl = document.getElementById('avg_dl'),
    avg_ul = document.getElementById('avg_ul')
const check_performance = (tstart, now, el, type = 'download') => {
    let units = 'MB'
    const to_ev = window.type_data[type],
        time = now - tstart;
    console.log(to_ev, time)
    let avg = to_ev / (time / 1000);
    if (avg <= 0.001) {
        units = 'KB';
        avg *= 1024;
    }
    el.innerHTML = `speed:${avg.toFixed(3)} ${units}/sec`;
    el.style.display = 'block';
}
const dl_req = async () => {
    const xhr = new XMLHttpRequest;
    xhr.open('GET', '/s/generate-file/');
    xhr.setRequestHeader("X-Filesize", 'max');
    xhr.onload = e => {
        check_performance(window.dl_start, performance.now(), avg_dl)
    }
    xhr.onprogress = e => {
        const done = e.loaded,
            time = performance.now();
        let avg = done / 1048576 / ((time - window.dl_start) / 1e3),
            units = 'MB';
        if (avg <= 0.001) {
            units = 'KB';
            avg *= 1024;
        }
        avg_dl.style.display = 'block';
        avg_dl.innerHTML = `${avg.toFixed(2)}  ${units}/sec`;
    }
    window.dl_start = performance.now()
    xhr.send()
}
const ul_req = async () => {
    avg_ul.innerHTML = 'Checking Upload Speed';
    const url = "/s/uploads/",
        payload = new ArrayBuffer(1024 * 1024 * 5),
        upload_post = async (url, data) => {
            const xhr = new XMLHttpRequest;
            xhr.open("POST", url);
            xhr.send(data);
        }, return_new_promises = (func, args, count) => {
            const data = [];
            for (let i = 0; i < count; i++) {
                data.push(func(...args))
                console.log("Number:", i)
            }
            return data
        }
    const start = performance.now()
    const data = await Promise.all([
        return_new_promises(upload_post, [url, payload], 4)
    ]);
    check_performance(start, performance.now(), avg_ul, 'upload')
}