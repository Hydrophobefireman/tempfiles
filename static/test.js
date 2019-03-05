const blobgen = (t) => {
    let n;
    for (n = ""; 2 * n.length <= t;) n += n + Math.random().toString();
    return n.length > t ? n = n.substring(0, t) : n += n.substring(0, t - n.length), new Blob([n], {
        type: "application/octet-stream"
    })
}