let next_req = true;
(() => {
    document.getElementById("name-set").onclick = e => {
        e.target.innerHTML = 'Name Changed';
        document.getElementById("download-link").download = document.getElementById("filename").value;
    }
    document.getElementById("filename").onclick = () => {
        document.getElementById("name-set").innerHTML = 'change Name'
    }
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/proxy/f/?u=${encodeURIComponent(window.dlurl)}&referer=${encodeURIComponent(window.dlref)}`);
    xhr.send();
    xhr.onload = () => {
        window.dl_start = performance.now();
        setTimeout(check_download, 1200)
    }
})();
const analyse_perf = (b, c) => {
    const d = document.getElementById("analysed-data"),
        e = document.getElementById("dl_time"),
        f = document.getElementById("dl_speed"),
        a = (c / 1E3).toFixed(2),
        g = (b / 1048576 / a).toFixed(2);
    e.innerHTML = a;
    f.innerHTML = g;
    d.style.display = "block"
};
const check_download = () => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/session/_/progress-poll/", true);
    xhr.onload = () => {
        data = JSON.parse(xhr.response);
        if (data.hasOwnProperty("error")) {
            next_req = false;
        }
        if (data.hasOwnProperty("file")) {
            document.getElementById("download-link").href = data.link;
            document.getElementById("dl-button").style.display = 'block';
            next_req = false;
            document.getElementById('till-done').innerHTML = "100";
            document.getElementById("progressbtn").style.width = "100%";
            window.dl_end = performance.now() - window.dl_start;
            analyse_perf(data.total, window.dl_end)

        }
        const done = parseInt(data.done);
        const total = parseInt(data.total);
        const _perc = ((done / total) * 100).toFixed(2);
        const perc = _perc <= 100 ? _perc : 100;
        document.getElementById('till-done').innerHTML = perc;
        document.getElementById("total-size-int").innerHTML = (total / (1024 * 1024)).toFixed(2);
        document.getElementById("progressbtn").style.display = 'block';
        document.getElementById("progressbtn").style.width = `${perc}%`;

    }
    xhr.onerror = () => {
        next_req = false;
    }
    if (next_req) {
        xhr.send();
        setTimeout(check_download, 3000);
    }
}