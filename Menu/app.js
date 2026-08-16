const API='/api';
const ids=[
'aimbot_ativo','aim_mode','aimbot_fov','aimbot_smooth','speed_x','speed_y','bezier_intensity',
'rotation_enabled','rotation_random','rotation_pattern','rotation_angle','rotation_radius',
'rotation_smoothness','rotation_intensity','rotation_progressive','aimassist_ativo','assist_mode',
'aimassist_fov','aimassist_smooth','assist_speed_x','assist_speed_y','bezier_intensity_magnet',
'magnet_rotation_enabled','magnet_rotation_random','magnet_rotation_angle','magnet_rotation_radius',
'magnet_rotation_smoothness','magnet_rotation_intensity','magnet_rotation_progressive',
'triggerbot_ativo','triggerbot_toggle_mode','triggerbot_fovX','triggerbot_fovY','triggerbot_delay',
'head_offset_x','head_offset_y'
];

async function api(path, options={}) {
  try {
    const r=await fetch(API+path,{headers:{'Content-Type':'application/json'},...options});
    if(!r.ok) throw new Error();
    return await r.json();
  } catch(e) { return null; }
}
function setControl(id,v){
  const el=document.getElementById(id); if(!el)return;
  if(el.type==='checkbox')el.checked=!!v;
  else el.value=v;
  updateOutput(el);
}
function updateOutput(el){
  const o=document.querySelector(`output[data-for="${el.id}"]`);
  if(o)o.textContent=el.value;
}
async function push(id){
  const el=document.getElementById(id); if(!el)return;
  const value=el.type==='checkbox'?el.checked:el.value;
  await api('/config',{method:'POST',body:JSON.stringify({key:id,value})});
  updateStatus();
}
async function loadState(){
  const data=await api('/config');
  if(data) Object.entries(data).forEach(([k,v])=>setControl(k,v));
  document.querySelectorAll('input[type=range]').forEach(updateOutput);
  updateModes();updateRotationStatus();
}
function updateModes(){
  const a=document.getElementById('aim_mode').value==='1';
  document.getElementById('smoothControls').classList.toggle('hidden',a);
  document.getElementById('bezierControls').classList.toggle('hidden',!a);
  const m=document.getElementById('assist_mode').value==='1';
  document.getElementById('magSmoothControls').classList.toggle('hidden',m);
  document.getElementById('magBezierControls').classList.toggle('hidden',!m);
  const r=document.getElementById('rotation_random').value==='1';
  document.getElementById('patternWrap').classList.toggle('hidden',r);
}
function updateRotationStatus(){
  const a=document.getElementById('rotation_enabled').checked;
  const m=document.getElementById('magnet_rotation_enabled').checked;
  const el=document.getElementById('rotationStatus');
  el.textContent=(a||m)?'Rotação: ATIVA':'Rotação: INATIVA';
  el.classList.toggle('on',a||m);
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');document.getElementById(b.dataset.page).classList.add('active');
});
ids.forEach(id=>{
  const el=document.getElementById(id); if(!el)return;
  el.addEventListener('input',()=>{updateOutput(el);updateRotationStatus();});
  el.addEventListener('change',()=>{push(id);updateModes();updateRotationStatus();});
});
['aimkey','assist_aimkey','triggerbot_key'].forEach(id=>{
  document.getElementById(id).onclick=async()=>{
    document.getElementById(id).textContent='Press Key...';
    const r=await api('/hotkey',{method:'POST',body:JSON.stringify({action:id})});
    document.getElementById(id).textContent=r?.key||'None';
  };
});

const colors=[
['Purple','#7800c0'],['Anti-Astra','#456e78'],['Yellow','#aaaa00'],['Red','#e02e2e']
];
const colorsList=document.getElementById('colorsList');
colors.forEach((c,i)=>{
  const d=document.createElement('div');d.className='color-option';
  d.innerHTML=`<span class="swatch" style="background:${c[1]}"></span><span>${c[0]}</span>`;
  d.onclick=()=>{document.querySelectorAll('.color-option').forEach(x=>x.classList.remove('selected'));d.classList.add('selected');api('/color',{method:'POST',body:JSON.stringify({mode:i})})};
  colorsList.appendChild(d);
});

let selectedConfig=null;
async function refreshConfigs(){
  const list=document.getElementById('configList');list.innerHTML='';
  const data=await api('/configs');
  (data||[]).forEach((name,i)=>{
    const d=document.createElement('div');d.className='config-item'+(i===selectedConfig?' selected':'');d.textContent=name;
    d.onclick=()=>{selectedConfig=i;document.getElementById('configName').value=name;refreshConfigs()};
    list.appendChild(d);
  });
}
document.getElementById('createConfig').onclick=()=>api('/configs',{method:'POST',body:JSON.stringify({action:'create',name:document.getElementById('configName').value})}).then(refreshConfigs);
document.getElementById('loadConfig').onclick=()=>api('/configs',{method:'POST',body:JSON.stringify({action:'load',index:selectedConfig})});
document.getElementById('saveConfig').onclick=()=>api('/configs',{method:'POST',body:JSON.stringify({action:'save',index:selectedConfig})});
document.getElementById('refreshConfig').onclick=refreshConfigs;
document.getElementById('deleteConfig').onclick=()=>api('/configs',{method:'POST',body:JSON.stringify({action:'delete',index:selectedConfig})}).then(refreshConfigs);

async function updateStatus(){
  const r=await api('/status');
  const c=document.getElementById('connection');
  c.textContent=r?'CONNECTED':'LOCAL UI';
}
loadState();refreshConfigs();updateStatus();setInterval(updateStatus,3000);
