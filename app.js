const STORE='vyro-data-v1';
const $=s=>document.querySelector(s);
const defaultData={profile:{name:'مستخدم VYRO',bio:'عضو جديد في VYRO'},posts:[{id:'welcome',name:'فريق VYRO',handle:'@vyro',text:'أهلاً بيك في VYRO 👋\nمساحة جديدة تجمعنا. شارك أفكارك ولحظاتك مع الناس، وخلي صوتك جزء من مجتمعنا.',time:'منشور ترحيبي',likes:12,liked:false,comments:[{name:'مريم',text:'متحمسة أشوف المجتمع ده يكبر 💜'}]}]};
let data;try{data=JSON.parse(localStorage.getItem(STORE))||structuredClone(defaultData)}catch{data=structuredClone(defaultData)}
let view='home';let toastTimer;
function save(){localStorage.setItem(STORE,JSON.stringify(data))}
function initials(name){return (name||'أ').trim().slice(0,1)}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function notify(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300)}
function syncProfile(){const n=data.profile.name||'مستخدم VYRO';$('#sideName').textContent=n;$('#sideAvatar').textContent=initials(n);$('#composerAvatar').textContent=initials(n);$('#topProfile').textContent=initials(n)}
function renderPosts(items){const feed=$('#feed');feed.innerHTML='';if(!items.length){feed.innerHTML='<div class="empty-state">مفيش منشورات هنا لسه ✨<br>كن أول واحد يشارك حاجة.</div>';return}
items.forEach(p=>{const el=document.createElement('article');el.className='post-card';const comments=(p.comments||[]).map(c=>'<div class="comment-line"><b>'+escapeHTML(c.name)+'</b> '+escapeHTML(c.text)+'</div>').join('');el.innerHTML='<div class="post-head"><div class="avatar">'+escapeHTML(initials(p.name))+'</div><div class="post-user"><strong>'+escapeHTML(p.name)+'</strong><small>'+escapeHTML(p.time)+'</small></div><button class="more-btn" aria-label="خيارات المنشور">•••</button></div><div class="post-body">'+escapeHTML(p.text)+'</div><div class="post-stats">'+(p.likes||0)+' إعجاب · '+(p.comments||[]).length+' تعليق</div><div class="post-actions"><button data-action="like" class="'+(p.liked?'liked':'')+'">'+(p.liked?'♥ أعجبك':'♡ إعجاب')+'</button><button data-action="comment">▢ تعليق</button><button data-action="share">↗ مشاركة</button></div><div class="comments" hidden>'+comments+'<form class="comment-form"><input maxlength="240" placeholder="اكتب تعليقاً..." aria-label="تعليق"><button>إرسال</button></form></div>';
el.querySelector('[data-action="like"]').addEventListener('click',()=>{p.liked=!p.liked;p.likes=Math.max(0,(p.likes||0)+(p.liked?1:-1));save();renderCurrent()});
el.querySelector('[data-action="comment"]').addEventListener('click',()=>{const box=el.querySelector('.comments');box.hidden=!box.hidden});
el.querySelector('.comment-form').addEventListener('submit',e=>{e.preventDefault();const input=e.currentTarget.querySelector('input');const text=input.value.trim();if(!text)return;p.comments=p.comments||[];p.comments.push({name:data.profile.name,text});save();renderCurrent();notify('تم إضافة تعليقك')});
el.querySelector('[data-action="share"]').addEventListener('click',async()=>{const shareData={title:'VYRO',text:p.text+' — '+p.name};try{if(navigator.share)await navigator.share(shareData);else{await navigator.clipboard.writeText(shareData.text);notify('تم نسخ المنشور')}}catch{}});
el.querySelector('.more-btn').addEventListener('click',()=>{if(p.name===data.profile.name&&confirm('حذف المنشور؟')){data.posts=data.posts.filter(x=>x.id!==p.id);save();renderCurrent();notify('تم حذف المنشور')}});feed.append(el)})}
function renderCurrent(){let posts=[...data.posts].reverse();if(view==='explore'){$('#viewTitle').textContent='استكشف المنشورات';}else if(view==='profile'){$('#viewTitle').textContent='منشوراتي';posts=posts.filter(p=>p.name===data.profile.name)}else if(view==='notifications'){$('#viewTitle').textContent='الإشعارات';posts=[];$('#feed').innerHTML='<div class="empty-state">أنت على اطلاع بكل جديد 💜<br>الإشعارات الحقيقية هتتوفر مع ربط الخادم.</div>';return}else{$('#viewTitle').textContent='آخر المنشورات'}const q=$('#searchInput').value.trim().toLowerCase();if(q)posts=posts.filter(p=>(p.text+' '+p.name).toLowerCase().includes(q));renderPosts(posts)}
function setView(next){view=next;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));renderCurrent()}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#publishBtn').addEventListener('click',()=>{const text=$('#postText').value.trim();if(!text){$('#postText').focus();return}data.posts.push({id:Date.now().toString(),name:data.profile.name, text,time:'الآن',likes:0,liked:false,comments:[]});save();$('#postText').value='';$('#charCount').textContent='0/1000';setView('home');notify('تم نشر منشورك على هذا الجهاز')});
$('#postText').addEventListener('input',e=>$('#charCount').textContent=e.target.value.length+'/1000');
function openProfile(){ $('#profileName').value=data.profile.name;$('#profileBio').value=data.profile.bio||'';$('#profileDialog').showModal()}
$('#editProfileBtn').addEventListener('click',openProfile);$('#topProfile').addEventListener('click',openProfile);
$('#profileForm').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return;const name=$('#profileName').value.trim();if(!name){e.preventDefault();return}data.profile={name,bio:$('#profileBio').value.trim()};save();syncProfile();renderCurrent();notify('تم حفظ ملفك الشخصي')});
$('#addStory').addEventListener('click',()=>$('#storyDialog').showModal());
$('#searchInput').addEventListener('input',()=>setView(view));
syncProfile();renderCurrent();
let installPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#installBtn').hidden=false});
$('#installBtn').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('#installBtn').hidden=true});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
