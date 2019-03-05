function unfade(element) {
  let op = 0.1;
  element.style.display = "block";
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
  element.style.display = "block";
  const timer = setInterval(() => {
    if (parseInt(op) <= 0) {
      clearInterval(timer);
      element.style.display = "none";
    }
    element.style.opacity = op;
    element.style.filter = `alpha(opacity=${op * 100})`;
    op -= op * 0.1;
  }, 15);
}
window.type_data = {
  download: 50,
  upload: 20
};

function show_ans(el, id) {
  const ans = document.getElementById(id);
  if (ans.style.display == "none") {
    unfade(ans);
  } else {
    fade(ans);
  }
}
const infost = document.getElementById("info-st");
infost.onclick = () => {
  show_ans(this, "spdinfo");
};
const start_btn = document.getElementById("start_btn");
start_btn.onclick = () => {
  show_ans(this, "testarea");
  start_btn.innerHTML = "Working On It";
  start_btn.onclick = () => {};
  dl_req()
    .then(_ => {
      console.log("DL_REQ");
      ul_req();
    })
    .then(_ => {
      start_btn.innerHTML = "Final Results";
    });
};
const avg_dl = document.getElementById("avg_dl"),
  avg_ul = document.getElementById("avg_ul");
const check_performance = (tstart, now, el, type = "download") => {
  let units = "MB";
  const to_ev = window.type_data[type],
    time = now - tstart;
  console.log(to_ev, time, type);
  let avg = to_ev / (time / 1000);
  if (avg <= 0.001) {
    units = "KB";
    avg *= 1024;
  }
  el.innerHTML = `speed:${avg.toFixed(3)} ${units}/sec`;
  el.style.display = "block";
};
const dl_req = () => {
  return new Promise(resolve => {
    avg_ul.innerHTML = "Upload will begin after the download";
    avg_ul.style.display = "block";
    fetch("/s/generate-file/")
      .then(res => res.text())
      .then(ret => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", ret);
        xhr.setRequestHeader("X-Filesize", "max");
        xhr.onload = e => {
          console.log(e);
          resolve(
            check_performance(window.dl_start, performance.now(), avg_dl)
          );
        };
        xhr.onprogress = e => {
          const done = e.loaded,
            time = performance.now();
          let avg = done / 1048576 / ((time - window.dl_start) / 1e3),
            units = "MB";
          if (avg <= 0.001) {
            units = "KB";
            avg *= 1024;
          }
          avg_dl.style.display = "block";
          avg_dl.innerHTML = `${avg.toFixed(2)}  ${units}/sec`;
        };
        window.dl_start = performance.now();
        xhr.send();
      });
  });
};

const blobgen = t => {
  return new ArrayBuffer(t);
};
const ul_req = async () => {
  const url = "/s/uploads/",
    payload = blobgen(20 * 1024 * 1024),
    upload_post = async (url, data) => {
      const start = performance.now();
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = e => {
        const done = e.loaded,
          time = performance.now();
        let avg = done / 1048576 / ((time - window.dl_start) / 1e3),
          units = "MB";
        if (avg <= 0.001) {
          units = "KB";
          avg *= 1024;
        }
        avg_ul.style.display = "block";
        avg_ul.innerHTML = `${avg.toFixed(2)}  ${units}/sec`;
      };
      xhr.send(data);
      xhr.onload = () => {
        check_performance(start, performance.now(), avg_ul, "upload");
      };
    };
  avg_ul.innerHTML = "Checking Upload Speed";
  console.log(payload);
  await upload_post(url, payload);
  return "Done";
};
