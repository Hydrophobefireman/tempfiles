import base64
import os

from flask import (
    Flask,
    Response,
    redirect,
    render_template,
    request,
    send_from_directory,
    session,
    make_response,
    stream_with_context,
)
import json
import secrets
from htmlmin.minify import html_minify
import random
from urllib.parse import quote, urlparse
import requests

app = Flask(__name__)

upload_dir_location = os.path.join(app.root_path, "uploads")
if not os.path.isdir(upload_dir_location):
    os.mkdir(upload_dir_location)
app.secret_key = "ld59OQNgflac7xv2Ig-ciUZEF6"
config = {"DEBUG": False}


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
        while fs:
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
    with open(os.path.join(upload_dir_location, xfn), "wb") as f:
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
    ua = request.headers.get("user-agent", "Mozilla/5.0")
    parsed_url = urlparse(url)
    if not parsed_url.scheme == "http" or not parsed_url.scheme == "https":
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
    resp = redirect("/get~file/?f=" + quote(f))
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
