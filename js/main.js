(function(){
  var views=document.querySelectorAll('.view'),
      links=document.querySelectorAll('.menu a'),
      info=document.getElementById('info'),
      tiles=[].slice.call(document.querySelectorAll('.tile')),
      reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      canVT=!!document.startViewTransition&&!reduce,
      busy=false, swipedOut=false, sharedNext=false,
      currentId='home', lastProject=null, lastPairs=[];

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
  function setName(pair,i){
    pair.forEach(function(el){
      if(i===null) el.style.removeProperty('view-transition-name');
      else el.style.setProperty('view-transition-name','shared-'+i);
    });
  }

  /* ---------- navigate with animation ---------- */
  function navigate(id){
    if(!document.getElementById(id)) id='home';
    if(id===currentId) return;
    var from=currentId; currentId=id;

    var shared=[];
    if(sharedNext) shared=lastPairs;                                  // gallery -> project
    else if(id==='home'&&from===lastProject) shared=lastPairs;        // project -> gallery
    sharedNext=false;

    function change(){
      render(id);
      // if an image's destination is below the fold, let it fade instead of flying off-screen
      shared.forEach(function(p,i){
        var dest=(id==='home')?p[0]:p[1];
        if(dest.getBoundingClientRect().top>window.innerHeight*0.95) setName(p,null);
      });
    }
    function finish(){
      shared.forEach(function(p){setName(p,null)});
      if(id==='home') swipeIn();
    }

    if(!canVT){change();finish();return}
    shared.forEach(function(p,i){setName(p,i)});
    var vt=document.startViewTransition(change);
    vt.finished.then(finish,finish);
  }

  /* ---------- landing page: other images swipe away / back ---------- */
  function swipeOut(clicked,done){
    var href=clicked.getAttribute('href'), w=window.innerWidth;
    busy=true; swipedOut=true;
    tiles.forEach(function(t,i){
      if(t.getAttribute('href')===href) return;           // same project stays put
      var delay=Math.min(i*35,300),
          r=t.getBoundingClientRect(),
          dir=(r.left+r.width/2)<w/2?-1:1;
      t.style.transition='transform .6s cubic-bezier(.6,0,.9,.4) '+delay+'ms';
      t.style.transform='translateX('+(dir*(w+40))+'px)';
    });
    setTimeout(function(){busy=false;done()},950);
  }
  function swipeIn(){
    if(!swipedOut) return;
    swipedOut=false;
    void document.body.offsetHeight;
    tiles.forEach(function(t,i){
      var d=Math.min(i*60,500)+'ms';
      t.style.transition='transform .8s cubic-bezier(.16,1,.3,1) '+d;
      t.style.transform='';
    });
    setTimeout(function(){tiles.forEach(function(t){t.style.transition=''})},1500);
  }

  tiles.forEach(function(t){
    t.addEventListener('click',function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0) return;
      if(reduce) return;
      e.preventDefault();
      if(busy) return;
      var id=t.getAttribute('href').slice(1);
      lastProject=id; lastPairs=pairFor('#'+id);
      swipeOut(t,function(){sharedNext=true;navigate(id);location.hash=id});
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
