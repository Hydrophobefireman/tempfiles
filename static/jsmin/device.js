const repeat=(e,t,n=[])=>{const o=Array(Math.max(0,e));for(let e=0;e<o.length;e++)o[e]=t(...n);return o},simple_blocking_calc=async(e=5)=>{const t=performance.now();let n=0;for(let t=e**10;t>=0;t--)n+=Math.atan(t)*Math.tan(t);return console.log("{NR}:",n),performance.now()-t},videoframes=()=>new Promise(async(e,t)=>{window.pngbuf=[];const n=performance.now(),o=`/get-cors/${encodeURIComponent("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4")}`;let a=0;const r=document.createElement("div");document.body.appendChild(r);const c=document.createElement("video"),s=r;c.addEventListener("loadeddata",()=>{s.innerHTML="",c.currentTime=a},!1),c.addEventListener("seeked",()=>{repeat(100,async()=>{await async function(){const e=document.createElement("canvas"),t=e.getContext("2d");e.width=160,e.height=90,t.drawImage(c,0,0,160,90);const n=new Image;n.src=e.toDataURL(),blb=e.toBlob(e=>{console.log("PNGBUF"),window.pngbuf.push(e)},"image/png"),s.appendChild(n)}()}),++a<=c.duration?c.currentTime=a:(console.log("{NR}:","Finished"),async function(e){const t=new class{constructor(){this.parts=[]}append(e){this.parts.push(e),this.blob=void 0}getBlob(){return this.blob||(this.blob=new Blob(this.parts,{type:"image/png"})),this.blob}};for(blob of e)t.append(blob);const n=t.getBlob(),o=new Image;document.body.appendChild(o),o.src=URL.createObjectURL(n)}(window.pngbuf),e(performance.now()-n))},!1),c.preload="auto",c.src=o});async function base64ToArrayBuffer(e){const t=await fetch(`data:application/octect-stream;base64,${e}`);return await t.arrayBuffer()}const image_test=async()=>{const e=performance.now(),t=new Request("/imgs-source/"),n=await fetch(t),o=new Uint8Array(await base64ToArrayBuffer(await n.text())).reverse().buffer,a=new Blob([o],{type:"image/jpg"}),r=new Image,c=document.createElement("canvas"),s=c.getContext("2d");return r.onload=(e=>{s.drawImage(e.target,0,0,7680,4320)}),c.height=7680,c.width=4320,r.src=URL.createObjectURL(a),document.body.appendChild(c),performance.now()-e},enc_test=async(e=65536)=>{const t=crypto.getRandomValues(new Uint8Array(16)),n=await crypto.subtle.generateKey({name:"AES-CBC",length:256},!0,["encrypt","decrypt"]),o=performance.now();let a=crypto.getRandomValues.bind(crypto)(new Uint8Array(e)).buffer;for(console.log("{NR}:",a),i=0;i<5e3;)a=await crypto.subtle.encrypt({name:"AES-CBC",iv:t},n,a),i+=1;const r=performance.now()-o;return console.log("{NR}:",a),console.log("{NR}:","Time Taken:",r),r};window.funcs=[simple_blocking_calc,videoframes,image_test,enc_test];const avg=8400;