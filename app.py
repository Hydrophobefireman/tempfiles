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
)

app = Flask(__name__)

upload_dir_location = os.path.join(app.root_path, "uploads")
if not os.path.isdir(upload_dir_location):
    os.mkdir(upload_dir_location)


@app.route("/", methods=["POST", "GET"])
def index():
    print(request.headers)
    print((request.form))
    a = request.files
    print(a)
    print(len(request.data))
    return render_template("index.html")


@app.route("/upload/", methods=["POST"])
def uplaod():
    print(request.headers)
    print(
        os.path.isfile(
            os.path.join(upload_dir_location, request.headers.get("X-File-Name", "LEE"))
        )
    )
    return "OK"


@app.route("/ktb", methods=["POST"])
def chk():
    dat = request.data
    return base64.urlsafe_b64encode(dat)


@app.route("/btk", methods=["POST"])
def chh():
    dat = request.data
    return base64.urlsafe_b64decode(dat)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
