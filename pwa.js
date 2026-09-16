// Installable app behavior and service-worker registration.
(()=>{
  const button=document.getElementById('installAppBtn');
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  let installPrompt=null;

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
  if(!button||standalone)return;

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
    button.classList.remove('hidden');
  });
  if(ios)button.classList.remove('hidden');

  button.addEventListener('click',async()=>{
    if(installPrompt){
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt=null;
      button.classList.add('hidden');
      return;
    }
    if(ios)alert('In Safari, tap the Share button, then choose “Add to Home Screen.”');
  });
  window.addEventListener('appinstalled',()=>button.classList.add('hidden'));
})();
