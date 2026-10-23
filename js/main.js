(function(){
  var views=document.querySelectorAll('.view'),
      links=document.querySelectorAll('.menu a'),
      info=document.getElementById('info');

  function show(id){
    if(!document.getElementById(id)) id='home';
    views.forEach(function(v){v.classList.toggle('on',v.id===id)});
    links.forEach(function(l){l.classList.toggle('active',l.dataset.view===id)});
    setInfo(false);
    window.scrollTo(0,0);
  }
  function setInfo(open){
    info.classList.toggle('open',open);
    info.setAttribute('aria-hidden',!open);
  }
  document.getElementById('info-open').addEventListener('click',function(){setInfo(true)});
  document.getElementById('info-close').addEventListener('click',function(){setInfo(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setInfo(false)});
  window.addEventListener('hashchange',function(){show(location.hash.slice(1))});
  show(location.hash.slice(1));
})();
