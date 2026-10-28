(function(){
  var views=document.querySelectorAll('.view'),
      links=document.querySelectorAll('.menu a'),
      info=document.getElementById('info'),
      tiles=[].slice.call(document.querySelectorAll('.tile')),
      reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      canVT=!!document.startViewTransition&&!reduce,
      sharedNext=false, currentId='home', lastProject=null, lastPairs=[],
      swipeStyle=document.createElement('style');
  document.head.appendChild(swipeStyle);

  /* ---------- basic page switching ---------- */
  function render(id){
    views.forEach(function(v){v.classList.toggle('on',v.id===id)});
    links.forEach(function(l){l.classList.toggle('active',l.dataset.view===id)});
    setInfo(false);
    window.scrollTo(0,0);
  }
  function setInfo(open){
    info.classList.toggle('open',open);
    info.setAttribute('aria-hidden',!open);
  }
  function setName(el,name){
    if(name) el.style.setProperty('view-transition-name',name);
    else el.style.removeProperty('view-transition-name');
  }

  /* ---------- pair landing images with the project page images ---------- */
  // Same filename = same image. Anything left over is matched in order.
  function pairFor(href){
    var sec=document.getElementById(href.slice(1));
    if(!sec) return [];
    var proj=[].slice.call(sec.querySelectorAll('.shot img')),
        rel=tiles.filter(function(t){return t.getAttribute('href')===href})
                 .map(function(t){return t.querySelector('img')}),
        used=[], pairs=[];
    rel.forEach(function(img){
      var j=proj.findIndex(function(p,i){return used.indexOf(i)<0&&p.getAttribute('src')===img.getAttribute('src')});
      if(j>-1){used.push(j);pairs.push([img,proj[j]])}
    });
    rel.forEach(function(img){
      if(pairs.some(function(p){return p[0]===img})) return;
      var j=proj.findIndex(function(p,i){return used.indexOf(i)<0});
      if(j>-1){used.push(j);pairs.push([img,proj[j]])}
    });
    return pairs;
  }

  /* ---------- swipe rules for the other images (run inside the transition) ---------- */
  function swipeCSS(others,mode){
    var w=window.innerWidth, css='';
    others.forEach(function(o){
      var r=o.t.getBoundingClientRect(),
          side=(r.left+r.width/2)<w/2?'l':'r',
          d=Math.min(o.i*35,300);
      if(mode==='out')
        css+='::view-transition-old(tile-'+o.i+'){animation:vt-out-'+side+' .6s cubic-bezier(.6,0,.9,.4) '+d+'ms both}';
      else
        css+='::view-transition-new(tile-'+o.i+'){animation:vt-in-'+side+' .8s cubic-bezier(.16,1,.3,1) '+d+'ms both}';
    });
    swipeStyle.textContent=css;
  }

  /* ---------- navigate with animation ---------- */
  function navigate(id){
    if(!document.getElementById(id)) id='home';
    if(id===currentId) return;
    var from=currentId; currentId=id;

    var mode=null;
    if(sharedNext) mode='out';                                  // gallery -> project
    else if(id==='home'&&from===lastProject) mode='in';         // project -> gallery
    sharedNext=false;

    var pairs=mode?lastPairs:[],
        others=mode?tiles.map(function(t,i){return {t:t,i:i}})
                         .filter(function(o){return o.t.getAttribute('href')!=='#'+lastProject}):[];

    function change(){
      render(id);
      if(mode==='in') swipeCSS(others,'in');
      // if an image's destination is below the fold, let it fade instead of flying off-screen
      pairs.forEach(function(p,i){
        var dest=(id==='home')?p[0]:p[1];
        if(dest.getBoundingClientRect().top>window.innerHeight*0.95){setName(p[0],null);setName(p[1],null)}
      });
    }
    function finish(){
      pairs.forEach(function(p){setName(p[0],null);setName(p[1],null)});
      others.forEach(function(o){setName(o.t,null)});
      swipeStyle.textContent='';
    }

    if(!canVT){change();finish();return}
    pairs.forEach(function(p,i){setName(p[0],'shared-'+i);setName(p[1],'shared-'+i)});
    others.forEach(function(o){setName(o.t,'tile-'+o.i)});
    if(mode==='out') swipeCSS(others,'out');
    var vt=document.startViewTransition(change);
    vt.finished.then(finish,finish);
  }

  tiles.forEach(function(t){
    t.addEventListener('click',function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0) return;
      if(!canVT) return;
      e.preventDefault();
      var id=t.getAttribute('href').slice(1);
      lastProject=id; lastPairs=pairFor('#'+id);
      sharedNext=true; navigate(id); location.hash=id;
    });
  });

  /* ---------- controls ---------- */
  document.getElementById('info-open').addEventListener('click',function(){setInfo(true)});
  document.getElementById('info-close').addEventListener('click',function(){setInfo(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setInfo(false)});
  window.addEventListener('hashchange',function(){navigate(location.hash.slice(1)||'home')});

  var start=location.hash.slice(1);
  if(!document.getElementById(start)) start='home';
  currentId=start; render(start);
})();
