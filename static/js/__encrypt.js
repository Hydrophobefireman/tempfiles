let m_key, m_iv, enc;

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
async function send_file(obj, enc) {
    const xhr = new XMLHttpRequest,
        iv = obj.iv,
        key = obj.key,
        actname = obj.fname,
        mtype = obj.ftp;

    xhr.open("POST", "/upload/");
    xhr.upload.onprogress = e => {
        progress(e.total, e.loaded, 'Uploading')
    };

    function copy_this(el, helper) {
        el.select();
        document.execCommand('copy');
        helper && (helper.innerHTML = 'copied')
    }
    xhr.onload = async function () {
        document.getElementById('filact').innerText = 'Complete';
        const res = JSON.parse(this.response),
            nonce = res['nonce'],
            file = res['file'],
            _url = `/dl/${file}/`,
            dat = {
                filename: actname,
                type: mtype
            };
        await fetch('/create-metadata/', {
            method: 'post',
            body: JSON.stringify(dat),
            headers: {
                "x-nonce": nonce,
                'content-type': 'application/json'
            }
        });
        const url = abs_url(_url);
        const furl = new URL(url);
        const param_url = url_create(furl.search, {
            "iv": iv
        })
        window.history.pushState({}, document.title, `${furl}?${param_url}`);
        document.getElementById('xrhf').style.display = 'block';
        const file_url = document.getElementById('file-url'),
            file_url_input = document.getElementById('file-url_input'),
            file_url_helper = document.getElementById('file-url_helper'),
            pass_key = document.getElementById('pass-key'),
            pass_key_helper = document.getElementById('pass-key_helper'),
            pass_key_input = document.getElementById('pass-key_input'),
            c_direct = document.getElementById('copyall'),
            c_direct_input = document.getElementById('copy-all_input'),
            c_direct_helper = document.getElementById('copy-all_helper'),
            fname = document.getElementById('fname');

        fname.innerHTML = file;
        file_url.innerHTML = url;
        file_url_input.value = url;
        pass_key.innerHTML = key;
        pass_key_input.value = key;
        params = url_create(window.location.search, {
            "key": key,
            iv
        })
        c_direct_input.value = `${url}?${params}`;
        c_direct.onclick = () => {
            copy_this(c_direct_input, c_direct_helper)
        }
        file_url.onclick = () => {
            copy_this(file_url_input, file_url_helper)
        }
        pass_key.onclick = () => {
            copy_this(pass_key_input, pass_key_helper)
        }
    }
    xhr.send(enc);
}

function processFile(evt) {
    const file = evt.target.files[0],
        ftp = file.type,
        fname = file.name;
    const reader = new FileReader();
    reader.onprogress = e => {
        progress(e.total, e.loaded, 'Reading')
    }
    reader.onload = async (e) => {
        const data = e.target.result,
            iv = crypto.getRandomValues(new Uint8Array(16));
        m_iv = await arrayBufferToBase64(iv);
        const key = await crypto.subtle.generateKey({
            'name': 'AES-CBC',
            'length': 256
        }, true, ['encrypt', 'decrypt']);
        m_key = await arrayBufferToBase64(await crypto.subtle.exportKey('raw', key));
        enc = await crypto.subtle.encrypt({
            'name': 'AES-CBC',
            iv
        }, key, data);
        const obj = {
            key: m_key,
            iv: m_iv,
            fname,
            ftp
        }
        send_file(obj, enc)
    }
    reader.readAsArrayBuffer(file);
}

function arrayBufferToBase64(buffer) {
    return new Promise((resolve, _) => {
        const blob = new Blob([buffer], {
            type: 'application/octet-binary'
        });
        const reader = new FileReader();
        reader.onload = evt => {
            const dataurl = evt.target.result;
            resolve(dataurl.substr(dataurl.indexOf(',') + 1));
        };
        reader.readAsDataURL(blob);
    });
}
async function base64ToArrayBuffer(b64) {
    const data = await fetch(`data:application/octect-stream;base64,${b64}`);
    return await data.arrayBuffer()
}


function parseqs(query = window.location.search) {
    const params = {};
    query = query[0] == '?' ? query.substring(1) : query;
    query = decodeURI(query);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
};

class FileDecryptor {
    constructor(__key__) {
        this.key = (() => {
            return __key__ ||
                window.__newkey__ ||
                parseqs()['key']
        })
        this.constants = document.getElementById('constants') || {};
        this.iv = constants.getAttribute('data-js_iv');
        this.filename = constants.getAttribute('data-filename');
        this._get_iv_as_buffer = async iv => {
            const data = await base64ToArrayBuffer(iv);
            return data;
        }
        this._get_crypto = async (key) => {
            const data = await base64ToArrayBuffer(key),
                crptkey = await crypto.subtle.importKey('raw', data, 'AES-CBC', !0, ['encrypt', 'decrypt']);
            return crptkey;
        }
        this.get_data = async () => {
            const __key = this.key() || window.__newkey__;
            if (!__key) {
                return false
            } else {
                const key = await this._get_crypto(__key),
                    iv = this.iv;
                return {
                    key,
                    iv: await this._get_iv_as_buffer(iv)
                };
            }
        };
        this.decrypt = async (obj, enc, mime_type = 'application/octet-stream') => {
            const key = obj.key,
                iv = obj.iv,
                method = 'AES-CBC',
                data = await crypto.subtle.decrypt({
                    name: method,
                    iv
                }, key, enc);
            return new Blob([data], {
                type: mime_type
            })
        }
    }
}

function enter_input(a) {
    const inp = document.getElementById('keyval'),
        btn = document.getElementById('keybtn'),
        dv = document.getElementById('get-key');
    dv.style.display = 'block';
    btn.addEventListener('click', () => {
        window.__newkey__ = decodeURIComponent(inp.value);
        dv.style.display = 'none';
        return _decrypt(a);
    })
};

async function _decrypt(enc_d_) {
    const decrypt = new FileDecryptor();
    const enc_d = enc_d_ || await use_decryptor(decrypt);
    try {
        if (!enc_d) {
            throw Error()
        }
        const meta = enc_d.ret;
        document.title = `Download ${meta.filename}`;
        document.getElementById('filename-dl').innerHTML = `Downloaded:<span style='background-color:#e3e3e3'>${meta.filename}</span>`;
        document.getElementById('dliprgr').innerHTML = 'Download Finished'
        const mime_type = meta.type;
        const data = await decrypt.decrypt(enc_d.data, enc_d.enc, mime_type);
        const url = URL.createObjectURL(data);
        document.getElementById('download-link').style.display = 'block';
        document.getElementById('dl-a').href = url;
        return !0
    } catch (e) {
        console.log(e)
        enter_input(enc_d)
    }

}

function use_decryptor(decrypt) {
    return new Promise((resolve, _) => {
        decrypt.get_data().then(data => {
            if (!data) {
                resolve(null);
            } else {
                const f = decrypt.filename,
                    xhr = new XMLHttpRequest();
                document.getElementById('dl-a').download = f;
                xhr.open('GET', `/get~file/?f=${encodeURIComponent(f)}`);
                xhr.responseType = 'arraybuffer';
                xhr.onprogress = event => {
                    const filesize = event.total;
                    document.getElementById("progrs").style.display = "block";
                    document.getElementById("div_").innerHTML =
                        `${(event.loaded / (1024 * 1024)).toFixed(2)} MB of ${(filesize / (1024 * 1024)).toFixed(2)} MB`;
                    document.getElementById("progrs").style.width = `${((event.loaded / (1024 * 1024)) / (filesize / (1024 *1024))) *100}%`;

                }
                xhr.onload = e => {
                    document.getElementById("div_").innerHTML = 'Complete';
                    document.getElementById("progrs").style.width = '100%';
                    const enc = xhr.response;
                    fetch(`/get~file/?f=${encodeURIComponent(f)}.meta_data.json`).then(data => data.json()).then(ret => {
                        resolve({
                            "enc": enc,
                            "data": data,
                            ret
                        })
                    })
                }
                xhr.send();
            }
        })
    });
}

function url_create(_search, param) {
    const search = new URLSearchParams(_search);
    const keys = Object.keys(param);
    for (const k of keys) {
        v = param[k];
        search.set(k, v)
    }
    return search.toString()
}