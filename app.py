import base64
import hashlib
import json
import os
import random
import secrets
import threading
import time
from urllib.parse import quote, unquote, urlencode, urlparse

import requests
from flask import (
    Flask,
    Response,
    make_response,
    redirect,
    render_template,
    request,
    send_from_directory,
    session,
    stream_with_context,
)
from htmlmin.minify import html_minify

import file_dl

app = Flask(__name__)
ua = "Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US)\
 AppleWebKit/604.1.38 (KHTML, like Gecko) Chrome/68.0.3325.162"

app.secret_key = "7bf9a280"

basic_headers = {
    "Accept-Encoding": "gzip, deflate",
    "User-Agent": ua,
    "Upgrade-Insecure-Requests": "1",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "dnt": "1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
}
upload_dir_location = os.path.join(app.root_path, "uploads")
if not os.path.isdir(upload_dir_location):
    os.mkdir(upload_dir_location)
app.secret_key = "ld59OQNgflac7xv2Ig-ciUZEF6"
config = {"DEBUG": False}

try:
    with open(os.path.join("static", ".mimetypes")) as f:
        _mime_types_ = json.loads(f.read())
except FileNotFoundError:
    _mime_types_ = {}
    print("Blank Mime Types")


@app.route("/")
def index():
    return html_minify(render_template("index.html"))


@app.before_request
def enforce_https():
    print(request.headers)
    if (
        request.endpoint in app.view_functions
        and request.url.startswith("http://")
        and not request.is_secure
        and "127.0.0.1" not in request.url
        and "localhost" not in request.url
        and "herokuapp." in request.url
    ):
        return redirect(request.url.replace("http://", "https://"), code=301)


@app.route("/speedtest/", strict_slashes=False)
def speed_test():
    return html_minify(render_template("speed.html"))


@app.route("/s/generate-file/")
def send_bin():
    size = 50 * 1024 * 1024

    def random_gen(fs):
        _size = 4096 * 1024
        bytesize = _size
        print(fs, bytesize)
        while fs >= 0:
            fs -= bytesize
            print(fs)
            yield os.getrandom(bytesize)

    fn = secrets.token_urlsafe(50)
    filename = os.path.join(app.root_path, "uploads", fn)
    with open(filename, "wb") as f:
        for data in random_gen(size):
            f.write(data)
    return f"/get~file/?f={fn}"


@app.route("/upload/", methods=["POST"])
def uplaod():
    fn = secrets.token_urlsafe(6)
    xfn = request.headers.get("x-file-name")
    with open(os.path.join(upload_dir_location, f"{fn}.data"), "w") as f:
        f.write(xfn)
    with open(os.path.join(upload_dir_location, fn), "wb") as f:
        while 1:
            chunk = request.stream.read(4096 * 1024)
            if chunk:
                f.write(chunk)
            else:
                break
    nonce = secrets.token_urlsafe(25)
    return Response(
        json.dumps({"file": fn, "nonce": nonce}), mimetype="application/json"
    )


@app.route("/imgs-source/")
def send_image():
    img = "image-r.jpg"
    #  img = "test.js"
    imgpath = os.path.join(app.root_path, "static", img)
    with open(imgpath, "rb") as f:
        buf = base64.b64encode(f.read()).decode()
    return Response(response=buf, mimetype="application/octet-stream")


@app.route("/fetch/", strict_slashes=False)
def remote_upl():
    url = request.args.get("url", "").strip()
    parsed_url = urlparse(url)
    if not parsed_url.scheme == "http" and not parsed_url.scheme == "https":
        return f"Invalid URL[Reason:Bad Protocol:{parsed_url.scheme}"
    sess = requests.Session()
    req = sess.get(url, headers={"User-Agent": ua}, allow_redirects=True, stream=True)
    for _ in req.iter_content(chunk_size=10):
        req.close()
    url = req.url
    req_data = req.headers
    mt = req_data.get("Content-Type") or "application/octet-stream"
    session["content-type"] = mt
    session["acc-range"] = req_data.get("accept-ranges", "").lower() == "bytes"
    print("[debug]Response Headers::", req_data)
    filesize = req_data.get("Content-Length")
    print("FileSize:", filesize)
    if filesize is None:  # Web page or a small file probably
        fils = requests.get(url, headers={"User-Agent": ua}, stream=True)
        return Response(
            stream_with_context(fils.iter_content(chunk_size=2048)),
            content_type=fils.headers.get("Content-Type"),
        )
    session["filesize"] = filesize
    return render_template("send_blob.html", url=url)


@app.route("/proxy/f/")
def send_files():
    print("*************\n", request.headers, "*************\n")
    url = unquote(request.args.get("u"))
    referer = request.args.get("referer")
    acc_range = session["acc-range"]
    print("Downloading:'" + url[:50] + "...'")
    _filename = secrets.token_urlsafe(15)
    _mime = _mime_types_.get(session.get("content-type")) or ".bin"
    session["filename"] = _filename + _mime
    thread = threading.Thread(
        target=threaded_req,
        args=(url, referer, session["filename"], acc_range, session["filesize"]),
    )
    thread.start()
    time.sleep(2)
    return "OK"


def checksum_f(filename, meth="sha256"):
    """hashes exactly the first 5 megabytes of a file"""
    foo = getattr(hashlib, meth)()
    _bytes = 0
    total = os.path.getsize(filename)
    with open(filename, "rb") as f:
        while _bytes <= total:
            f.seek(_bytes)
            chunk = f.read(1024 * 4)
            foo.update(chunk)
            _bytes += 1024 * 4
    return foo.hexdigest()


def dict_print(s: dict) -> None:
    print("{")
    for k, v in s.items():
        print("%s:%s" % (k, v))
    print("}")


def threaded_req(url, referer, filename, acc_range, fs):
    print("filename:", filename)
    if not os.path.isdir(upload_dir_location):
        os.mkdir(upload_dir_location)
    parsed_url = urlparse(url)
    #    file_location = os.path.join(upload_dir_location, filename)
    dl_headers = {**basic_headers, "host": parsed_url.netloc, "referer": referer}
    print("Downloading with headers:")
    dict_print(dl_headers)
    # So apparently you cant set headers in urlretrieve.....brilliant
    file_dl.prepare_req(
        url,
        has_headers=True,
        range=acc_range,
        filename=filename,
        filesize=fs,
        headers=dl_headers,
    )
    print("Downloaded File")


@app.route("/session/_/progress-poll/")
def progresses():
    filename = session.get("filename")
    filesize = session.get("filesize")
    if filename is None or filesize is None:
        return json.dumps({"error": "no-being-downloaded"})
    filesize = int(filesize)
    file_location = os.path.join(upload_dir_location, filename)
    try:
        curr_size = file_dl.get_size(file_location, session["acc-range"], filesize)
    except:
        return json.dumps({"error": "file-deleted-from our-storages"})
    if curr_size >= filesize:
        session.pop("filename")
        session.pop("filesize")
        dl_url = "/get~file/?" + urlencode(
            {"f": quote(filename), "hash": checksum_f(file_location)}
        )
        return json.dumps(
            {"file": True, "link": dl_url, "done": curr_size, "total": filesize}
        )
    else:
        return json.dumps({"done": curr_size, "total": filesize})


if not os.environ.get("JufoKF6D6D1UNCRrB"):

    @app.route("/s/uploads/", methods=["POST"])
    def no_nginx_upload_handler():
        data = request.data
        print(len(data))
        del data
        print("Handling File upload through flask")
        return "OK"

    @app.route("/get~file/", strict_slashes=False)
    def send_enc_file():
        print("LOCAL")
        res = make_response(
            send_from_directory(upload_dir_location, request.args.get("f"))
        )
        res.headers["is-NGINX"] = False
        res.headers[
            "Content-Disposition"
        ] = f"attachment; filename={request.args.get('f')}"
        return res


@app.route("/dl/<fn>/")
def dl(fn):
    with open(os.path.join(upload_dir_location, f"{fn}.data"), "r") as h:
        f = h.read()
    resp = redirect(f"/get~file/?f={quote(fn)}&n={quote(f)}")
    return resp


@app.route("/ktb", methods=["POST"])
def chk():
    dat = request.data
    return base64.b64encode(dat)


@app.route("/btk", methods=["POST"])
def chh():
    dat = request.data
    return base64.b64decode(dat)


if __name__ == "__main__":
    config["debug"] = True
    app.run(debug=True, host="0.0.0.0")
