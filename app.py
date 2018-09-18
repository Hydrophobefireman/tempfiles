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
)
import json
import secrets
from htmlmin.minify import html_minify
import random

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

@app.route("/create-metadata/", methods=["POST"])
def make_json_():
    data = request.get_json()
    _n_ = request.headers.get("x-nonce")
    filename = session.get("nonce").get(_n_)
    if not filename:
        return "NO", 403
    meta_file = os.path.join(upload_dir_location, f"{filename}.meta_data.json")
    with open(meta_file, "w") as f:
        f.write(json.dumps(data))
    return "OK", 201


@app.route("/speedtest/", strict_slashes=False)
def speed_test():
    return html_minify(render_template("speed.html"))


@app.route("/s/generate-file/")
def send_bin():
    size = 50 * 1024 * 1024

    def random_gen(fs):
        while fs:
            fs -= 4096
            yield os.getrandom(4096)

    return Response(
        random_gen(size),
        content_type="application/octet-stream",
        headers={"content-length": size},
    )


@app.route("/upload/", methods=["POST"])
def uplaod():
    fn = secrets.token_urlsafe(10)
    file = os.path.join(upload_dir_location, fn)
    with open(file, "wb") as f:
        while 1:
            chunk = request.stream.read(4096 * 1024)
            if chunk:
                f.write(chunk)
            else:
                break
    nonce = secrets.token_urlsafe(25)
    session["nonce"] = {nonce: fn}
    return Response(
        json.dumps({"file": fn, "nonce": nonce}), mimetype="application/json"
    )


if not os.environ.get("JufoKF6D6D1UNCRrB"):

    @app.route("/s/uploads/", methods=["POST"])
    def no_nginx_upload_handler():
        data = request.data
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
        res.headers["Content-Type"] = "application/octet-stream"
        return res


@app.route("/dl/<f>/")
def dl(f):
    iv = request.args.get("iv")
    if not f or not os.path.isfile(os.path.join(upload_dir_location, f)) or not iv:
        return Response(
            json.dumps({"error": f"No file Name provided or file: {f} has expired"})
        )
    return html_minify(render_template("file.html", f=f, iv=iv))


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
