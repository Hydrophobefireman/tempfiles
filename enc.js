const span = document.getElementById('sp_oc'),
    fileu = document.getElementById('file-u')
span.addEventListener('click', (e) => {
    fileu.click()
});
fileu.onchange = e => {
    processFile(e);
}
const m_key, m_iv, enc;

function processFile(evt) {
    var file = evt.target.files[0],
        ftp = file.type,
        reader = new FileReader();
    reader.onload = e => {
        var data = e.target.result,
            iv = crypto.getRandomValues(new Uint8Array(16));
        m_iv = iv;
        crypto.subtle.generateKey({
            'name': 'AES-CBC',
            'length': 256
        }, true, ['encrypt', 'decrypt']).then(key => {
            crypto.subtle.exportKey('raw', key).then(ret => {
                m_key = ret
            });
            return crypto.subtle.encrypt({
                'name': 'AES-CBC',
                iv
            }, key, data);
        }).then(encrypted => {
            console.log(encrypted);
            enc = encrypted;
        }).catch(e => {
            console.error(e);
        });
    }
    reader.readAsArrayBuffer(file);
}