class LazyLoader{constructor(e){this.imgClass=e}loadLazily(){document.addEventListener("DOMContentLoaded",function(){const e=[].slice.call(document.getElementsByClassName(this.imgClass));let s=new IntersectionObserver((e,t)=>{e.forEach(e=>{if(e.isIntersecting){let t=e.target;t.src=t.dataset.src,t.classList.remove(this.imageclass),s.unobserve(t)}})});e.forEach(e=>{s.observe(e)})})}}