function abs_url(relative_url) {
    let a = document.createElement('a');
    a.href = relative_url;
    return a.href;
}

function progress(a, b, verb) {
    const p = (b / a) * 100;
    if (p >= 100) {
        document.getElementById('filact').innerText = "complete";
    }
    document.getElementById('rdf').style.display = 'block';
    document.getElementById('filact').innerText = `${verb} file`;
    document.getElementById('progress-div').style.width = `${p}%`;
}
async function upload(e) {
    console.log(e)
    const enc = e.target.files[0];
    const xhr = new XMLHttpRequest;
    xhr.open("POST", "/upload/");
    xhr.upload.onprogress = e => {
        progress(e.total, e.loaded, 'Uploading')
    };
    xhr.setRequestHeader("X-File-Name", enc.name)
    xhr.onload = async function () {
        document.getElementById('filact').innerText = 'Complete';
        const res = JSON.parse(this.response),
            nonce = res['nonce'],
            file = res['file'],
            url = `/dl/${file}`;

        function copy_this(el, helper) {
            el.select();
            document.execCommand('copy');
            helper && (helper.innerHTML = 'copied')
        }
        window.history.pushState({}, document.title, file);
        document.getElementById('xrhf').style.display = 'block';
        const file_url = document.getElementById('file-url'),
            file_url_helper = document.getElementById('file-url_helper'),
            fname = document.getElementById('fname');
        fname.innerHTML = file;
        file_url.value = abs_url(url);
        file_url.onclick = () => {
            copy_this(file_url, file_url_helper)
        }
    }
    xhr.send(enc);
}