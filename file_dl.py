import os
import secrets
import shutil
import sys
import threading
import time
from urllib.parse import urlparse

import requests


sess = requests.Session()
ua = "Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US)\
 AppleWebKit/604.1.38 (KHTML, like Gecko) Chrome/68.0.3325.162"


class _crayons:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    ___ = ""

    def __init__(self, text, _color=""):
        text = str(text)
        color = getattr(self, _color.upper())
        self.data = color + text + self.ENDC

    def __repr__(self):
        return self.data


def crayons(text, color):
    return str(_crayons(text, "___"))


SAVE_DIR = os.path.join(os.getcwd(), "uploads")
basic_headers = {
    "Accept-Encoding": "gzip, deflate",
    "User-Agent": ua,
    "Upgrade-Insecure-Requests": "1",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "dnt": "1",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
}


def dict_print(s: dict) -> None:
    print("{")
    for k, v in s.items():
        print("%s:%s" % (crayons(k, "OKBLUE"), crayons(v, "okgreen")))
    print("}")


def threaded_req(
    url: str, referer: str, filename: str, __range: str, filesize: int, headers=None
):
    print("filename:", crayons(filename, "warning"))
    if not os.path.isdir(SAVE_DIR):
        os.mkdir(SAVE_DIR)
    parsed_url = urlparse(url)
    file_location = os.path.join(SAVE_DIR, filename)

    dl_headers = headers or {
        **basic_headers,
        "host": parsed_url.netloc,
        "referer": referer,
    }
    print("Downloading with headers:")
    dict_print(dl_headers)
    # So apparently you cant set headers in urlretrieve.....brilliant
    if not __range:
        start_download(url, dl_headers, file_location)
    else:
        ranges = make_range(filesize)
        trys = time.time()
        __loop = [
            threading.Thread(
                target=start_download,
                args=(
                    url,
                    {**dl_headers, "range": f"bytes={_range}"},
                    file_location,
                    ranges.index(_range),
                    filesize,
                ),
            )
            for _range in ranges
        ]
        for t in __loop:
            t.start()
        for t in __loop:
            t.join()
        print()
        print("Making final file")
        make_final_file(filename)
        print("Time Taken:", str(time.time() - trys), " seconds")


def start_download(url, headers, _filename, _index=None, filesize=0):
    _rnges = True if _index is not None else False
    _filename_ = _filename if _index is None else f"{_filename}_{_index}"
    filename = os.path.join(SAVE_DIR, _filename_)
    # print(headers)
    with open(filename, "wb") as f:
        with sess.get(url, headers=headers, stream=True) as r:
            for chunk in r.iter_content(chunk_size=(5 * 1024)):
                if chunk:
                    f.write(chunk)
                    # print(get_size(_filename, ranges=_rnges, fs=filesize))
    print("\nDownloaded CHUNK")


def make_range(_size) -> list:
    if isinstance(_size, str) and _size.isdigit():
        size = int(_size)
    else:
        if not isinstance(_size, int):
            return None
        size = _size
    if size <= 0:
        raise ValueError("Range Can't Be %d" % size)
    _third = (size // 3) - 1
    return [f"0-{_third}", f"{_third+1}-{2*_third}", f"{(2*_third)+1}-{size-1}"]


def get_size(_loc, ranges, fs):
    loc = os.path.join(SAVE_DIR, _loc)
    try:
        if not ranges or os.path.isfile(loc):
            print("FILE")
            size = os.path.getsize(loc)
        else:
            files = [f"{loc}_{s}" for s in range(3)]
            size = sum(os.path.getsize(ss) for ss in files)
            # done = int(50 * size / int(fs))
    except Exception as e:
        raise e
        # done = 1
    return size
    # sys.stdout.write("\r[%s%s] (%s%s)" % ("=" * done, " " * (50 - done), done * 2, "%"))
    # sys.stdout.flush()


def make_final_file(_f):
    f = os.path.join(SAVE_DIR, _f)
    start = time.time()
    files = [f"{f}_{s}" for s in range(3)]
    with open(os.path.join(SAVE_DIR, f), "wb") as file_dest:
        for s in files:
            with open(os.path.join(SAVE_DIR, s), "rb") as file_src:
                shutil.copyfileobj(file_src, file_dest)
    [os.remove(s) for s in files]
    print("Time Taken:", time.time() - start)


def prepare_req(_url, **kwargs):
    referer = kwargs.get("referer", "https://www.google.com/")
    if not kwargs.get("has_headers"):
        with sess.get(
            _url,
            headers={
                **basic_headers,
                "referer": referer,
                "host": urlparse(_url).netloc,
            },
            stream=True,
            allow_redirects=True,
        ) as chunk:
            chunk.raise_for_status()
            for _ in chunk.iter_content(chunk_size=20):
                headers, url = chunk.headers, chunk.url
                chunk.close()  # Sometimed head requests are blocked..
        filesize = headers.get("content-length", " ")
        if (
            not filesize.isdigit()
            or headers.get("accept-ranges", "").lower() != "bytes"
        ):
            _range = False
        else:
            _range = True
    else:
        _range = kwargs["range"]
        filesize = kwargs["filesize"]
        url = _url
        headers = kwargs["headers"]
    filename = kwargs.get("filename", secrets.token_urlsafe(10))
    print(
        crayons(f"Downloading file at:{os.path.join(SAVE_DIR,filename)}", "underline")
    )
    print("headers:", crayons(headers, "bold"))
    return threaded_req(url, referer, filename, _range, filesize)


if __name__ == "__main__":
    url = input("Enter URL:\n")
    filename = input(
        "Enter Filename(leave blank for random filename):\n"
    ) or secrets.token_urlsafe(10)
    referer = input("Enter Referer(leave blank for default)") or "https://google.com/"
    prepare_req(url, filename=filename, referer=referer)
